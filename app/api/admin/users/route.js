import { NextResponse } from "next/server";
import sql, { initDb } from "../../../../lib/db";

export async function GET() {
  await initDb();
  const users = await sql`
    SELECT id, name, email, answers, submitted_at
    FROM submissions
    ORDER BY submitted_at DESC
  `;
  return NextResponse.json(users);
}
