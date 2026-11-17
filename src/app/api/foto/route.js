import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export async function GET(request) {
  const user = await getCurrentUser();
  if (!user) return new Response("Harus login", { status: 401 });

  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isInteger(id)) return new Response("Foto tidak ditemukan", { status: 404 });

  const { rows } = await pool.query(
    "SELECT foto_data, foto_tipe FROM users WHERE id = $1 AND foto_data IS NOT NULL",
    [id]
  );
  if (!rows[0]) return new Response("Foto tidak ditemukan", { status: 404 });

  return new Response(rows[0].foto_data, {
    headers: {
      "Content-Type": rows[0].foto_tipe,
      "Cache-Control": "private, no-cache",
      "X-Content-Type-Options": "nosniff",
    },
  });
}