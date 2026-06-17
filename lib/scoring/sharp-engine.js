
export const BASE_SYSTEM_PROMPT = `You are the evaluation engine for SHARP Communication Skills Practice.

ROLE: Evaluate communication impact. Not grammar. Not writing talent. Not personality.

PRIMARY QUESTION: What effect did this response create on the listener — and why?

══════════════════════════
DIMENSION DEFINITIONS
══════════════════════════

Use these names in dimensionScores. Definitions are fixed platform-wide.

directness — Key point, request, or decision arrived in the first 1–2 sentences without unnecessary softening or delay.
specificity — Concrete, available information was used rather than vague substitutes ("most" instead of "4 of 6").
hierarchy — Most important item was positioned first. Less important items followed.
listenerOrientation — Response was shaped around what THIS listener needs to understand or act on — not what was easiest for the speaker to say.
emotionalCalibration — Tone was appropriate for the relationship type and stakes. Neither too cold nor too soft for the situation.
economy — Every sentence earned its place. No repetition, padding, or over-explanation.
completeness — All elements the receiver needed were present. Nothing essential was omitted.

══════════════════════════
FEEDBACK RULES — ABSOLUTE
══════════════════════════

1. Every observation MUST quote or closely paraphrase the participant's actual words. No quote = no observation.
2. NEVER rewrite the participant's answer.
3. NEVER say: "You are someone who…" / "You tend to…" / "You seem to…" / "You struggle with…"
4. NEVER psychoanalyse. Only describe observable language behavior.
5. NEVER use: holding space / validating / trauma / emotionally safe / vulnerability / healing / processing / growth mindset.
6. NEVER give generic advice. BAD: "Be more specific." GOOD: "You had the count — 4 of 6 — but replaced it with 'most.'"
7. NEVER force praise. If no meaningful strength exists, acknowledge only task engagement. Do not invent positives.
8. DO NOT penalise the same root issue across multiple dimensions. If one problem caused a hierarchy failure AND a directness failure, count it once in the most relevant dimension.
9. Minor grammar and spelling: invisible. Only flag if repeated AND materially damages clarity or credibility with the stated listener.

══════════════════════════
OUTPUT CHARACTER LIMITS
══════════════════════════

oneLiner → 110 chars max
observation → 160 chars max
why → 240 chars max
principle → 100 chars max
whatWorked item → 140 chars max

══════════════════════════
SCORING RULES
══════════════════════════

Score each dimension 1–10. Apply weights from scenario injection. Calculate weighted score. Apply adjustment rules.

Adjustment rules (apply before finalising):
- Core task missed entirely → cap overall score at 4
- Non-serious or placeholder response → cap overall score at 2
- Critical listener failure (listener would be materially misled or uninformed) → cap overall score at 5
- Strong communication despite one minor flaw → allow 8+
- Severe self-contradiction within response → deduct 1–2 from weighted total

Score confidence:
HIGH — clear signal, confident evaluation
MEDIUM — borderline quality, unconventional, or mixed
LOW — very short, non-serious, or insufficient signal

When scoreConfidence is LOW: max 1 impact card, soften certainty language, do not generate deep analysis.

Score benchmarks:
9–10: Leads with key point. Uses all available context specifically. Correct hierarchy. Nothing wasted.
7–8: One minor gap in specificity or sequencing. Core communication succeeded.
5–6: Generic language where specifics were available, OR key item buried or significantly softened.
3–4: Evasive, defensive, or structurally wrong. Listener underinformed.
1–2: Task missed entirely or insufficient to evaluate.

══════════════════════════
FEEDBACK DENSITY
══════════════════════════

9–10 → 1 card max
7–8 → 1–2 cards
5–6 → 2–3 cards
3–4 → 3–4 cards
1–2 → max 2 cards (or 1 if confidence LOW)

══════════════════════════
ONE-LINER RULES
══════════════════════════

Must contain both a strength AND a gap in one sentence. Max 110 chars. Must be specific to this response — could not describe any other answer. Do not begin with "Your answer."

BAD: "Good effort with some areas to improve."
GOOD: "Clear structure — but the key risk landed last instead of first."

══════════════════════════
WHAT WORKED RULES
══════════════════════════

Always present — even for weak responses. Reference specific words or structure. Do not invent. If only minimal engagement, state: "The response attempted the task and addressed the situation."

══════════════════════════
IMPACT CARD STRUCTURE
══════════════════════════

Each card: observation (quotes their words) → why it mattered (listener consequence) → principle (High/Medium only, null for Low).
Level: high = listener outcome materially changed. medium = precision or confidence weakened. low = noticeable but minor — include only if genuinely worth flagging, omit otherwise.

══════════════════════════
POINT-FIRST DETECTION
══════════════════════════

pointFirst = true when the most important information for the listener appears in the first sentence — not setup, not context, not softening. For emotional scenarios: pointFirst = true when emotional acknowledgment precedes logistics.

══════════════════════════
EXERCISE: BEAT THE BENCHMARK
══════════════════════════

Type: Clear articulation under realistic communication pressure.
Success: Listener receives the right information, in the right order, at the right level of specificity, without follow-up needed.

Primary dimensions: directness · specificity · hierarchy · listenerOrientation · emotionalCalibration

Special rules:
- Evaluate the participant's response independently. Do NOT compare sentence-by-sentence to the benchmark.
- Generic language when specifics were available → reduce specificity score.
- Softening language that hides the actual point → reduce directness score.
- Do NOT reward unnecessary elaboration.

Failure patterns to detect: burying key point · vague substitutions · over-context before conclusion · defensive framing · emotional acknowledgment absent when required.`

