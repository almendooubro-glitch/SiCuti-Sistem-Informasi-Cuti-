import pool from "@/lib/db";
import { parseTanggal } from "@/lib/hari";

export async function cekKapasitas(divisiId, mulai, selesai, userId) {
  const maks = Number(
    (await pool.query("SELECT nilai FROM pengaturan WHERE kunci = 'kapasitas_maks_persen'")).rows[0]?.nilai ?? 100
  );
  const anggota = (
    await pool.query(
      "SELECT COUNT(*)::int AS n FROM users WHERE divisi_id = $1 AND is_active AND role IN ('user','ketua_divisi')",
      [divisiId]
    )
  ).rows[0].n;
  if (anggota < 2) return null;

  const libur = new Set(
    (
      await pool.query("SELECT to_char(tanggal,'YYYY-MM-DD') AS t FROM hari_libur WHERE tanggal BETWEEN $1 AND $2", [
        mulai,
        selesai,
      ])
    ).rows.map((r) => r.t)
  );

  const { rows } = await pool.query(
    `SELECT to_char(g.d, 'YYYY-MM-DD') AS tanggal, COUNT(DISTINCT p.user_id)::int AS cuti
     FROM generate_series($2::date, $3::date, interval '1 day') AS g(d)
     LEFT JOIN (
       SELECT x.user_id, x.tanggal_mulai, x.tanggal_selesai
       FROM pengajuan_cuti x JOIN users u ON u.id = x.user_id
       WHERE u.divisi_id = $1 AND x.user_id <> $4
         AND x.status IN ('pending','approved_leader','approved')
     ) p ON p.tanggal_mulai <= g.d AND p.tanggal_selesai >= g.d
     GROUP BY g.d ORDER BY g.d`,
    [divisiId, mulai, selesai, userId]
  );

  let persen = 0;
  let tanggal = null;
  for (const r of rows) {
    const w = parseTanggal(r.tanggal).getDay();
    if (w === 0 || w === 6 || libur.has(r.tanggal)) continue;
    const p = Math.round(((r.cuti + 1) / anggota) * 100);
    if (p > persen) {
      persen = p;
      tanggal = r.tanggal;
    }
  }

  return { maks, persen, tanggal, melebihi: persen > maks };
}