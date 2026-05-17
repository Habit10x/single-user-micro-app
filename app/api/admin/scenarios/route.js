import { NextResponse } from "next/server";
import sql, { initAdminDb } from "../../../../lib/db";

export async function GET() {
  await initAdminDb();
  const scenarios = await sql`SELECT * FROM scenarios ORDER BY created_at`;
  return NextResponse.json(scenarios);
}

export async function POST(req) {
  const body = await req.json();
  await initAdminDb();
  const [scenario] = await sql`
    INSERT INTO scenarios (short_title, full_title, prompt, context, score, point_first, headline, what_worked, to_improve)
    VALUES (${body.short_title}, ${body.full_title}, ${body.prompt},
            ${JSON.stringify(body.context || [])}, ${body.score ?? 7}, ${body.point_first ?? true},
            ${body.headline || ""}, ${body.what_worked || ""}, ${body.to_improve || ""})
    RETURNING *
  `;
  return NextResponse.json(scenario);
}
