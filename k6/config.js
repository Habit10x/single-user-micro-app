// Shared config for all k6 scripts.
// Override BASE_URL at runtime: k6 run --env BASE_URL=https://your-app.vercel.app k6/visit.js

export const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

// Exercise ID to run tests against — change if your default exercise has a different ID
export const EXERCISE_ID = __ENV.EXERCISE_ID || "1";

// ── Ramp stages ───────────────────────────────────────────────────────────────

export const STAGES = {
  // Confirm nothing crashes at all
  smoke: [
    { duration: "10s", target: 2  },
    { duration: "20s", target: 2  },
    { duration: "5s",  target: 0  },
  ],
  // Baseline — 10 concurrent users
  load: [
    { duration: "15s", target: 10 },
    { duration: "60s", target: 10 },
    { duration: "10s", target: 0  },
  ],
  // Push harder — ramp to 25
  stress: [
    { duration: "15s", target: 10 },
    { duration: "30s", target: 10 },
    { duration: "15s", target: 25 },
    { duration: "60s", target: 25 },
    { duration: "10s", target: 0  },
  ],
  // Sudden burst — worst case scenario
  spike: [
    { duration: "5s",  target: 30 },
    { duration: "30s", target: 30 },
    { duration: "10s", target: 0  },
  ],
  // ── Real API stages (gradual progression) ──────────────────────────────────
  real_10: [
    { duration: "10s", target: 10 },
    { duration: "60s", target: 10 },
    { duration: "10s", target: 0  },
  ],
  real_20: [
    { duration: "15s", target: 20 },
    { duration: "60s", target: 20 },
    { duration: "10s", target: 0  },
  ],
  real_30: [
    { duration: "20s", target: 30 },
    { duration: "60s", target: 30 },
    { duration: "10s", target: 0  },
  ],
};

// ── Thresholds ────────────────────────────────────────────────────────────────

// Standard (fast endpoints — page load, login check)
export const THRESHOLDS_FAST = {
  http_req_failed:   ["rate<0.01"],       // error rate under 1%
  http_req_duration: ["p(95)<3000"],      // 95% of requests under 3s
};

// Submit endpoint (DB writes, session logic)
export const THRESHOLDS_SUBMIT = {
  http_req_failed:   ["rate<0.01"],
  http_req_duration: ["p(95)<8000"],      // allow up to 8s for DB write + session resolve
};

// Score endpoint — mock (7s artificial delay)
export const THRESHOLDS_SCORE = {
  http_req_failed:   ["rate<0.01"],
  http_req_duration: ["p(95)<35000"],     // 7s mock + network + server overhead
};

// Score endpoint — real API (actual AI response time)
export const THRESHOLDS_SCORE_REAL = {
  http_req_failed:   ["rate<0.05"],       // allow up to 5% — rate limits may cause some failures at 20-30 users
  http_req_duration: ["p(95)<90000"],     // 90s ceiling — real AI + queuing overhead
};
