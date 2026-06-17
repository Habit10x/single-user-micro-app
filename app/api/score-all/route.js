import { NextResponse } from "next/server"
import { sharpEngine, sharpEngineBatched } from "../../../lib/scoring/sharp-engine"
import sql, { initDb } from "../../../lib/db"

export const dynamic = "force-dynamic"
export const maxDuration = 60

// Known SHARP contexts keyed by scenario shortTitle — used when the exercise matches
const SHARP_CONTEXTS = {
  "Project Update": {
    exerciseTitle: "Articulation-01",
    scenarioText: `Your manager asks: "How's the Horizon project coming along?"`,
    contextBullets:
      "- 4 of 6 emails done, approved by marketing\n" +
      "- Email 3: legal review delay — resolved\n" +
      "- On track for next Friday deadline\n" +
      "- Design team hasn't replied about header format — if no reply by Tuesday, 3-day delay",
    communicationGoal:
      "Give the manager a complete status update so they can make decisions about the live risk without needing to ask follow-up questions.",
    listenerContext:
      "Direct manager. Professional context. Expects: status → key risk → consequence. No time for preamble.",
    stakesLevel: "Intermediate",
    dimensionsWeights: { directness: 35, specificity: 35, hierarchy: 30 },
    failureModes:
      "Burying the live design-team risk after resolved items. Using vague counts ('almost done'). Not naming the 3-day consequence. Treating the resolved legal issue as the lead item.",
    tradeoffNote:
      "The resolved legal issue should be acknowledged briefly — it is past. The design-team risk is present and actionable; it must follow the status immediately.",
  },
  "Show Rec.": {
    exerciseTitle: "Articulation-01",
    scenarioText: `Your friend texts: "Should I watch that thriller series you just finished? I have one evening free."`,
    contextBullets:
      "- 6 episodes. Eps 1–4: gripping, watched all four in one sitting\n" +
      "- Eps 5–6: romance subplot takes over, tension drops significantly\n" +
      "- Finale reveal satisfying but last 20 min feel rushed\n" +
      "- Friend likes thriller series, hates shows that drag",
    communicationGoal:
      "Give a clear yes/no recommendation with specific episode-level evidence so the friend can decide whether to commit their one free evening.",
    listenerContext:
      "Close friend. Casual context. Has one evening free. Specifically hates shows that drag. Trusts your opinion but needs evidence, not enthusiasm.",
    stakesLevel: "Foundation",
    dimensionsWeights: { directness: 25, specificity: 40, listenerOrientation: 35 },
    failureModes:
      "Generic adjectives ('really good', 'interesting story') instead of specific episode details. Not warning about the Eps 5–6 dip. Vague verdict without the episode structure.",
    tradeoffNote:
      "The friend's specific dislike of slow shows makes Eps 5–6 the most listener-critical information.",
  },
  "Missed Meeting": {
    exerciseTitle: "Articulation-01",
    scenarioText: `Your team lead messages: "You weren't on the call — what happened, and what did you miss?"`,
    contextBullets:
      "- Water pipe emergency at 2:50pm — no time to message first\n" +
      "- Caught up with colleague: presentation moved to Thursday (no content change)\n" +
      "- New expense approval: >₹5k needs 2 managers via new form, starts Monday\n" +
      "- Tuesday sync cancelled (public holiday)",
    communicationGoal:
      "Explain the absence in one sentence, then deliver all four missed updates specifically so the team lead has complete information.",
    listenerContext:
      "Team lead. Professional context. Needs to confirm absence was legitimate and that all actionable items are covered.",
    stakesLevel: "Intermediate",
    dimensionsWeights: { directness: 25, specificity: 35, completeness: 25, economy: 15 },
    failureModes:
      "Over-apologizing. Missing one or more of the four specific updates. Giving the absence explanation more than one sentence. Vague references without naming specific items.",
    tradeoffNote:
      "The absence explanation should be one sentence maximum — the rest of the response is the updates.",
  },
  "Explain Role": {
    exerciseTitle: "Articulation-01",
    scenarioText: `A family member asks: "So what is it that you actually do at work? I've never understood."`,
    contextBullets:
      "- Role: Business Analyst at a consumer goods company\n" +
      "- You find why products underperform and write 2–3 page reports for marketing/ops\n" +
      "- Last month: found shelf placement (not pricing) was killing sales in 3 cities\n" +
      "- Time: ~60% data, ~30% meetings, ~10% writing",
    communicationGoal:
      "Make the family member genuinely understand what the role produces and why it matters, using the shelf-placement example as the concrete anchor.",
    listenerContext:
      "Non-technical family member. No business or analytics background. Genuinely curious but has never understood the role.",
    stakesLevel: "Foundation",
    dimensionsWeights: { directness: 25, listenerOrientation: 40, specificity: 35 },
    failureModes:
      "Starting with complexity or jargon. Not using the shelf-placement example. Leading with job title or time breakdown instead of output and impact.",
    tradeoffNote:
      "The shelf-placement example is the most powerful tool available. Any response that omits it loses the listener.",
  },
}

