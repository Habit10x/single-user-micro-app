import { NextResponse } from "next/server";
import sql, { initDb } from "../../../../../lib/db";

export async function PATCH(request, { params }) {
  const id   = parseInt(params.id);
  const body = await request.json();
  const { label, gap_hours, force_closed } = body;

  await initDb();

  if (label !== undefined) {
    await sql`UPDATE sessions SET label = ${label} WHERE id = ${id}`;
  }
  if (gap_hours !== undefined) {
    const val = parseFloat(gap_hours);
    if (isNaN(val) || val <= 0) return NextResponse.json({ error: "Invalid gap_hours" }, { status: 400 });
    await sql`UPDATE sessions SET gap_hours = ${val} WHERE id = ${id}`;
  }
  if (force_closed !== undefined) {
    await sql`UPDATE sessions SET force_closed = ${Boolean(force_closed)} WHERE id = ${id}`;
  }

  return NextResponse.json({ success: true });
}
