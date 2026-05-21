import { NextResponse } from "next/server";
import sql, { initDb } from "../../../../lib/db";

export async function GET() {
  await initDb();

  const rows = await sql`
    SELECT i.id, i.name, i.pin, i.created_at,
           COUNT(s.id)::int AS user_count
    FROM instances i
    LEFT JOIN submissions s ON s.instance_id = i.id
    GROUP BY i.id, i.name, i.pin, i.created_at
    ORDER BY i.created_at DESC
  `;

  return NextResponse.json(rows);
}

export async function POST(request) {
  const { name } = await request.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  await initDb();

  // Generate a unique 4-digit PIN (1000–9999)
  let pin;
  for (let attempts = 0; attempts < 20; attempts++) {
    const candidate = String(Math.floor(1000 + Math.random() * 9000));
    const existing = await sql`SELECT id FROM instances WHERE pin = ${candidate}`;
    if (!existing.length) { pin = candidate; break; }
  }

  if (!pin) {
    return NextResponse.json({ error: "Could not generate a unique PIN." }, { status: 500 });
  }

  const [inst] = await sql`
    INSERT INTO instances (name, pin) VALUES (${name.trim()}, ${pin}) RETURNING *
  `;

  return NextResponse.json(inst, { status: 201 });
}
