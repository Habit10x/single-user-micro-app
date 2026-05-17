import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

export async function initDb() {
  await sql`
    CREATE TABLE IF NOT EXISTS submissions (
      id          SERIAL PRIMARY KEY,
      email       TEXT UNIQUE NOT NULL,
      name        TEXT NOT NULL,
      answers     JSONB NOT NULL,
      submitted_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

export default sql;
