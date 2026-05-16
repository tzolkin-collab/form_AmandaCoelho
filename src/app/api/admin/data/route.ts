import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getDb, initDb } from "@/lib/db";

export async function GET() {
  const cookieStore = cookies();
  const token = cookieStore.get("admin_token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    await initDb().catch(() => {});

    const db = getDb();
    const result = await db.query(`
      SELECT *
      FROM diagnostic_responses
      ORDER BY COALESCE(completed_at, updated_at, created_at) DESC
    `);

    return NextResponse.json({ data: result.rows });
  } catch (error) {
    console.error("Erro ao buscar dados:", error);
    return NextResponse.json({ error: "Erro ao buscar dados" }, { status: 500 });
  }
}
