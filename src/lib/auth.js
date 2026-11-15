import { redirect } from "next/navigation";
import { getSession } from "./session";

export async function requireSession(roles) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (roles && !roles.includes(session.role)) redirect("/dashboard");
  return session;
}