import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import crypto from "crypto";
import pool from "@/lib/db";

const COOKIE_NAME = "sicuti_session";

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId, remember) {
  const token = crypto.randomBytes(32).toString("hex");
  const days = remember ? 30 : 1;
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  await pool.query(
    "INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3)",
    [hashToken(token), userId, expires]
  );

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    ...(remember ? { expires } : {}),
  });
}

export async function getCurrentUser() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const { rows } = await pool.query(
    `SELECT u.id, u.username, u.email, u.nama_lengkap, u.role, u.divisi_id
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = $1 AND s.expires_at > NOW() AND u.is_active = TRUE`,
    [hashToken(token)]
  );
  return rows[0] || null;
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (token) {
    await pool.query("DELETE FROM sessions WHERE token_hash = $1", [
      hashToken(token),
    ]);
  }
  store.delete(COOKIE_NAME);
}

export async function requireUser(roles) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (roles && !roles.includes(user.role)) redirect("/dashboard");
  return user;
}