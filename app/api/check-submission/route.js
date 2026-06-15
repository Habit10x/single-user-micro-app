import { NextResponse } from "next/server";
import sql, { initDb } from "../../../lib/db";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const email      = searchParams.get("email")?.toLowerCase().trim();
  const instanceId = searchParams.get("instance_id");
  const teamName   = searchParams.get("name")?.trim();
  const exerciseId = searchParams.get("exercise_id");
  const exId       = exerciseId ? parseInt(exerciseId) : null;

  await initDb();

  // Instance user lookup
  if (instanceId && teamName) {
    const rows = await sql`
      SELECT name, answers, sharp_results, synthesis_result FROM submissions
      WHERE instance_id = ${parseInt(instanceId)}
      AND LOWER(TRIM(name)) = LOWER(TRIM(${teamName}))
      LIMIT 1
    `;
    if (!rows.length) return NextResponse.json({ submitted: false });
    return NextResponse.json({
      submitted:        true,
      name:             rows[0].name,
      answers:          rows[0].answers,
      sharp_results:    rows[0].sharp_results    || null,
      synthesis_result: rows[0].synthesis_result || null,
    });
  }

  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  // Look up by (email, exercise_id) when exercise_id is provided
  const rows = exId
    ? await sql`
        SELECT s.name, s.answers, s.sharp_results, s.synthesis_result, s.instance_id, s.session_id, i.name AS instance_name
        FROM submissions s
        LEFT JOIN instances i ON s.instance_id = i.id
        WHERE s.email = ${email} AND s.exercise_id = ${exId}
        LIMIT 1
      `
    : await sql`
        SELECT s.name, s.answers, s.sharp_results, s.synthesis_result, s.instance_id, s.session_id, i.name AS instance_name
        FROM submissions s
        LEFT JOIN instances i ON s.instance_id = i.id
        WHERE s.email = ${email}
        LIMIT 1
      `;

  if (!rows.length) return NextResponse.json({ submitted: false });

  return NextResponse.json({
    submitted:        true,
    name:             rows[0].name,
    answers:          rows[0].answers,
    sharp_results:    rows[0].sharp_results    || null,
    synthesis_result: rows[0].synthesis_result || null,
    instance_id:      rows[0].instance_id,
    session_id:       rows[0].session_id       || null,
    instance_name:    rows[0].instance_name,
  });
}
