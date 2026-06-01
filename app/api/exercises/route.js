import { NextResponse } from "next/server";
import sql, { initAdminDb } from "../../../lib/db";

export async function GET() {
  await initAdminDb();
  const exercises = await sql`
    SELECT e.*, COUNT(es.scenario_id)::int AS scenario_count
    FROM exercises e
    LEFT JOIN exercise_scenarios es ON e.id = es.exercise_id
    GROUP BY e.id
    ORDER BY e.created_at
  `;
  return NextResponse.json(exercises);
}
