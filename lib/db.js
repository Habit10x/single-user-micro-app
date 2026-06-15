import { neon } from "@neondatabase/serverless";
import { BASE_SYSTEM_PROMPT } from "./scoring/sharp-engine";

export function generateSlug() {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * 36)]).join("");
}

const sql = neon(process.env.DATABASE_URL);

// Per-process promise cache — migrations run once, not on every request.
// Cleared on failure so the next request retries.
let _dbPromise       = null;
let _adminDbPromise  = null;
let _settingsPromise = null;

export async function initDb() {
  if (_dbPromise) return _dbPromise;
  _dbPromise = _initDb().catch(err => { _dbPromise = null; throw err; });
  return _dbPromise;
}

async function _initDb() {
  // Instances must exist before submissions FK references it
  await sql`
    CREATE TABLE IF NOT EXISTS instances (
      id         SERIAL PRIMARY KEY,
      name       TEXT NOT NULL,
      pin        CHAR(4) NOT NULL UNIQUE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS submissions (
      id           SERIAL PRIMARY KEY,
      email        TEXT UNIQUE,
      name         TEXT NOT NULL,
      answers      JSONB NOT NULL,
      submitted_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  // Migration: allow null emails (instance users have no email)
  await sql`ALTER TABLE submissions ALTER COLUMN email DROP NOT NULL`;

  // Migration: add instance FK column
  await sql`
    ALTER TABLE submissions
    ADD COLUMN IF NOT EXISTS instance_id INTEGER REFERENCES instances(id) ON DELETE SET NULL
  `;

  // Unique: one team name per instance (case-insensitive)
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_submissions_instance_name
    ON submissions (instance_id, LOWER(name))
    WHERE instance_id IS NOT NULL
  `;

  // Migration: store SHARP scoring results per submission
  await sql`
    ALTER TABLE submissions ADD COLUMN IF NOT EXISTS sharp_results JSONB
  `;

  // Migration: track which exercise the submission belongs to
  await sql`
    ALTER TABLE submissions ADD COLUMN IF NOT EXISTS exercise_id INTEGER
  `;

  // Unique constraint per (email, exercise_id) so same user can do multiple exercises
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_submissions_email_exercise
    ON submissions (email, exercise_id)
    WHERE email IS NOT NULL AND exercise_id IS NOT NULL
  `;

  // Sessions: time-bounded groups of submissions per exercise
  await sql`
    CREATE TABLE IF NOT EXISTS sessions (
      id           SERIAL PRIMARY KEY,
      exercise_id  INTEGER NOT NULL,
      label        TEXT,
      gap_hours    NUMERIC NOT NULL DEFAULT 6,
      force_closed BOOLEAN NOT NULL DEFAULT FALSE,
      started_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at   TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  // Migration: link each submission to a session
  await sql`
    ALTER TABLE submissions ADD COLUMN IF NOT EXISTS session_id INTEGER REFERENCES sessions(id) ON DELETE SET NULL
  `;
}

export async function initAdminDb() {
  if (_adminDbPromise) return _adminDbPromise;
  _adminDbPromise = _initAdminDb().catch(err => { _adminDbPromise = null; throw err; });
  return _adminDbPromise;
}

async function _initAdminDb() {
  await sql`
    CREATE TABLE IF NOT EXISTS exercises (
      id            SERIAL PRIMARY KEY,
      title         TEXT NOT NULL,
      description   TEXT DEFAULT '',
      difficulty    TEXT DEFAULT 'Intermediate',
      category      TEXT DEFAULT 'Articulation',
      timer_minutes INTEGER DEFAULT 5,
      created_at    TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS scenarios (
      id          SERIAL PRIMARY KEY,
      short_title TEXT NOT NULL,
      full_title  TEXT NOT NULL,
      prompt      TEXT NOT NULL,
      context     JSONB NOT NULL DEFAULT '[]',
      score       INTEGER DEFAULT 7,
      point_first BOOLEAN DEFAULT true,
      headline    TEXT DEFAULT '',
      what_worked TEXT DEFAULT '',
      to_improve  TEXT DEFAULT '',
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS exercise_scenarios (
      exercise_id INTEGER REFERENCES exercises(id) ON DELETE CASCADE,
      scenario_id INTEGER REFERENCES scenarios(id) ON DELETE CASCADE,
      order_index INTEGER DEFAULT 0,
      PRIMARY KEY (exercise_id, scenario_id)
    )
  `;

  // Migration: add tags field to exercises
  await sql`ALTER TABLE exercises ADD COLUMN IF NOT EXISTS tags TEXT DEFAULT ''`;

  // Migration: add task_description to exercises (shown under "The Task" on instruction page)
  await sql`ALTER TABLE exercises ADD COLUMN IF NOT EXISTS task_description TEXT DEFAULT ''`;

  // Migration: add context_type and task_text to scenarios for task-text mode
  await sql`ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS context_type TEXT DEFAULT 'points'`;
  await sql`ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS task_text TEXT DEFAULT ''`;

  // Migration: add show_default_tags toggle to exercises
  await sql`ALTER TABLE exercises ADD COLUMN IF NOT EXISTS show_default_tags BOOLEAN DEFAULT TRUE`;

  // Migration: add slug for unguessable exercise URLs
  await sql`ALTER TABLE exercises ADD COLUMN IF NOT EXISTS slug TEXT`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_exercises_slug ON exercises(slug) WHERE slug IS NOT NULL AND slug != ''`;
  // Backfill slugs for any existing exercises that don't have one
  const unsluggedRows = await sql`SELECT id FROM exercises WHERE slug IS NULL OR slug = ''`;
  for (const row of unsluggedRows) {
    let slug;
    for (let i = 0; i < 20; i++) {
      slug = generateSlug();
      const [exists] = await sql`SELECT id FROM exercises WHERE slug = ${slug}`;
      if (!exists) break;
    }
    await sql`UPDATE exercises SET slug = ${slug} WHERE id = ${row.id}`;
  }

  // Algorithms: named, versioned scoring configurations
  await sql`
    CREATE TABLE IF NOT EXISTS algorithms (
      id                SERIAL PRIMARY KEY,
      name              TEXT NOT NULL UNIQUE,
      base_prompt       TEXT NOT NULL DEFAULT '',
      dimension_weights JSONB NOT NULL DEFAULT '{}',
      created_at        TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  // Migration: link each exercise to an algorithm
  await sql`ALTER TABLE exercises ADD COLUMN IF NOT EXISTS algorithm_id INTEGER REFERENCES algorithms(id)`;

  // Migration: add custom output schema and synthesis fields to algorithms
  await sql`ALTER TABLE algorithms ADD COLUMN IF NOT EXISTS output_schema TEXT`;
  await sql`ALTER TABLE algorithms ADD COLUMN IF NOT EXISTS synthesis_prompt TEXT`;
  await sql`ALTER TABLE algorithms ADD COLUMN IF NOT EXISTS synthesis_schema TEXT`;

  // Migration: store synthesis result per submission
  await sql`ALTER TABLE submissions ADD COLUMN IF NOT EXISTS synthesis_result JSONB`;

  // Seed SHARP as the built-in algorithm (once)
  const [{ count: algoCount }] = await sql`SELECT COUNT(*)::int AS count FROM algorithms`;
  if (algoCount === 0) {
    await sql`
      INSERT INTO algorithms (name, base_prompt, dimension_weights)
      VALUES ('SHARP', ${BASE_SYSTEM_PROMPT}, '{}')
    `;
  }

  // Seed default data once if exercises table is empty
  const [{ count }] = await sql`SELECT COUNT(*)::int AS count FROM exercises`;
  if (count === 0) await seedDefaults();
}

async function seedDefaults() {
  const seedScenarios = [
    {
      short_title: "Project Update", full_title: "Project Update",
      prompt: `Your manager asks: "How's the Horizon project coming along?"`,
      context: ["4 of 6 emails done, approved by marketing","Email 3: legal review delay — resolved","On track for next Friday deadline","Design team hasn't replied about header format — if no reply by Tuesday, 3-day delay"],
      score: 8, point_first: true,
      headline: "Strong status open — but the risk lands too late",
      what_worked: "Led with current status and completion count. The resolved delay was handled efficiently in one clause.",
      to_improve: "The design decision risk is the most time-sensitive item. It should follow the status immediately — not come after a resolved issue that's already done."
    },
    {
      short_title: "Show Rec.", full_title: "Show Recommendation",
      prompt: `Your friend texts: "Should I watch that crime show you just finished? I have one evening free."`,
      context: ["6 episodes. Eps 1–4: gripping, watched all four in one sitting","Eps 5–6: romance subplot takes over, tension drops significantly","Finale reveal satisfying but last 20 min feel rushed","Friend likes crime shows, hates shows that drag"],
      score: 5, point_first: true,
      headline: "Recommendation is clear but reasoning is entirely generic",
      what_worked: "Led with a direct yes — that's correct. Overall structure is right.",
      to_improve: "'Interesting story' describes every show. Use what you actually know: 4 eps in one sitting, then a dip, then a satisfying ending."
    },
    {
      short_title: "Missed Meeting", full_title: "Missed Meeting",
      prompt: `Your team lead messages: "You weren't on the call — what happened, and what did you miss?"`,
      context: ["Water pipe emergency at 2:50pm — no time to message first","Caught up with colleague: presentation moved to Thursday (no content change)","New expense approval: >₹5k needs 2 managers via new form, starts Monday","Tuesday sync cancelled (public holiday)"],
      score: 9, point_first: false,
      headline: "Near-perfect — every element in the right order",
      what_worked: "Brief, non-defensive, all updates specific and actionable.",
      to_improve: "Minor: skipping 'Hi' in the opening would make it even tighter."
    },
    {
      short_title: "Explain Role", full_title: "Explain Your Role",
      prompt: `A family member asks: "So what is it that you actually do at work? I've never understood."`,
      context: ["Role: Business Analyst at a consumer goods company","You find why products underperform and write 2–3 page reports for marketing/ops","Last month: found shelf placement (not pricing) was killing sales in 3 cities","Time: ~60% data, ~30% meetings, ~10% writing"],
      score: 4, point_first: false,
      headline: "Opens by signalling complexity — opposite of what this needs",
      what_worked: "Identified the general nature of the work (analytical, reports).",
      to_improve: "Lead with what you produce and why it matters, then give the shelf-placement example."
    }
  ];

  const scenarioIds = [];
  for (const s of seedScenarios) {
    const [{ id }] = await sql`
      INSERT INTO scenarios (short_title, full_title, prompt, context, score, point_first, headline, what_worked, to_improve)
      VALUES (${s.short_title}, ${s.full_title}, ${s.prompt}, ${JSON.stringify(s.context)},
              ${s.score}, ${s.point_first}, ${s.headline}, ${s.what_worked}, ${s.to_improve})
      RETURNING id
    `;
    scenarioIds.push(id);
  }

  const [{ id: exerciseId }] = await sql`
    INSERT INTO exercises (title, description, difficulty, category, timer_minutes)
    VALUES ('Articulation-01', 'This test will help you in your articulation.', 'Intermediate', 'Articulation', 5)
    RETURNING id
  `;

  for (let i = 0; i < scenarioIds.length; i++) {
    await sql`
      INSERT INTO exercise_scenarios (exercise_id, scenario_id, order_index)
      VALUES (${exerciseId}, ${scenarioIds[i]}, ${i})
    `;
  }
}

export async function initSettingsDb() {
  if (_settingsPromise) return _settingsPromise;
  _settingsPromise = _initSettingsDb().catch(err => { _settingsPromise = null; throw err; });
  return _settingsPromise;
}

async function _initSettingsDb() {
  await sql`
    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `;
  await sql`
    INSERT INTO settings (key, value) VALUES ('login_enabled', 'true')
    ON CONFLICT (key) DO NOTHING
  `;
}

export default sql;
