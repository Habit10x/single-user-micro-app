import { NextResponse } from "next/server";
import sql, { initAdminDb } from "../../../../../lib/db";

export async function GET(_, { params }) {
  await initAdminDb();
  const { id } = await params;
  const [exercise] = await sql`SELECT * FROM exercises WHERE id = ${id}`;
  if (!exercise) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const scenarios = await sql`
    SELECT s.* FROM scenarios s
    JOIN exercise_scenarios es ON s.id = es.scenario_id
    WHERE es.exercise_id = ${id}
    ORDER BY es.order_index
  `;
  return NextResponse.json({ ...exercise, scenarios });
}

export async function PUT(req, { params }) {
  const body = await req.json();
  await initAdminDb();
  const { id } = await params;
  const [exercise] = await sql`
    UPDATE exercises
    SET title = ${body.title}, description = ${body.description},
        difficulty = ${body.difficulty}, category = ${body.category},
        timer_minutes = ${body.timer_minutes}
    WHERE id = ${id}
    RETURNING *
  `;
  return NextResponse.json(exercise);
}

export async function DELETE(_, { params }) {
  await initAdminDb();
  const { id } = await params;
  await sql`DELETE FROM exercises WHERE id = ${id}`;
  return NextResponse.json({ success: true });
}
