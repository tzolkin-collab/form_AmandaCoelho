require("dotenv").config({ path: ".env" });
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

async function run() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS diagnostic_responses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        idempotency_key VARCHAR(255) UNIQUE NOT NULL,
        profile_name VARCHAR(255) NOT NULL,
        answers JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Tabela 'diagnostic_responses' criada com sucesso!");
  } catch (error) {
    console.error("Erro ao criar tabela:", error);
  } finally {
    await pool.end();
  }
}

run();