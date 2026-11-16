import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";
import { createSession } from "@/lib/session";

export async function POST(request) {
  try {
    const { identifier, password, remember } = await request.json();

    if (!identifier || !password) {
      return NextResponse.json(
        { message: "Email/username dan password wajib diisi" },
        { status: 400 }
      );
    }

    const { rows } = await pool.query(
      "SELECT id, password, role, is_active FROM users WHERE email = $1 OR username = $1",
      [identifier]
    );
    const user = rows[0];

    // Pesan sengaja dibuat sama agar tidak membocorkan akun mana yang ada
    const valid = user && (await bcrypt.compare(password, user.password));
    if (!valid) {
      return NextResponse.json(
        { message: "Email/username atau password salah" },
        { status: 401 }
      );
    }

    if (!user.is_active) {
      return NextResponse.json(
        { message: "Akun tidak aktif. Hubungi admin." },
        { status: 403 }
      );
    }

    await createSession(user.id, Boolean(remember));
    return NextResponse.json({ message: "Login berhasil", role: user.role });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}