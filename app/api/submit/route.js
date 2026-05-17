import { NextResponse } from "next/server";
import sql, { initDb } from "../../../lib/db";

export async function POST(request) {
  const body = await request.json();
  const { email, name, answers } = body;

  if (!email || !name || !answers) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  await initDb();

  await sql`
    INSERT INTO submissions (email, name, answers)
    VALUES (${email.toLowerCase().trim()}, ${name.trim()}, ${JSON.stringify(answers)})
    ON CONFLICT (email) DO NOTHING
  `;

  return NextResponse.json({ success: true });
}
