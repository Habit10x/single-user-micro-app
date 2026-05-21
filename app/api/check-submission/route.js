import { NextResponse } from "next/server";
import sql, { initDb } from "../../../lib/db";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const email      = searchParams.get("email")?.toLowerCase().trim();
  const instanceId = searchParams.get("instance_id");
  const teamName   = searchParams.get("name")?.trim();

  await initDb();

  // Instance user lookup (case-insensitive name match within instance)
  if (instanceId && teamName) {
    const rows = await sql`
      SELECT name, answers FROM submissions
      WHERE instance_id = ${parseInt(instanceId)}
      AND LOWER(TRIM(name)) = LOWER(TRIM(${teamName}))
      LIMIT 1
    `;
    if (!rows.length) return NextResponse.json({ submitted: false });
    return NextResponse.json({ submitted: true, name: rows[0].name, answers: rows[0].answers });
  }

  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  const rows = await sql`
    SELECT s.name, s.answers, s.instance_id, i.name AS instance_name
    FROM submissions s
    LEFT JOIN instances i ON s.instance_id = i.id
    WHERE s.email = ${email} LIMIT 1
  `;

  if (!rows.length) return NextResponse.json({ submitted: false });

  return NextResponse.json({
    submitted:     true,
    name:          rows[0].name,
    answers:       rows[0].answers,
    instance_id:   rows[0].instance_id,
    instance_name: rows[0].instance_name,
  });
}
