import { NextResponse } from "next/server";
import sql, { initAdminDb, generateSlug } from "../../../../lib/db";

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
  const [sharp] = await sql`SELECT id FROM algorithms WHERE name = 'SHARP' LIMIT 1`;
  // Generate a unique slug
  let slug;
  for (let i = 0; i < 20; i++) {
    slug = generateSlug();
    const [exists] = await sql`SELECT id FROM exercises WHERE slug = ${slug}`;
    if (!exists) break;
  }
  const [exercise] = await sql`
    INSERT INTO exercises (title, description, category, task_description, timer_minutes, tags, show_default_tags, slug, algorithm_id)
    VALUES (${body.title}, ${body.description || ""}, ${body.category || ""}, ${body.task_description || ""}, ${body.timer_minutes || 5}, ${body.tags || ""}, ${body.show_default_tags !== false}, ${slug}, ${sharp?.id || null})
    RETURNING *
  `;
  return NextResponse.json(exercise);
}
