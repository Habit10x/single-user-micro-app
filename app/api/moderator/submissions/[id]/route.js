import { NextResponse } from "next/server";
import sql, { initDb } from "../../../../../lib/db";

export async function DELETE(request, { params }) {
  await initDb();
  const id = parseInt(params.id);
  await sql`DELETE FROM submissions WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