// Generic context built from scenario metadata when no known context exists
function buildGenericContext(meta, exerciseTitle) {
  if (!meta) return {}
  return {
    exerciseTitle: exerciseTitle || "Communication Practice",
    scenarioText: meta.text || "",
    contextBullets: (meta.ctx || []).map(c => `- ${c}`).join("\n"),
    communicationGoal: "Communicate the key information clearly and concisely to the listener.",
    listenerContext: "The listener relevant to the scenario context.",
    stakesLevel: "Foundation",
    dimensionsWeights: { directness: 25, specificity: 25, hierarchy: 25, listenerOrientation: 25 },
  }
}

function buildParticipantData(sharpResults) {
  return Object.entries(sharpResults)
    .sort(([a], [b]) => parseInt(a) - parseInt(b))
    .map(([pos, r]) => {
      const summary    = r.summary || r.oneLiner || ""
      const whatWorked = Array.isArray(r.whatWorked) ? r.whatWorked.join(" ") : (r.whatWorked || "")
      const topImpact  = r.impacts?.[0]?.observation || ""
      const dims       = r.dimensionScores
        ? Object.entries(r.dimensionScores).map(([k, v]) => `${k}: ${v}`).join(", ")
        : ""
      return [
        `SCENARIO ${pos}:`,
        `- Score: ${r.score}/10`,
        dims ? `- Dimension scores: ${dims}` : "",
        `- Summary: "${summary}"`,
        whatWorked ? `- What worked: "${whatWorked}"` : "",
        topImpact  ? `- Primary impact: "${topImpact}"` : "",
      ].filter(Boolean).join("\n")
    })
    .join("\n\n")
}

