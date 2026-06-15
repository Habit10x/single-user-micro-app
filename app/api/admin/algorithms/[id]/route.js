import { NextResponse } from "next/server"
import sql, { initAdminDb } from "../../../../../lib/db"

export const dynamic = "force-dynamic"

export async function GET(_, { params }) {
  await initAdminDb()
  const { id } = await params
  const rows = await sql`
    SELECT a.*, COUNT(e.id)::int AS exercise_count
    FROM algorithms a
    LEFT JOIN exercises e ON e.algorithm_id = a.id
    WHERE a.id = ${parseInt(id)}
    GROUP BY a.id
  `
  if (!rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(rows[0])
}

export async function PUT(request, { params }) {
  const { id } = await params
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
  const rows = await sql`
    UPDATE algorithms
    SET name              = ${name.trim()},
        base_prompt       = ${base_prompt.trim()},
        dimension_weights = ${JSON.stringify(weights)},
        output_schema     = ${output_schema?.trim() || null},
        synthesis_prompt  = ${synthesis_prompt?.trim() || null},
        synthesis_schema  = ${synthesis_schema?.trim() || null}
    WHERE id = ${parseInt(id)}
    RETURNING *
  `
  if (!rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(rows[0])
}
