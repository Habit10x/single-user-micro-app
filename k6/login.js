// TEST: Concurrent login / check-submission
// What it checks: DB read concurrency — can Neon handle N simultaneous lookups?
// Each virtual user hits the check-submission endpoint with a unique email.
// Expected result: { submitted: false } for all (fresh emails never seen before).
//
// Run (smoke):  k6 run k6/login.js
// Run (stress): k6 run --env STAGE=stress k6/login.js

import http   from "k6/http";
import { check, sleep } from "k6";
import { BASE_URL, EXERCISE_ID, STAGES, THRESHOLDS_FAST } from "./config.js";

const stage = __ENV.STAGE || "load";

export const options = {
  stages:     STAGES[stage] || STAGES.load,
  thresholds: THRESHOLDS_FAST,
};

export default function () {
  // Unique email per VU per iteration — guarantees no DB collision
  const email = `k6_login_vu${__VU}_iter${__ITER}@loadtest.invalid`;
  const url   = `${BASE_URL}/api/check-submission?email=${encodeURIComponent(email)}&exercise_id=${EXERCISE_ID}`;

  const res = http.get(url, { tags: { name: "check-submission" } });

  check(res, {
    "login — status 200":      r => r.status === 200,
    "login — valid JSON":      r => { try { JSON.parse(r.body); return true; } catch { return false; } },
    "login — submitted false": r => { try { return JSON.parse(r.body).submitted === false; } catch { return false; } },
  });

  sleep(1);
}
