// TEST: Concurrent AI scoring (full flow — submit then score)
//
// Runs the complete user journey: submit answers → score with AI → save to DB.
// Results are visible in community responses / admin panel after the test.
// Cleanup after: DELETE FROM submissions WHERE email LIKE '%k6_%@loadtest.invalid';
//
// MOCK mode:     MOCK_AI=true in .env.local  → 7s fake delay, no API cost
// Real API mode: MOCK_AI=false or removed    → actual Azure OpenAI calls
//
// Run 10 users (real API): k6 run --env STAGE=real_10 k6/score.js
// Run 20 users (real API): k6 run --env STAGE=real_20 k6/score.js
// Run 30 users (real API): k6 run --env STAGE=real_30 k6/score.js
//
// Mock tests (no API cost):
// k6 run --env STAGE=smoke  k6/score.js
// k6 run --env STAGE=load   k6/score.js
// k6 run --env STAGE=spike  k6/score.js

import http   from "k6/http";
import { check, sleep } from "k6";
import { BASE_URL, EXERCISE_ID, STAGES, THRESHOLDS_SCORE, THRESHOLDS_SCORE_REAL } from "./config.js";

const stage    = __ENV.STAGE || "load";
const isMock   = stage === "smoke" || stage === "load" || stage === "stress" || stage === "spike";
const thresholds = isMock ? THRESHOLDS_SCORE : THRESHOLDS_SCORE_REAL;

export const options = {
  stages:     STAGES[stage] || STAGES.load,
  thresholds,
};

// ── Scenarios metadata ────────────────────────────────────────────────────────

const SCENARIOS = [
  {
    shortTitle: "Project Update",
    text: `Your manager asks: "How's the Horizon project coming along?"`,
    ctx: [
      "4 of 6 emails done, approved by marketing",
      "Email 3: legal review delay — resolved",
      "On track for next Friday deadline",
      "Design team hasn't replied about header format — if no reply by Tuesday, 3-day delay",
    ],
  },
  {
    shortTitle: "Show Rec.",
    text: `Your friend texts: "Should I watch that thriller series you just finished? I have one evening free."`,
    ctx: [
      "6 episodes. Eps 1–4: gripping, watched all four in one sitting",
      "Eps 5–6: romance subplot takes over, tension drops significantly",
      "Finale reveal satisfying but last 20 min feel rushed",
      "Friend likes thriller series, hates shows that drag",
    ],
  },
  {
    shortTitle: "Missed Meeting",
    text: `Your team lead messages: "You weren't on the call — what happened, and what did you miss?"`,
    ctx: [
      "Water pipe emergency at 2:50pm — no time to message first",
      "Caught up with colleague: presentation moved to Thursday (no content change)",
      "New expense approval: >₹5k needs 2 managers via new form, starts Monday",
      "Tuesday sync cancelled (public holiday)",
    ],
  },
];

// ── Realistic answers ─────────────────────────────────────────────────────────
// Intentionally varied quality so the AI has something meaningful to evaluate.

const ANSWERS = {
  "1": "Horizon is on track for next Friday. We've completed 4 of 6 emails — the legal review delay on email 3 is resolved. One live risk: the design team hasn't confirmed the header format. If we don't hear back by Tuesday, we're looking at a 3-day slip.",

  "2": "Yes, watch it — but go in knowing it's two very different halves. Episodes 1 to 4 are genuinely gripping, I watched all four in one sitting. Episodes 5 and 6 slow right down when a romance subplot takes over, which I know you'll find annoying. The finale reveal is satisfying but the last 20 minutes feel rushed. Worth it for the first half alone.",

  "3": "Water pipe emergency at home at 2:50 — no time to send a message before the call started. I caught up with Riya immediately after. Four updates: presentation is moved to Thursday, no content changes. New expense approval kicks in Monday — anything above 5k needs sign-off from two managers using the new form. And the Tuesday sync is cancelled, it's a public holiday.",
};

// ── Main test function ────────────────────────────────────────────────────────

export default function () {
  // Unique email per VU + iteration + timestamp so runs never collide in DB
  const email = `k6_score_vu${__VU}_iter${__ITER}_${Date.now()}@loadtest.invalid`;
  const name  = `Load Test VU${__VU}`;
  const headers = { "Content-Type": "application/json" };

  // ── Step 1: Submit answers (creates the DB row) ───────────────────────────
  const submitRes = http.post(
    `${BASE_URL}/api/submit`,
    JSON.stringify({ email, name, answers: ANSWERS, exercise_id: parseInt(EXERCISE_ID) }),
    { headers, tags: { name: "submit" } },
  );

  const submitOk = check(submitRes, {
    "submit — status 200":  r => r.status === 200,
    "submit — has session": r => { try { return JSON.parse(r.body).session_id != null; } catch { return false; } },
  });

  // Don't bother scoring if submit failed
  if (!submitOk) {
    sleep(1);
    return;
  }

  // ── Step 2: Score answers (AI call — saves sharp_results to DB row) ───────
  const scoreRes = http.post(
    `${BASE_URL}/api/score-all`,
    JSON.stringify({
      email,
      name,
      answers:       ANSWERS,
      exercise_id:   parseInt(EXERCISE_ID),
      exerciseTitle: "Articulation-01",
      scenarios:     SCENARIOS,
    }),
    { headers, timeout: "120s", tags: { name: "score-all" } },
  );

  check(scoreRes, {
    "score — status 200":       r => r.status === 200,
    "score — has sharpResults": r => { try { return !!JSON.parse(r.body).sharpResults; } catch { return false; } },
    "score — not error":        r => { try { return !JSON.parse(r.body).error; } catch { return false; } },
  });

  sleep(1);
}
