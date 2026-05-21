import { NextResponse } from "next/server";
import sql, { initDb } from "../../../../lib/db";

export async function GET() {
  await initDb();
  const users = await sql`
    SELECT s.id, s.name, s.email, s.answers, s.submitted_at,
           s.instance_id, i.name AS instance_name
    FROM submissions s
    LEFT JOIN instances i ON s.instance_id = i.id
    ORDER BY s.submitted_at DESC
  `;
  return NextResponse.json(users);
}
