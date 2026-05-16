import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import DashboardClient from "./DashboardClient";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_for_development";

export default function AdminPage() {
  const cookieStore = cookies();
  const token = cookieStore.get("admin_token")?.value;

  if (!token) {
    redirect("/admin/login");
  }

  try {
    jwt.verify(token, JWT_SECRET);
  } catch (error) {
    redirect("/admin/login");
  }

  return <DashboardClient />;
}