import { NextResponse } from "next/server";
import sql, { initDb } from "../../../../lib/db";

export async function POST(request) {
  const { pin } = await request.json();

  if (!pin || !/^\d{4}$/.test(String(pin))) {
    return NextResponse.json({ error: "PIN must be exactly 4 digits." }, { status: 400 });
  }

  await initDb();

  const rows = await sql`SELECT id, name FROM instances WHERE pin = ${String(pin)} LIMIT 1`;
  if (!rows.length) {
    return NextResponse.json({ error: "Invalid PIN. Please check with your administrator." }, { status: 404 });
  }

  return NextResponse.json({ id: rows[0].id, name: rows[0].name });
}
