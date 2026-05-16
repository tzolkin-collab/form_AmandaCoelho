"use server";

import { getDb, initDb } from "@/lib/db";

export async function saveLeadProgress(
  idempotencyKey: string,
  answers: Record<number, string>,
  profileName: string,
  options?: { isComplete?: boolean }
) {
  if (!idempotencyKey) return { success: false, error: "Missing idempotency key" };

  try {
    const db = getDb();
    const isComplete = options?.isComplete ?? false;

    await initDb().catch(() => {});

    await db.query(
      `
      INSERT INTO diagnostic_responses (
        idempotency_key,
        profile_name,
        answers,
        updated_at,
        completed_at
      )
      VALUES (
        $1,
        $2,
        $3,
        CURRENT_TIMESTAMP,
        CASE WHEN $4 THEN CURRENT_TIMESTAMP ELSE NULL END
      )
      ON CONFLICT (idempotency_key) DO UPDATE
      SET profile_name = EXCLUDED.profile_name,
          answers = EXCLUDED.answers,
          updated_at = CURRENT_TIMESTAMP,
          completed_at = CASE
            WHEN EXCLUDED.completed_at IS NOT NULL THEN COALESCE(diagnostic_responses.completed_at, EXCLUDED.completed_at)
            ELSE diagnostic_responses.completed_at
          END
      `,
      [idempotencyKey, profileName, JSON.stringify(answers), isComplete]
    );

    return { success: true };
  } catch (error) {
    console.error("Erro ao salvar progresso do lead:", error);
    return { success: false, error: "Database error" };
  }
}
