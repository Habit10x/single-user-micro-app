import { NextResponse } from "next/server"
import sql, { initAdminDb } from "../../../../lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  await initAdminDb()
  const rows = await sql`
    SELECT a.*, COUNT(e.id)::int AS exercise_count
    FROM algorithms a
    LEFT JOIN exercises e ON e.algorithm_id = a.id
    GROUP BY a.id
    ORDER BY a.created_at ASC
  `
  return NextResponse.json(rows)
}

export async function POST(request) {
  const { name, base_prompt, dimension_weights, output_schema, synthesis_prompt, synthesis_schema } = await request.json()

  if (!name?.trim())        return NextResponse.json({ error: "Name is required" }, { status: 400 })
  if (!base_prompt?.trim()) return NextResponse.json({ error: "Base prompt is required" }, { status: 400 })

  const weights = dimension_weights || {}
  if (Object.keys(weights).length > 0) {
    const total = Object.values(weights).reduce((a, b) => a + Number(b), 0)
    if (total !== 100) {
      return NextResponse.json({ error: `Weights must sum to 100 (currently ${total})` }, { status: 400 })
    }
  }

  if (output_schema?.trim()) {
    try { JSON.parse(output_schema) } catch {
      return NextResponse.json({ error: "Output Schema is not valid JSON" }, { status: 400 })
    }
  }

  if (synthesis_schema?.trim()) {
    try { JSON.parse(synthesis_schema) } catch {
      return NextResponse.json({ error: "Synthesis Output Schema is not valid JSON" }, { status: 400 })
    }
  }

  await initAdminDb()
  const [row] = await sql`
    INSERT INTO algorithms (name, base_prompt, dimension_weights, output_schema, synthesis_prompt, synthesis_schema)
    VALUES (
      ${name.trim()},
      ${base_prompt.trim()},
      ${JSON.stringify(weights)},
      ${output_schema?.trim() || null},
      ${synthesis_prompt?.trim() || null},
      ${synthesis_schema?.trim() || null}
    )
    RETURNING *
  `
  return NextResponse.json(row, { status: 201 })
}
