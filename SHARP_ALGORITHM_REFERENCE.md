# SHARP Algorithm — Full Implementation Reference

This file is a self-contained reference. Give it to Claude and say:
**"Implement the SHARP scoring algorithm for my app using this file as the reference."**
Claude will be able to recreate the full system from scratch.

---

## 1. What SHARP Is

SHARP is an AI-powered communication scoring engine. It evaluates a user's spoken/written response to a scenario question and returns a structured JSON result containing:
- A score (1–10)
- Per-dimension scores across 7 communication dimensions
- A one-liner coaching summary
- What the user did well
- Impact cards describing where communication broke down and why

It is designed for **communication practice apps** where users respond to real-world scenarios (workplace, family, social) and receive coaching feedback.

---

## 2. Tech Stack Required

| Requirement | Detail |
|---|---|
| AI Provider | Azure OpenAI (or standard OpenAI — minor changes needed) |
| Model | GPT-4o or equivalent instruction-following model |
| API style | OpenAI Responses API (`responses.create`) or Chat Completions |
| SDK | `openai` npm package v6+ |
| Runtime | Node.js / Next.js API route (server-side only) |
| Env vars | `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_BASE_URL`, `AZURE_OPENAI_DEPLOYMENT` |

**Vercel note:** Set `export const maxDuration = 60` on any API route that calls SHARP. Azure OpenAI calls can take 10–20s and Vercel's default timeout is 10s.

---

## 3. Environment Variables

```env
# In .env.local (local) and Vercel dashboard (production)
AZURE_OPENAI_API_KEY=your-azure-api-key
AZURE_OPENAI_BASE_URL=https://your-resource.openai.azure.com/openai/v1
AZURE_OPENAI_DEPLOYMENT=your-deployment-name
```

The engine strips `/openai/v1` from `AZURE_OPENAI_BASE_URL` before passing it to the `AzureOpenAI` constructor because the constructor expects just the base resource URL.

---

## 4. The 7 Scoring Dimensions

These are fixed platform-wide. Use these exact names as keys in `dimensionScores`.

| Dimension | What it measures |
|---|---|
| `directness` | Key point arrived in the first 1–2 sentences without softening or delay |
| `specificity` | Concrete available information used rather than vague substitutes |
| `hierarchy` | Most important item positioned first; less important items follow |
| `listenerOrientation` | Response shaped around what THIS listener needs — not what was easiest to say |
| `emotionalCalibration` | Tone appropriate for relationship type and stakes |
| `economy` | No repetition, padding, or over-explanation |
| `completeness` | All elements the receiver needed were present |

Each scenario can use a **subset** of dimensions with **custom weights** (must sum to 100%). If no weights are provided, default to `directness: 25%, specificity: 25%, hierarchy: 25%, listenerOrientation: 25%`.

---

## 5. Output Format (TypeScript Interfaces)

```typescript
interface SharpImpact {
  level: "high" | "medium" | "low"
  observation: string   // max 160 chars — must quote user's words
  why: string           // max 240 chars — listener consequence
  principle: string | null  // max 100 chars — null for "low" level cards
}

interface SharpResult {
  score: number                          // 1–10 from AI
  scoreConfidence: "HIGH" | "MEDIUM" | "LOW"
  pointFirst: boolean
  dimensionScores: Record<string, number> // only dimensions in scenario injection
  oneLiner: string                       // max 110 chars
  whatWorked: string[]                   // max 140 chars each
  impacts: SharpImpact[]
}
```

### Score-to-100 conversion
The score is returned as 1–10 by the AI. Multiply by 10 for a 0–100 scale used in the rest of the app:
```typescript
const score100 = Math.round(sharpResult.score * 10)
```

---

## 6. Scenario Context (What You Pass Per Scenario)

Each scenario in your database should have these fields. They are injected into the system prompt at runtime so the AI evaluates in the right context.

