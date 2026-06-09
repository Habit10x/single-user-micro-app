// TEST: Concurrent answer submission
// What it checks: DB write concurrency — session resolution, INSERT under load.
// Each VU uses a unique email+timestamp so submissions never conflict.
//
// NOTE: This will create real rows in your submissions table.
// Cleanup after testing: DELETE FROM submissions WHERE email LIKE '%@loadtest.invalid';
//
// Run (smoke):  k6 run k6/submit.js
// Run (stress): k6 run --env STAGE=stress k6/submit.js

import http   from "k6/http";
import { check, sleep } from "k6";
import { BASE_URL, EXERCISE_ID, STAGES, THRESHOLDS_SUBMIT } from "./config.js";

const stage = __ENV.STAGE || "load";

export const options = {
  stages:     STAGES[stage] || STAGES.load,
  thresholds: THRESHOLDS_SUBMIT,
};

const ANSWERS = {
  "1": "The Horizon project is on track for next Friday. 4 of 6 emails are done — legal review on email 3 resolved. One open item: design team needs to confirm header format by Tuesday or we risk a 3-day delay.",
  "2": "Yes, watch it — but know it's two different shows. Eps 1–4 are gripping; I watched all four in one sitting. Eps 5–6 slow right down with a romance subplot. The finale reveal lands well but the last 20 min feel rushed.",
  "3": "Water pipe emergency at 2:50pm — no time to message first. Updates: presentation moved to Thursday, no content change. New expense approval for amounts over 5k starts Monday via new form. Tuesday sync cancelled — public holiday.",
};

export default function () {
  // Unique per VU + iteration + timestamp to avoid any conflict across runs
  const email = `k6_submit_vu${__VU}_iter${__ITER}_${Date.now()}@loadtest.invalid`;

  const payload = JSON.stringify({
    email,
    name:        `Load Test User ${__VU}`,
    answers:     ANSWERS,
    exercise_id: parseInt(EXERCISE_ID),
  });

  const res = http.post(`${BASE_URL}/api/submit`, payload, {
    headers: { "Content-Type": "application/json" },
    tags:    { name: "submit" },
  });

  check(res, {
    "submit — status 200":  r => r.status === 200,
    "submit — success":     r => { try { return JSON.parse(r.body).success === true; } catch { return false; } },
    "submit — has session": r => { try { return JSON.parse(r.body).session_id != null; } catch { return false; } },
  });

  sleep(2);
}
