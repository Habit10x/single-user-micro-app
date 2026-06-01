import { NextResponse } from "next/server"
import { sharpEngine } from "../../../lib/scoring/sharp-engine"
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
    scenarioText: `Your friend texts: "Should I watch that crime show you just finished? I have one evening free."`,
    contextBullets:
      "- 6 episodes. Eps 1–4: gripping, watched all four in one sitting\n" +
      "- Eps 5–6: romance subplot takes over, tension drops significantly\n" +
      "- Finale reveal satisfying but last 20 min feel rushed\n" +
      "- Friend likes crime shows, hates shows that drag",
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

export async function POST(request) {
  try {
    const { answers, email, name, instance_id, exercise_id, exerciseTitle, scenarios } =
      await request.json()

    if (!answers || typeof answers !== "object") {
      return NextResponse.json({ error: "Missing answers" }, { status: 400 })
    }

    // Score all non-empty answers in parallel
    const entries = Object.entries(answers).filter(
      ([, text]) => typeof text === "string" && text.trim().length > 0
    )

    const scoringPromises = entries.map(async ([pos, userResponse]) => {
      const position = parseInt(pos) - 1 // 0-indexed position into scenarios array
      const meta = scenarios?.[position]  // {shortTitle, text, ctx}
      const context =
        SHARP_CONTEXTS[meta?.shortTitle] ||
        buildGenericContext(meta, exerciseTitle)

      try {
        const result = await sharpEngine(userResponse, context)
        return [pos, result]
      } catch (err) {
        console.error(`[score-all] scenario pos ${pos} failed:`, err?.status ?? "", err?.message, err?.error ? JSON.stringify(err.error) : "")
        return [
          pos,
          {
            score: 5,
            scoreConfidence: "LOW",
            pointFirst: false,
            dimensionScores: {},
            oneLiner: "Scoring unavailable for this response.",
            whatWorked: ["The response was submitted and recorded."],
            impacts: [],
            _error: true,
          },
        ]
      }
    })

    const results = await Promise.all(scoringPromises)
    const sharpResults = Object.fromEntries(results)

    // Save results to DB (best-effort)
    try {
      await initDb()
      const exId = exercise_id ? parseInt(exercise_id) : null
      if (instance_id && name) {
        await sql`
          UPDATE submissions
          SET sharp_results = ${JSON.stringify(sharpResults)}
          WHERE instance_id = ${parseInt(instance_id)}
          AND LOWER(TRIM(name)) = LOWER(TRIM(${name}))
        `
      } else if (email && exId) {
        await sql`
          UPDATE submissions
          SET sharp_results = ${JSON.stringify(sharpResults)}
          WHERE email = ${email.toLowerCase().trim()} AND exercise_id = ${exId}
        `
      } else if (email) {
        await sql`
          UPDATE submissions
          SET sharp_results = ${JSON.stringify(sharpResults)}
          WHERE email = ${email.toLowerCase().trim()}
        `
      }
    } catch (dbErr) {
      console.error("[score-all] DB save failed (non-fatal):", dbErr?.message)
    }

    return NextResponse.json({ sharpResults })
  } catch (err) {
    console.error("[score-all] fatal error:", err)
    return NextResponse.json(
      { error: "Scoring temporarily unavailable", sharpError: err?.message || String(err) },
      { status: 503 }
    )
  }
}
