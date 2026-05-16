import { Pool } from "pg";

let pool: Pool | undefined;

export function getDb() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    });
  }
  return pool;
}

export async function initDb() {
  const db = getDb();

  await db.query("CREATE EXTENSION IF NOT EXISTS pgcrypto;");

  await db.query(`
    CREATE TABLE IF NOT EXISTS diagnostic_responses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      idempotency_key VARCHAR(255) UNIQUE NOT NULL,
      profile_name VARCHAR(255) NOT NULL,
      answers JSONB NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP WITH TIME ZONE
    );
  `);

  await db.query(`
    ALTER TABLE diagnostic_responses
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
  `);

  await db.query(`
    ALTER TABLE diagnostic_responses
    ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;
  `);
}