```typescript
interface SharpScenarioContext {
  exerciseTitle?: string       // Name of the exercise/module
  scenarioText?: string        // The question shown to the user
  contextBullets?: string      // Background info given to user before answering
  communicationGoal?: string   // What a good response achieves for the listener
  listenerContext?: string     // Who the listener is and their relationship to the speaker
  stakesLevel?: string         // "Foundation" | "Intermediate" | "Advanced"
  dimensionsWeights?: Record<string, number>  // e.g. { directness: 40, specificity: 30, hierarchy: 30 }
  failureModes?: string        // Common ways people fail this specific scenario
  tradeoffNote?: string        // Any scoring tradeoff to be aware of
}
```

**Database columns needed on your scenarios table:**
```sql
context_bullets      TEXT
communication_goal   TEXT
listener_context     TEXT
stakes_level         TEXT    DEFAULT 'Foundation'
dimensions_weights   JSONB
failure_modes        TEXT
tradeoff_note        TEXT
```

---

## 7. Full System Prompt

This is the exact system prompt used. Copy it verbatim.

```
You are the evaluation engine for [YOUR APP NAME].

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

Failure patterns to detect: burying key point · vague substitutions · over-context before conclusion · defensive framing · emotional acknowledgment absent when required.

[SCENARIO INJECTION IS APPENDED HERE AT RUNTIME — see Section 8]

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

Include only the dimensions listed in the scenario injection. Omit dimensions not used.
```

---

## 8. Scenario Injection (Runtime-Built Section)

This block is appended to the system prompt at runtime, built from the scenario's database fields:

```
══════════════════════════
[SCENARIO INJECTION]
══════════════════════════

EXERCISE TITLE: {exerciseTitle}

SCENARIO: {scenarioText}

CONTEXT PROVIDED TO PARTICIPANT:
{contextBullets}

COMMUNICATION GOAL: {communicationGoal}

LISTENER CONTEXT: {listenerContext}

STAKES LEVEL: {stakesLevel}

CORE DIMENSIONS AND WEIGHTS:
directness: 40%
specificity: 30%
hierarchy: 30%

FAILURE MODES FOR THIS SCENARIO:
{failureModes}

TRADEOFF NOTE: {tradeoffNote}
```

---

## 9. User Prompt (What Goes in the `input` Field)

```
SCENARIO: {scenarioText}

CONTEXT:
{contextBullets}

COMMUNICATION GOAL: {communicationGoal}
LISTENER: {listenerContext}
DIMENSIONS: directness: 40%, specificity: 30%, hierarchy: 30%
FAILURE MODES: {failureModes}
TRADEOFF: {tradeoffNote}

PARTICIPANT RESPONSE:
"{userResponse}"

Evaluate this response.
```

---

## 10. Full Engine Code

```typescript
// lib/scoring/engines/sharp-engine.ts
import { AzureOpenAI } from "openai"

export interface SharpImpact {
  level: "high" | "medium" | "low"
  observation: string
  why: string
  principle: string | null
}

export interface SharpResult {
  score: number
  scoreConfidence: "HIGH" | "MEDIUM" | "LOW"
  pointFirst: boolean
  dimensionScores: Record<string, number>
  oneLiner: string
  whatWorked: string[]
  impacts: SharpImpact[]
}

export interface SharpScenarioContext {
  exerciseTitle?: string
  scenarioText?: string
  contextBullets?: string
  communicationGoal?: string
  listenerContext?: string
  stakesLevel?: string
  dimensionsWeights?: Record<string, number>
  failureModes?: string
  tradeoffNote?: string
}

// Paste the full BASE_SYSTEM_PROMPT string from Section 7 here
const BASE_SYSTEM_PROMPT = `...` // (full prompt from Section 7, up to [SCENARIO INJECTION])

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

function buildScenarioInjection(ctx: SharpScenarioContext): string {
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

function buildUserPrompt(userResponse: string, ctx: SharpScenarioContext): string {
  const dims = ctx.dimensionsWeights
    ? Object.entries(ctx.dimensionsWeights).map(([k, v]) => `${k}: ${v}%`).join(", ")
    : "directness: 25%, specificity: 25%, hierarchy: 25%, listenerOrientation: 25%"

  return `SCENARIO: ${ctx.scenarioText || ""}

