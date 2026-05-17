import { NextResponse } from "next/server";
import sql, { initAdminDb } from "../../../../../../lib/db";

export async function POST(req, { params }) {
  const { scenario_id } = await req.json();
  await initAdminDb();
  const { id } = await params;
  const [{ max_order }] = await sql`
    SELECT COALESCE(MAX(order_index), -1) AS max_order
    FROM exercise_scenarios WHERE exercise_id = ${id}
  `;
  await sql`
    INSERT INTO exercise_scenarios (exercise_id, scenario_id, order_index)
    VALUES (${id}, ${scenario_id}, ${max_order + 1})
    ON CONFLICT DO NOTHING
  `;
  return NextResponse.json({ success: true });
}

export async function DELETE(req, { params }) {
  const { scenario_id } = await req.json();
  await initAdminDb();
  const { id } = await params;
  await sql`
    DELETE FROM exercise_scenarios
    WHERE exercise_id = ${id} AND scenario_id = ${scenario_id}
  `;
  return NextResponse.json({ success: true });
}