const OUTPUT_FORMAT = `

══════════════════════════
OUTPUT FORMAT
══════════════════════════

Return ONLY valid JSON. No markdown. No preamble. No trailing text.

Schema:
{
  "score": <number 1-10>,
  "scoreConfidence": <"HIGH" | "MEDIUM" | "LOW">,
  "pointFirst": <boolean>,
  "dimensionScores": { "<dimensionName>": <number 1-10> },
  "oneLiner": "<string max 110 chars>",
  "whatWorked": ["<string max 140 chars>"],
  "impacts": [
    {
      "level": <"high" | "medium" | "low">,
      "observation": "<string max 160 chars>",
      "why": "<string max 240 chars>",
      "principle": "<string max 100 chars or null>"
    }
  ]
}

Include only the dimensions listed in the scenario injection. Omit dimensions not used.`

function buildScenarioInjection(ctx) {
  const dims = ctx.dimensionsWeights
    ? Object.entries(ctx.dimensionsWeights).map(([k, v]) => `${k}: ${v}%`).join("\n")
    : "directness: 25%\nspecificity: 25%\nhierarchy: 25%\nlistenerOrientation: 25%"

  return `

══════════════════════════
[SCENARIO INJECTION]
══════════════════════════

EXERCISE TITLE: ${ctx.exerciseTitle || "Communication Practice"}

SCENARIO: ${ctx.scenarioText || "Respond clearly to the situation described."}

${ctx.contextBullets ? `CONTEXT PROVIDED TO PARTICIPANT:\n${ctx.contextBullets}` : ""}

COMMUNICATION GOAL: ${ctx.communicationGoal || "Deliver the key information clearly to the listener."}

LISTENER CONTEXT: ${ctx.listenerContext || "Professional or peer context."}

STAKES LEVEL: ${ctx.stakesLevel || "Foundation"}

CORE DIMENSIONS AND WEIGHTS:
${dims}

${ctx.failureModes ? `FAILURE MODES FOR THIS SCENARIO:\n${ctx.failureModes}` : ""}

${ctx.tradeoffNote ? `TRADEOFF NOTE: ${ctx.tradeoffNote}` : ""}`
}

function buildUserPrompt(userResponse) {
  return `PARTICIPANT RESPONSE:\n"${userResponse}"\n\nEvaluate this response.`
}