export async function POST(request) {
  try {
    const { answers, email, name, instance_id, exercise_id, exerciseTitle, scenarios: clientScenarios } =
      await request.json()

    if (!answers || typeof answers !== "object") {
      return NextResponse.json({ error: "Missing answers" }, { status: 400 })
    }

    // Fetch authoritative scenarios + algorithm + scoring mode from DB
    let dbScenarios = null
    let algorithm   = null
    let scoringMode = "parallel" // default
    try {
      await initDb()
      const [scenarioRows, algoRows, settingRows] = await Promise.all([
        exercise_id ? sql`
          SELECT s.short_title, s.prompt, s.context
          FROM scenarios s
          JOIN exercise_scenarios es ON es.scenario_id = s.id
          WHERE es.exercise_id = ${parseInt(exercise_id)}
          ORDER BY es.order_index
        ` : Promise.resolve([]),
        exercise_id ? sql`
          SELECT a.base_prompt, a.dimension_weights, a.name,
                 a.output_schema, a.synthesis_prompt, a.synthesis_schema
          FROM algorithms a
          JOIN exercises e ON e.algorithm_id = a.id
          WHERE e.id = ${parseInt(exercise_id)}
          LIMIT 1
        ` : Promise.resolve([]),
        sql`SELECT value FROM settings WHERE key = 'scoring_mode' LIMIT 1`,
      ])
      if (scenarioRows.length > 0) dbScenarios = scenarioRows
      if (algoRows.length > 0)     algorithm   = algoRows[0]
      if (settingRows[0]?.value)   scoringMode = settingRows[0].value
      console.log(`[score-all] algorithm resolved: ${algorithm ? `"${algorithm.name}"` : "SHARP default"} | mode: ${scoringMode}`)
    } catch (dbErr) {
      console.warn("[score-all] Could not fetch from DB, falling back to defaults:", dbErr?.message)
    }

    // Resolved algorithm values — null means use hardcoded SHARP defaults
    const customBasePrompt   = algorithm?.base_prompt?.trim()     || null
    const customOutputSchema = algorithm?.output_schema?.trim()   || null
    const algoWeights        = algorithm?.dimension_weights && Object.keys(algorithm.dimension_weights).length > 0
      ? algorithm.dimension_weights
      : null

    // Build context for each non-empty answer
    const entries = Object.entries(answers).filter(
      ([, text]) => typeof text === "string" && text.trim().length > 0
    )

    const errorFallback = (pos) => [pos, {
      score: 5,
      scoreConfidence: "LOW",
      pointFirst: false,
      dimensionScores: {},
      oneLiner: "Scoring unavailable for this response.",
      whatWorked: ["The response was submitted and recorded."],
      impacts: [],
      _error: true,
    }]

    const buildContext = (pos) => {
      const position = parseInt(pos) - 1
      let context
      if (dbScenarios?.[position]) {
        const row  = dbScenarios[position]
        const meta = { shortTitle: row.short_title, text: row.prompt, ctx: Array.isArray(row.context) ? row.context : [] }
        context    = SHARP_CONTEXTS[meta.shortTitle] || buildGenericContext(meta, exerciseTitle)
      } else {
        const meta = clientScenarios?.[position]
        context    = SHARP_CONTEXTS[meta?.shortTitle] || buildGenericContext(meta, exerciseTitle)
      }
      if (algoWeights) context = { ...context, dimensionsWeights: algoWeights }
      return context
    }

    let sharpResults

    if (scoringMode === "batched" && entries.length > 0) {
      // ── BATCHED: one API call for all scenarios ──────────────────────────────
      const contextsMap = Object.fromEntries(entries.map(([pos]) => [pos, buildContext(pos)]))
      try {
        sharpResults = await sharpEngineBatched(entries, contextsMap, customBasePrompt, customOutputSchema)
        // Fill in any positions the model skipped
        for (const [pos] of entries) {
          if (!sharpResults[pos]) sharpResults[pos] = errorFallback(pos)[1]
        }
      } catch (err) {
        console.error("[score-all] batched call failed, falling back to error results:", err?.message)
        sharpResults = Object.fromEntries(entries.map(([pos]) => errorFallback(pos)))
      }
    } else {
      // ── PARALLEL: one API call per scenario (default) ────────────────────────
      const scoringPromises = entries.map(async ([pos, userResponse]) => {
        const context = buildContext(pos)
        try {
          const result = await sharpEngine(userResponse, context, customBasePrompt, customOutputSchema)
          return [pos, result]
        } catch (err) {
          console.error(`[score-all] scenario pos ${pos} failed:`, err?.status ?? "", err?.message)
          return errorFallback(pos)
        }
      })
      const results = await Promise.all(scoringPromises)
      sharpResults = Object.fromEntries(results)
    }

    // Synthesis phase — runs after per-scenario scoring if algorithm defines a synthesis_prompt
    let synthesisResult = null
    const synthPrompt = algorithm?.synthesis_prompt?.trim() || null
    if (synthPrompt) {
      try {
        const synthSchema = algorithm?.synthesis_schema?.trim() || null
        const participantData = buildParticipantData(sharpResults)
        synthesisResult = await sharpEngine(participantData, {}, synthPrompt, synthSchema)
      } catch (synthErr) {
        console.error("[score-all] synthesis failed (non-fatal):", synthErr?.message)
      }
    }

    // Save results to DB (best-effort)
    try {
      await initDb()
      const exId = exercise_id ? parseInt(exercise_id) : null
      if (instance_id && name) {
        await sql`
          UPDATE submissions
          SET sharp_results    = ${JSON.stringify(sharpResults)},
              synthesis_result = ${synthesisResult ? JSON.stringify(synthesisResult) : null}
          WHERE instance_id = ${parseInt(instance_id)}
          AND LOWER(TRIM(name)) = LOWER(TRIM(${name}))
        `
      } else if (email && exId) {
        await sql`
          UPDATE submissions
          SET sharp_results    = ${JSON.stringify(sharpResults)},
              synthesis_result = ${synthesisResult ? JSON.stringify(synthesisResult) : null}
          WHERE email = ${email.toLowerCase().trim()} AND exercise_id = ${exId}
        `
      } else if (email) {
        await sql`
          UPDATE submissions
          SET sharp_results    = ${JSON.stringify(sharpResults)},
              synthesis_result = ${synthesisResult ? JSON.stringify(synthesisResult) : null}
          WHERE email = ${email.toLowerCase().trim()}
        `
      }
    } catch (dbErr) {
      console.error("[score-all] DB save failed (non-fatal):", dbErr?.message)
    }

    return NextResponse.json({
      sharpResults,
      synthesisResult,
      _algorithmUsed: algorithm ? { id: algorithm.name, name: algorithm.name, hasCustomPrompt: !!customBasePrompt, hasCustomSchema: !!customOutputSchema } : { name: "SHARP_DEFAULT", hasCustomPrompt: false, hasCustomSchema: false },
    })
  } catch (err) {
    console.error("[score-all] fatal error:", err)
    return NextResponse.json(
      { error: "Scoring temporarily unavailable", sharpError: err?.message || String(err) },
      { status: 503 }
    )
  }
}