${ctx.contextBullets ? `CONTEXT:\n${ctx.contextBullets}` : ""}

COMMUNICATION GOAL: ${ctx.communicationGoal || "Deliver the key information clearly."}
LISTENER: ${ctx.listenerContext || "Professional context"}
DIMENSIONS: ${dims}
${ctx.failureModes ? `FAILURE MODES: ${ctx.failureModes}` : ""}
${ctx.tradeoffNote ? `TRADEOFF: ${ctx.tradeoffNote}` : ""}

PARTICIPANT RESPONSE:
"${userResponse}"

Evaluate this response.`
}

export async function sharpEngine(
  userResponse: string,
  context: SharpScenarioContext = {}
): Promise<SharpResult> {
  const client = new AzureOpenAI({
    endpoint: process.env.AZURE_OPENAI_BASE_URL?.replace("/openai/v1", "") || "",
    apiKey: process.env.AZURE_OPENAI_API_KEY,
    apiVersion: "2025-03-01-preview",
    deployment: process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4o",
  })

  const systemPrompt = BASE_SYSTEM_PROMPT + buildScenarioInjection(context) + OUTPUT_FORMAT
  const userPrompt = buildUserPrompt(userResponse, context)

  const response = await (client as any).responses.create({
    model: process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4o",
    max_output_tokens: 1000,
    temperature: 0,
    instructions: systemPrompt,
    input: userPrompt,
  })

  const raw = response.output_text?.trim() || ""
  const jsonStr = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim()

  if (!jsonStr) throw new Error("[sharp-engine] Empty response from AI")

  return JSON.parse(jsonStr) as SharpResult
}
```

---

## 11. API Route (Next.js App Router)

```typescript
// app/api/score-response/route.ts
import { NextRequest, NextResponse } from "next/server"
import { sharpEngine, SharpScenarioContext } from "@/lib/scoring/engines/sharp-engine"

export const dynamic = 'force-dynamic'
export const maxDuration = 60  // REQUIRED on Vercel — AI calls can take 10-20s

export async function POST(request: NextRequest) {
  try {
    const { userResponse, scenarioContext } = await request.json()

    if (!userResponse) {
      return NextResponse.json({ score: 0, feedbackLines: ["No response provided."] })
    }

    const result = await sharpEngine(userResponse, scenarioContext || {})

    // Convert 1-10 to 0-100
    const score100 = Math.round(result.score * 10)

    return NextResponse.json({
      score: score100,
      feedbackLines: [
        result.oneLiner,
        ...(result.whatWorked || []).slice(0, 1),
        ...(result.impacts || []).slice(0, 1).map(i => i.observation),
      ].filter(Boolean),
      sharpData: result,
    })
  } catch (err: any) {
    console.error("[score-response] SHARP error:", err)
    return NextResponse.json(
      {
        score: 50,
        feedbackLines: ["Scoring temporarily unavailable. Please try again."],
        engineType: "sharp_error",
        sharpError: err?.message || String(err),
      },
      { status: 503 }
    )
  }
}
```

---

## 12. Database Schema

### `scoring_algorithms` table
Stores the algorithm configuration. One row per scoring method.

```sql
CREATE TABLE scoring_algorithms (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  engine_type TEXT NOT NULL,   -- 'sharp' | 'storytelling' | 'articulation' etc.
  config      JSONB,           -- optional extra config (unused for SHARP)
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Insert the SHARP algorithm row:
INSERT INTO scoring_algorithms (name, engine_type, is_active)
VALUES ('SHARP (AI-Powered)', 'sharp', true);
```

### `exercises` table — add algorithm column
```sql
ALTER TABLE exercises ADD COLUMN algorithm_id UUID REFERENCES scoring_algorithms(id);
```