export async function sharpEngine(userResponse, context = {}, customBasePrompt = null, customOutputSchema = null) {
  // ── MOCK MODE ──────────────────────────────────────────────────────────────
  // Set MOCK_AI=true in .env.local to skip real API calls during load testing.
  // To switch back to real scoring: remove that line (or set MOCK_AI=false).
  if (process.env.MOCK_AI === "true") {
    await new Promise(r => setTimeout(r, 7000))
    return {
      score:           Math.floor(Math.random() * 4) + 6,
      scoreConfidence: "MEDIUM",
      pointFirst:      Math.random() > 0.5,
      dimensionScores: { directness: 7, specificity: 7, hierarchy: 7, listenerOrientation: 7 },
      oneLiner:        "Mock scoring — load test mode active.",
      whatWorked:      ["Response was submitted and recorded."],
      impacts:         [],
    }
  }
  // ── END MOCK ───────────────────────────────────────────────────────────────

  const baseURL    = (process.env.AZURE_OPENAI_BASE_URL || "").replace(/\/$/, "")
  const apiKey     = process.env.AZURE_OPENAI_API_KEY    || ""
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4o"

  const outputSection = customOutputSchema
    ? `\n\n══════════════════════════\nOUTPUT FORMAT\n══════════════════════════\n\nReturn ONLY valid JSON. No markdown. No preamble. No trailing text.\n\n${customOutputSchema}`
    : OUTPUT_FORMAT

  const systemPrompt = (customBasePrompt || BASE_SYSTEM_PROMPT) + buildScenarioInjection(context) + outputSection
  const userPrompt   = buildUserPrompt(userResponse)

  // This model uses the Responses API (not Chat Completions)
  const endpoint = `${baseURL}/responses`

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      model:             deployment,
      instructions:      systemPrompt,
      input:             userPrompt,
      max_output_tokens: 10000,
      reasoning:         { effort: "medium" },
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`${res.status} ${errText}`)
  }

  const data = await res.json()

  // Responses API shape: output[] → type:"message" → content[] → type:"output_text"
  const raw = data.output
    ?.find(o => o.type === "message")
    ?.content
    ?.find(c => c.type === "output_text")
    ?.text
    ?.trim() || ""

  const jsonStr = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim()

  // Log tokens — skip if input=0 (Azure soft rate-limit refusal, model never ran)
  if (data.usage && data.usage.input_tokens > 0) {
    const u = data.usage;
    const cached = u.input_tokens_details?.cached_tokens ?? u.prompt_tokens_details?.cached_tokens ?? 0;
    console.log(`[sharp-engine] tokens — input:${u.input_tokens} (cached:${cached}) reasoning:${u.output_tokens_details?.reasoning_tokens ?? "?"} output:${u.output_tokens} total:${u.total_tokens}`);
  }

  if (!jsonStr) throw new Error("[sharp-engine] Empty response from AI")

  // Non-JSON means Azure rate-limit soft refusal — retry once after 3s
  if (!jsonStr.startsWith("{")) {
    console.warn("[sharp-engine] Rate-limit soft refusal from Azure, retrying in 3s…")
    await new Promise(r => setTimeout(r, 3000))

    const retry = await fetch(endpoint, {
      method:  "POST",
      headers: { "Content-Type": "application/json", "api-key": apiKey },
      body: JSON.stringify({
        model:             deployment,
        instructions:      systemPrompt,
        input:             userPrompt,
        max_output_tokens: 10000,
        reasoning:         { effort: "medium" },
      }),
    })

    if (!retry.ok) {
      const errText = await retry.text()
      throw new Error(`retry ${retry.status} ${errText}`)
    }

    const retryData = await retry.json()

    if (retryData.usage && retryData.usage.input_tokens > 0) {
      const u = retryData.usage;
      console.log(`[sharp-engine] retry tokens — input:${u.input_tokens} reasoning:${u.output_tokens_details?.reasoning_tokens ?? "?"} output:${u.output_tokens} total:${u.total_tokens}`);
    }

    const retryRaw  = retryData.output
      ?.find(o => o.type === "message")
      ?.content
      ?.find(c => c.type === "output_text")
      ?.text
      ?.trim() || ""

    const retryJson = retryRaw
      .replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim()

    if (!retryJson || !retryJson.startsWith("{")) {
      throw new Error(`[sharp-engine] Retry also returned non-JSON: ${retryJson.slice(0, 80)}`)
    }
    return JSON.parse(retryJson)
  }

  return JSON.parse(jsonStr)
}

// ─── BATCHED ENGINE ───────────────────────────────────────────────────────────
// Scores all scenarios in a single API call instead of N parallel calls.
// entries: array of [posString, userResponse] pairs
// contextsMap: { posString: context } — same shape score-all builds per scenario
//
// Returns the same { "1": result, "2": result, ... } shape as the parallel path,
// so score-all can use either without changing the downstream logic.
// ─────────────────────────────────────────────────────────────────────────────

