// TEST: Homepage visits
// What it checks: can the server handle N users loading the app at once?
//
// Run (smoke):  k6 run k6/visit.js
// Run (stress): k6 run --env STAGE=stress k6/visit.js
// Run (spike):  k6 run --env STAGE=spike  k6/visit.js
// Against prod: k6 run --env BASE_URL=https://your-app.vercel.app k6/visit.js

import http   from "k6/http";
import { check, sleep } from "k6";
import { BASE_URL, STAGES, THRESHOLDS_FAST } from "./config.js";

const stage = __ENV.STAGE || "load";

export const options = {
  stages:     STAGES[stage] || STAGES.load,
  thresholds: THRESHOLDS_FAST,
};

export default function () {
  const res = http.get(BASE_URL, { tags: { name: "homepage" } });

  check(res, {
    "homepage — status 200": r => r.status === 200,
    "homepage — has body":   r => r.body && r.body.length > 100,
  });

  sleep(1);
}
