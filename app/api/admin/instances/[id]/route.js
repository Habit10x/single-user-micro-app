import { NextResponse } from "next/server";
import sql, { initDb } from "../../../../../lib/db";

export async function GET(request, { params }) {
  await initDb();

  const id = parseInt(params.id);
  const [inst] = await sql`SELECT * FROM instances WHERE id = ${id}`;
  if (!inst) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const users = await sql`
    SELECT name, submitted_at, answers
    FROM submissions
    WHERE instance_id = ${id}
    ORDER BY submitted_at ASC
  `;

  return NextResponse.json({ ...inst, users });
}

export async function DELETE(request, { params }) {
  await initDb();

  const id = parseInt(params.id);
  await sql`DELETE FROM instances WHERE id = ${id}`;
  return NextResponse.json({ success: true });
}
