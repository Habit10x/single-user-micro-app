import { NextResponse } from "next/server";
import sql, { initDb } from "../../../lib/db";

async function resolveSessionId(exId) {
  // Find the most recent non-force-closed session that still has submissions within its gap
  const rows = await sql`
    SELECT s.id, s.gap_hours, MAX(sub.submitted_at) AS last_sub
    FROM sessions s
    JOIN submissions sub ON sub.session_id = s.id
    WHERE s.exercise_id = ${exId}
      AND s.force_closed = FALSE
    GROUP BY s.id, s.gap_hours
    ORDER BY MAX(sub.submitted_at) DESC
    LIMIT 1
  `;

  if (rows.length) {
    const { id, gap_hours, last_sub } = rows[0];
    const gapMs   = parseFloat(gap_hours) * 3600 * 1000;
    const elapsed = Date.now() - new Date(last_sub).getTime();
    if (elapsed < gapMs) return id; // still within gap — join this session
  }

  // No active session — create a new one (default 6-hour gap, admin can adjust)
  const [newSess] = await sql`
    INSERT INTO sessions (exercise_id, gap_hours)
    VALUES (${exId}, 6)
    RETURNING id
  `;
  return newSess.id;
}

export async function POST(request) {
  const body = await request.json();
  const { email, name, answers, instance_id, exercise_id } = body;

  if (!name || !answers) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  if (!instance_id && !email) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  await initDb();

  const exId = exercise_id ? parseInt(exercise_id) : null;

  // Resolve session for email-based submissions with a known exercise
  const sessionId = (!instance_id && exId) ? await resolveSessionId(exId) : null;

  if (instance_id) {
    await sql`
      INSERT INTO submissions (name, answers, instance_id, exercise_id)
      VALUES (${name.trim()}, ${JSON.stringify(answers)}, ${instance_id}, ${exId})
      ON CONFLICT DO NOTHING
    `;
  } else if (exId) {
    await sql`
      INSERT INTO submissions (email, name, answers, exercise_id, session_id)
      VALUES (${email.toLowerCase().trim()}, ${name.trim()}, ${JSON.stringify(answers)}, ${exId}, ${sessionId})
      ON CONFLICT DO NOTHING
    `;
  } else {
    await sql`
      INSERT INTO submissions (email, name, answers)
      VALUES (${email.toLowerCase().trim()}, ${name.trim()}, ${JSON.stringify(answers)})
      ON CONFLICT (email) DO NOTHING
    `;
  }

  return NextResponse.json({ success: true, session_id: sessionId });
}
