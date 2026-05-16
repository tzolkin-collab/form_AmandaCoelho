import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { serialize } from "cookie";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_for_development";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "assinatura2022";

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Senha incorreta" }, { status: 401 });
    }

    const token = jwt.sign({ role: "admin" }, JWT_SECRET, { expiresIn: "1d" });

    const cookieStr = serialize("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 1 day
      path: "/",
    });

    const response = NextResponse.json({ success: true });
    response.headers.set("Set-Cookie", cookieStr);

    return response;
  } catch (error) {
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}