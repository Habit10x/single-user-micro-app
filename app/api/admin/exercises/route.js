import { NextResponse } from "next/server";
import sql, { initAdminDb } from "../../../../lib/db";

export async function GET() {
  await initAdminDb();
  const exercises = await sql`
    SELECT e.*, COUNT(es.scenario_id)::int AS scenario_count, a.name AS algorithm_name
    FROM exercises e
    LEFT JOIN exercise_scenarios es ON e.id = es.exercise_id
    LEFT JOIN algorithms a ON e.algorithm_id = a.id
    GROUP BY e.id, a.name
    ORDER BY e.created_at
  `;
  return NextResponse.json(exercises);
}

export async function POST(req) {
  const body = await req.json();
  await initAdminDb();
  // Default to SHARP (first algorithm seeded)
  const [sharp] = await sql`SELECT id FROM algorithms WHERE name = 'SHARP' LIMIT 1`;
  const [exercise] = await sql`
    INSERT INTO exercises (title, description, timer_minutes, tags, algorithm_id)
    VALUES (${body.title}, ${body.description || ""}, ${body.timer_minutes || 5}, ${body.tags || ""}, ${sharp?.id || null})
    RETURNING *
  `;
  return NextResponse.json(exercise);
}