### `scenarios` table — add SHARP context columns
```sql
ALTER TABLE scenarios ADD COLUMN context_bullets    TEXT;
ALTER TABLE scenarios ADD COLUMN communication_goal TEXT;
ALTER TABLE scenarios ADD COLUMN listener_context   TEXT;
ALTER TABLE scenarios ADD COLUMN stakes_level       TEXT DEFAULT 'Foundation';
ALTER TABLE scenarios ADD COLUMN dimensions_weights JSONB;
ALTER TABLE scenarios ADD COLUMN failure_modes      TEXT;
ALTER TABLE scenarios ADD COLUMN tradeoff_note      TEXT;
```

### `comments` table — store SHARP result
```sql
ALTER TABLE comments ADD COLUMN sharp_feedback JSONB;
-- Store the full SharpResult JSON here after scoring
```

---

## 13. How Scoring Flows End-to-End

```
User submits response
        ↓
API route receives: { userResponse, exerciseId, scenarioSlug }
        ↓
Look up exercise → get algorithm_id → get engine_type ('sharp')
        ↓
Look up scenario by slug → build SharpScenarioContext from DB fields
        ↓
Call sharpEngine(userResponse, scenarioContext)
        ↓
Azure OpenAI returns JSON → parse SharpResult
        ↓
Convert score: result.score × 10 → 0–100
        ↓
Save sharp_feedback (full JSON) to comments table
        ↓
Return { score, feedbackLines, sharpData } to client
        ↓
UI renders: oneLiner, whatWorked, impact cards, dimension bars
```

---

## 14. How to Assign SHARP to an Exercise

In your admin panel, the exercise edit form should have an "Algorithm" dropdown. When set to the SHARP algorithm row's UUID, all responses for that exercise will use the AI engine.

In the `updateExercise` DB function, use a `CASE WHEN` to avoid wiping the algorithm when updating other fields:

```sql
algorithm_id = CASE WHEN ${data.algorithm_id !== undefined}::boolean
               THEN ${data.algorithm_id || null}
               ELSE algorithm_id END
```

**Do NOT use** `algorithm_id = ${data.algorithm_id || null}` — this silently wipes the algorithm whenever you edit other exercise fields and don't include `algorithm_id` in the payload.

---

## 15. How to Display SHARP Results in the UI

The `sharpData` object returned from the API contains everything needed for rich feedback UI.

### Minimal display (feedback lines only)
```typescript
// feedbackLines is pre-built from sharpData:
// [oneLiner, whatWorked[0], impacts[0].observation]
feedbackLines.map(line => <p>{line}</p>)
```

### Rich display (full SHARP card)
```typescript
const { oneLiner, score, scoreConfidence, pointFirst,
        dimensionScores, whatWorked, impacts } = sharpData

// Score badge
<div>{score}/10 · {scoreConfidence}</div>

// One-liner
<p className="font-semibold">{oneLiner}</p>

// Point-first indicator
{pointFirst && <Badge>Led with the point</Badge>}

// Dimension bars
{Object.entries(dimensionScores).map(([dim, val]) => (
  <div key={dim}>
    <span>{dim}</span>
    <progress value={val} max={10} />
    <span>{val}/10</span>
  </div>
))}

// What worked
<h3>What worked</h3>
{whatWorked.map(w => <p key={w}>{w}</p>)}

// Impact cards
<h3>Where impact was lost</h3>
{impacts.map((card, i) => (
  <div key={i} data-level={card.level}>
    <p>{card.observation}</p>
    <p className="text-sm text-gray-500">{card.why}</p>
    {card.principle && <p className="text-xs italic">{card.principle}</p>}
  </div>
))}
```

---

## 16. AI-Generated Exercise Summary (Optional Feature)

After a user completes all scenarios in an exercise, you can use the stored `sharp_feedback` JSON to generate a two-point coaching summary using a second AI call.

**What to collect from each scenario's `sharp_feedback`:**
- `whatWorked` array → aggregate across all scenarios
- `impacts` array filtered to `level === 'high' | 'medium'` → aggregate across all scenarios

