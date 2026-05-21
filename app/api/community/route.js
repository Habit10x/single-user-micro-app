import { NextResponse } from "next/server";
import sql, { initDb } from "../../../lib/db";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const instanceId = searchParams.get("instance_id");

  if (!instanceId) {
    return NextResponse.json({ error: "instance_id required" }, { status: 400 });
  }

  await initDb();

  const rows = await sql`
    SELECT name, answers
    FROM submissions
    WHERE instance_id = ${parseInt(instanceId)}
    ORDER BY submitted_at ASC
  `;

  return NextResponse.json({ submissions: rows });
}
