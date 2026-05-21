import { NextResponse } from "next/server";
import sql, { initSettingsDb } from "../../../lib/db";

export async function GET() {
  await initSettingsDb();
  const rows = await sql`SELECT value FROM settings WHERE key = 'login_enabled'`;
  const enabled = rows.length === 0 || rows[0].value === "true";
  return NextResponse.json({ login_enabled: enabled });
}
