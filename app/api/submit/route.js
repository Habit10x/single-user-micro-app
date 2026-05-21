import { NextResponse } from "next/server";
import sql, { initDb } from "../../../lib/db";

export async function POST(request) {
  const body = await request.json();
  const { email, name, answers, instance_id } = body;

  if (!name || !answers) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  if (!instance_id && !email) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  await initDb();

  if (instance_id) {
    await sql`
      INSERT INTO submissions (name, answers, instance_id)
      VALUES (${name.trim()}, ${JSON.stringify(answers)}, ${instance_id})
      ON CONFLICT DO NOTHING
    `;
  } else {
    await sql`
      INSERT INTO submissions (email, name, answers)
      VALUES (${email.toLowerCase().trim()}, ${name.trim()}, ${JSON.stringify(answers)})
      ON CONFLICT (email) DO NOTHING
    `;
  }

  return NextResponse.json({ success: true });
}
