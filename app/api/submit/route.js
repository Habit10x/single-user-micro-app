import { NextResponse } from "next/server";
import sql, { initDb } from "../../../lib/db";

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

  if (instance_id) {
    await sql`
      INSERT INTO submissions (name, answers, instance_id, exercise_id)
      VALUES (${name.trim()}, ${JSON.stringify(answers)}, ${instance_id}, ${exId})
      ON CONFLICT DO NOTHING
    `;
  } else {
    // Unique per (email, exercise_id) — allows same user to do different exercises
    if (exId) {
      await sql`
        INSERT INTO submissions (email, name, answers, exercise_id)
        VALUES (${email.toLowerCase().trim()}, ${name.trim()}, ${JSON.stringify(answers)}, ${exId})
        ON CONFLICT DO NOTHING
      `;
    } else {
      await sql`
        INSERT INTO submissions (email, name, answers)
        VALUES (${email.toLowerCase().trim()}, ${name.trim()}, ${JSON.stringify(answers)})
        ON CONFLICT (email) DO NOTHING
      `;
    }
  }

  return NextResponse.json({ success: true });
}
