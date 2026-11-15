import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const key = new TextEncoder().encode(process.env.SESSION_SECRET);
const COOKIE_NAME = "session";

export async function createSession(user, remember = false) {
  const hari = remember ? 30 : 1;
  const expires = new Date(Date.now() + hari * 24 * 60 * 60 * 1000);

  const token = await new SignJWT({
    id: user.id,
    role: user.role,
    nama: user.nama_lengkap,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expires)
    .sign(key);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    ...(remember ? { expires } : {}),
  });
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, key);
    return payload;
  } catch {
    return null;
  }
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}