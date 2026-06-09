import { NextResponse } from "next/server";
import sql, { initDb } from "../../../lib/db";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const instanceId = searchParams.get("instance_id");
  const sessionId  = searchParams.get("session_id");
  const exerciseId = searchParams.get("exercise_id");

  if (!instanceId && !sessionId && !exerciseId) {
    return NextResponse.json({ error: "instance_id, session_id, or exercise_id required" }, { status: 400 });
  }

  await initDb();

  let rows;
  if (instanceId) {
    rows = await sql`
      SELECT name, answers, sharp_results
      FROM submissions
      WHERE instance_id = ${parseInt(instanceId)}
      ORDER BY submitted_at ASC
    `;
  } else if (sessionId) {
    rows = await sql`
      SELECT name, answers, sharp_results
      FROM submissions
      WHERE session_id = ${parseInt(sessionId)}
      ORDER BY submitted_at ASC
    `;
  } else {
    rows = await sql`
      SELECT name, answers, sharp_results
      FROM submissions
      WHERE exercise_id = ${parseInt(exerciseId)}
      ORDER BY submitted_at ASC
    `;
  }

  return NextResponse.json({ submissions: rows });
}