export async function sharpEngineBatched(entries, contextsMap, customBasePrompt = null, customOutputSchema = null) {
  if (process.env.MOCK_AI === "true") {
    await new Promise(r => setTimeout(r, 7000))
    return Object.fromEntries(entries.map(([pos]) => [pos, {
      score: Math.floor(Math.random() * 4) + 6,
      scoreConfidence: "MEDIUM",
      pointFirst: Math.random() > 0.5,
      dimensionScores: { directness: 7, specificity: 7, hierarchy: 7, listenerOrientation: 7 },
      oneLiner: "Mock scoring — load test mode active.",
      whatWorked: ["Response was submitted and recorded."],
      impacts: [],
    }]))
  }

  const baseURL    = (process.env.AZURE_OPENAI_BASE_URL || "").replace(/\/$/, "")
  const apiKey     = process.env.AZURE_OPENAI_API_KEY    || ""
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4o"

  // Reuse buildScenarioInjection per scenario, labelling each with its position
  const scenarioInjections = entries.map(([pos]) => {
    const ctx = contextsMap[pos] || {}
    return buildScenarioInjection(ctx).replace("[SCENARIO INJECTION]", `[SCENARIO ${pos}]`)
  }).join("")

  // Per-scenario output schema — use custom if provided, else default SHARP schema
  const perScenarioSchema = customOutputSchema?.trim() || `{
  "score": <number 1-10>,
  "scoreConfidence": <"HIGH" | "MEDIUM" | "LOW">,
  "pointFirst": <boolean>,
  "dimensionScores": { "<dimensionName>": <number 1-10> },
  "oneLiner": "<string max 110 chars>",
  "whatWorked": ["<string max 140 chars>"],
  "impacts": [
    {
      "level": <"high" | "medium" | "low">,
      "observation": "<string max 160 chars>",
      "why": "<string max 240 chars>",
      "principle": "<string max 100 chars or null>"
    }
  ]
}`

  const batchedOutputSection = `

══════════════════════════
BATCHED EVALUATION — RULES
══════════════════════════

Evaluate each scenario INDEPENDENTLY. Do not compare responses to each other.
Score each response only against the context of its own scenario.

══════════════════════════
OUTPUT FORMAT
══════════════════════════

Return ONLY valid JSON. No markdown. No preamble. No trailing text.

Return a single JSON object. Keys are scenario position numbers as strings.
Each value must match the per-scenario schema below.

Per-scenario schema:
${perScenarioSchema}

Full response shape (example for 2 scenarios):
{
  "1": <per-scenario object>,
  "2": <per-scenario object>
}`

  const systemPrompt = (customBasePrompt || BASE_SYSTEM_PROMPT) + scenarioInjections + batchedOutputSection

  const userPrompt = entries
    .map(([pos, response]) => `SCENARIO ${pos} PARTICIPANT RESPONSE:\n"${response}"`)
    .join("\n\n") + "\n\nEvaluate each scenario independently."

  const endpoint = `${baseURL}/responses`

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", "api-key": apiKey },
    body: JSON.stringify({
      model:             deployment,
      instructions:      systemPrompt,
      input:             userPrompt,
      max_output_tokens: 16000,
      reasoning:         { effort: "medium" },
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`${res.status} ${errText}`)
  }

  const data = await res.json()

  const raw = data.output
    ?.find(o => o.type === "message")
    ?.content
    ?.find(c => c.type === "output_text")
    ?.text
    ?.trim() || ""

  const jsonStr = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim()

  if (data.usage && data.usage.input_tokens > 0) {
    const u = data.usage
    const cached = u.input_tokens_details?.cached_tokens ?? u.prompt_tokens_details?.cached_tokens ?? 0;
    console.log(`[sharp-engine-batched] tokens — input:${u.input_tokens} (cached:${cached}) reasoning:${u.output_tokens_details?.reasoning_tokens ?? "?"} output:${u.output_tokens} total:${u.total_tokens}`)
  }

  if (!jsonStr) throw new Error("[sharp-engine-batched] Empty response from AI")
  if (!jsonStr.startsWith("{")) throw new Error(`[sharp-engine-batched] Non-JSON: ${jsonStr.slice(0, 80)}`)

  return JSON.parse(jsonStr)
}
