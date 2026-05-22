import { NextResponse } from "next/server";
import sql, { initDb } from "../../../../lib/db";

export async function GET(request) {
  await initDb();
  const { searchParams } = new URL(request.url);
  const mode        = searchParams.get("mode");
  const instance_id = searchParams.get("instance_id");

  let rows;
  if (mode === "single") {
    rows = await sql`
      SELECT id, name, email, answers, submitted_at
      FROM submissions
      WHERE instance_id IS NULL
      ORDER BY submitted_at DESC
    `;
  } else if (instance_id) {
    rows = await sql`
      SELECT id, name, email, answers, submitted_at
      FROM submissions
      WHERE instance_id = ${parseInt(instance_id)}
      ORDER BY submitted_at DESC
    `;
  } else {
    return NextResponse.json({ error: "Provide mode=single or instance_id" }, { status: 400 });
  }

  return NextResponse.json(rows);
}
