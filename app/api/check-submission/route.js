import { NextResponse } from "next/server";
import sql, { initDb } from "../../../lib/db";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email")?.toLowerCase().trim();

  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  await initDb();

  const rows = await sql`
    SELECT name, answers FROM submissions WHERE email = ${email} LIMIT 1
  `;

  if (rows.length === 0) {
    return NextResponse.json({ submitted: false });
  }

  return NextResponse.json({
    submitted: true,
    name: rows[0].name,
    answers: rows[0].answers,
  });
}
