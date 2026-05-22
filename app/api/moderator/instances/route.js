import { NextResponse } from "next/server";
import sql, { initDb } from "../../../../lib/db";

export async function GET() {
  await initDb();
  const rows = await sql`
    SELECT i.id, i.name, i.pin, i.created_at,
           COUNT(s.id)::int AS user_count
    FROM instances i
    LEFT JOIN submissions s ON s.instance_id = i.id
    GROUP BY i.id, i.name, i.pin, i.created_at
    ORDER BY i.created_at DESC
  `;
  return NextResponse.json(rows);
}
