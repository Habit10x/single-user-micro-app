import { NextResponse } from "next/server";
import sql, { initSettingsDb } from "../../../lib/db";

export const dynamic = "force-dynamic";

// Keys the moderator panel is allowed to read/write without admin auth
const ALLOWED_KEYS = ["login_enabled", "default_exercise_id", "instance_login_enabled"];

export async function GET() {
  await initSettingsDb();
  const rows = await sql`SELECT key, value FROM settings`;
  const map = {};
  for (const r of rows) map[r.key] = r.value;
  return NextResponse.json({
    login_enabled:          map.login_enabled !== "false",
    default_exercise_id:    map.default_exercise_id || null,
    instance_login_enabled: map.instance_login_enabled !== "false",
  });
}

export async function PUT(request) {
  const { key, value } = await request.json();
  if (!key || !ALLOWED_KEYS.includes(key) || value === undefined) {
    return NextResponse.json({ error: "Invalid key" }, { status: 400 });
  }
  await initSettingsDb();
  await sql`
    INSERT INTO settings (key, value) VALUES (${key}, ${String(value)})
    ON CONFLICT (key) DO UPDATE SET value = ${String(value)}
  `;
  return NextResponse.json({ success: true });
}
