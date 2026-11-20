import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export async function GET(request) {
  const user = await getCurrentUser();
  if (!user) return new Response("Silakan masuk terlebih dahulu", { status: 401 });

  const id = Number(new URL(request.url).searchParams.get("id"));
  const { rows } = await pool.query(
    `SELECT p.user_id, p.lampiran, p.lampiran_data, p.lampiran_tipe, u.divisi_id
     FROM pengajuan_cuti p JOIN users u ON u.id = p.user_id
     WHERE p.id = $1 AND p.lampiran_data IS NOT NULL`,
    [id]
  );
  const f = rows[0];
  if (!f) return new Response("Lampiran tidak ditemukan", { status: 404 });

  let boleh = f.user_id === user.id || user.role === "hrd";
  if (!boleh && user.role === "ketua_divisi" && f.divisi_id) {
    const r = await pool.query("SELECT 1 FROM divisi WHERE id = $1 AND ketua_id = $2", [f.divisi_id, user.id]);
    boleh = r.rows.length > 0;
  }
  if (!boleh) return new Response("Anda tidak memiliki akses", { status: 403 });

  return new Response(f.lampiran_data, {
    headers: {
      "Content-Type": f.lampiran_tipe,
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(f.lampiran || "lampiran")}`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}