import { NextResponse } from "next/server"
import sql, { initDb } from "../../../lib/db"

export const dynamic = "force-dynamic"

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const email       = searchParams.get("email")
  const exercise_id = searchParams.get("exercise_id")
  const instance_id = searchParams.get("instance_id")
  const name        = searchParams.get("name")

  try {
    await initDb()
    let rows
    if (instance_id && name) {
      rows = await sql`
        SELECT synthesis_result FROM submissions
        WHERE instance_id = ${parseInt(instance_id)}
        AND LOWER(TRIM(name)) = LOWER(TRIM(${name}))
        LIMIT 1
      `
    } else if (email && exercise_id) {
      rows = await sql`
        SELECT synthesis_result FROM submissions
        WHERE email = ${email.toLowerCase().trim()}
        AND exercise_id = ${parseInt(exercise_id)}
        LIMIT 1
      `
    } else if (email) {
      rows = await sql`
        SELECT synthesis_result FROM submissions
        WHERE email = ${email.toLowerCase().trim()}
        ORDER BY submitted_at DESC LIMIT 1
      `
    } else {
      return NextResponse.json({ synthesis_result: null })
    }
    return NextResponse.json({ synthesis_result: rows[0]?.synthesis_result ?? null })
  } catch {
    return NextResponse.json({ synthesis_result: null })
  }
}
