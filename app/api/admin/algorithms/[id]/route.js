import { NextResponse } from "next/server"
import sql, { initAdminDb } from "../../../../../lib/db"

export const dynamic = "force-dynamic"

export async function GET(_, { params }) {
  await initAdminDb()
  const { id } = await params
  const rows = await sql`
    SELECT a.*, COUNT(e.id)::int AS exercise_count
    FROM algorithms a
    LEFT JOIN exercises e ON e.algorithm_id = a.id
    WHERE a.id = ${parseInt(id)}
    GROUP BY a.id
  `
  if (!rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(rows[0])
}