**System prompt for the summary:**
```
You are a communication coach summarising a user's performance across multiple practice scenarios.

You will receive two lists:
1. WHAT WORKED — specific strengths observed per scenario
2. WHERE IMPACT WAS LOST — specific impact losses observed per scenario

Write exactly TWO coaching summaries:
- "didWell": A 2–3 sentence summary of consistent strengths. Must reference specific, observable behaviors from the data. Never generic praise.
- "lostImpact": A 2–3 sentence summary of consistent impact losses. Must reference specific patterns. Never generic advice.

Rules:
- Be concise but detailed — each summary should feel like a real coaching observation
- Reference actual behaviors/patterns from the observations
- Never psychoanalyse — describe only observable communication behavior
- Never say "You are someone who..." or "You seem to..." or "You struggle with..."

Return ONLY valid JSON with no markdown or preamble:
{ "didWell": "...", "lostImpact": "..." }
```

**User input:**
```
WHAT WORKED:
[Scenario A] Clear opening sentence named the deadline directly.
[Scenario B] Used exact numbers rather than approximations.

WHERE IMPACT WAS LOST:
[Scenario A] Buried the ask behind three sentences of context.
[Scenario C] Listener's role not acknowledged — info delivered as if to anyone.
```

---

## 17. Implementation Roadmap (Step-by-Step)

Follow these steps in order when implementing SHARP in a new project.

### Phase 1 — Database
1. Add `scoring_algorithms` table
2. Insert one row: `{ name: 'SHARP (AI-Powered)', engine_type: 'sharp', is_active: true }`
3. Add `algorithm_id` column to your `exercises` table
4. Add SHARP context columns to your `scenarios` table (see Section 12)
5. Add `sharp_feedback JSONB` column to your responses/comments table

### Phase 2 — Engine
6. Create `lib/scoring/engines/sharp-engine.ts` — copy code from Section 10, paste full system prompt from Section 7
7. Install `openai` package: `npm install openai`
8. Add env vars to `.env.local` and Vercel dashboard

### Phase 3 — API Route
9. Create the scoring API route (Section 11)
10. Add `export const maxDuration = 60` to the route
11. In the route: load exercise → get `algorithm_id` → get `engine_type` → if `'sharp'`, load scenario context from DB → call `sharpEngine`
12. Save the returned `SharpResult` as JSON in the `sharp_feedback` column of your responses table

### Phase 4 — Admin Panel
13. Add algorithm dropdown to exercise edit form
14. Load algorithms list from DB (`SELECT * FROM scoring_algorithms WHERE is_active = true`)
15. Save selected `algorithm_id` to exercise on update
16. Add SHARP context fields to scenario create/edit form: `communicationGoal`, `listenerContext`, `dimensionsWeights`, `failureModes`, `tradeoffNote`, `stakesLevel`
17. **Critical:** Use `CASE WHEN` pattern for `algorithm_id` in the update SQL (Section 14) — the naive approach silently wipes the value

### Phase 5 — UI
18. After scoring, store `sharpData` alongside the score in component state
19. Render the feedback UI: oneLiner → whatWorked → impact cards → dimension bars (Section 15)
20. Optionally add the exercise-summary endpoint using the second AI call (Section 16)

---

## 18. Common Bugs to Avoid

| Bug | Cause | Fix |
|---|---|---|
| `algorithm_id` silently wiped on exercise update | `algorithm_id = ${data.algorithm_id \|\| null}` — both branches are null when field is absent | Use `CASE WHEN` (Section 14) |
| Sharp engine silently falls back to storytelling | Catch block swallows error and continues | Return 503 with `sharpError` field in catch |
| Works locally, fails on Vercel | Vercel function timeout (10s default) | Add `export const maxDuration = 60` |
| `operator does not exist: text = uuid` | Mixed column types in DB — some UUID, some text | Cast both sides: `column::text = $1` |
| Line breaks lost in display | Plain `\n` stored in DB, rendered with `dangerouslySetInnerHTML` | `.replace(/\n/g, "<br>")` before rendering |
| AI returns markdown code fences | Model wraps JSON in ```json blocks | Strip with `.replace(/^```json\s*/i, "")` |
| Empty `sharpData` on frontend | Frontend not reading `sharpData` from API response | Ensure API returns `sharpData: result` and client stores it |
