import { NextResponse } from "next/server";
import sql, { initSettingsDb } from "../../../../lib/db";

export async function GET() {
  await initSettingsDb();
  const rows = await sql`SELECT key, value FROM settings`;
  const settings = {};
  for (const r of rows) settings[r.key] = r.value;
  return NextResponse.json(settings);
}

export async function PUT(request) {
  await initSettingsDb();
  const { key, value } = await request.json();
  if (!key || value === undefined) {
    return NextResponse.json({ error: "key and value required" }, { status: 400 });
  }
  await sql`
    INSERT INTO settings (key, value) VALUES (${key}, ${value})
    ON CONFLICT (key) DO UPDATE SET value = ${value}
  `;
  return NextResponse.json({ success: true });
}
