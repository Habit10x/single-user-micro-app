import { NextResponse } from "next/server";
import sql, { initAdminDb } from "../../../../../lib/db";

export async function PUT(req, { params }) {
  const body = await req.json();
  await initAdminDb();
  const { id } = await params;
  const [scenario] = await sql`
    UPDATE scenarios
    SET short_title = ${body.short_title}, full_title = ${body.full_title},
        prompt = ${body.prompt}, context = ${JSON.stringify(body.context || [])},
        context_type = ${body.context_type || "points"}, task_text = ${body.task_text || ""},
        score = ${body.score}, point_first = ${body.point_first},
        headline = ${body.headline}, what_worked = ${body.what_worked},
        to_improve = ${body.to_improve}
    WHERE id = ${id}
    RETURNING *
  `;
  return NextResponse.json(scenario);
}

export async function DELETE(_, { params }) {
  await initAdminDb();
  const { id } = await params;
  await sql`DELETE FROM scenarios WHERE id = ${id}`;
  return NextResponse.json({ success: true });
}
