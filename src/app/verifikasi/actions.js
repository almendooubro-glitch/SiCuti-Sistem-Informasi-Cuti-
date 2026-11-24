"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import pool from "@/lib/db";
import { requireUser } from "@/lib/session";

const AKTIF = "('pending','approved_leader','approved')";

async function proses(user, id, aksi, catatan) {
  const hrd = user.role === "hrd";
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      `SELECT p.id, j.memotong_kuota,
              u.kuota_awal - COALESCE((
                SELECT SUM(x.total_hari) FROM pengajuan_cuti x
                JOIN jenis_cuti jx ON jx.id = x.jenis_cuti_id
                WHERE x.user_id = u.id AND jx.memotong_kuota
                  AND EXTRACT(YEAR FROM x.tanggal_mulai) = EXTRACT(YEAR FROM p.tanggal_mulai)
                  AND x.status IN ${AKTIF}), 0) AS sisa
       FROM pengajuan_cuti p
       JOIN users u ON u.id = p.user_id
       JOIN jenis_cuti j ON j.id = p.jenis_cuti_id
       WHERE p.id = $1 AND ${
         hrd
           ? "(p.status = 'approved_leader' OR (p.status = 'pending' AND u.role = 'ketua_divisi'))"
           : "p.status = 'pending' AND u.role = 'user' AND u.divisi_id IN (SELECT id FROM divisi WHERE ketua_id = $2)"
       }
       FOR UPDATE OF p`,
      hrd ? [id] : [id, user.id]
    );
    const p = rows[0];
    if (!p) {
      await client.query("ROLLBACK");
      return "Pengajuan tidak ditemukan atau sudah diproses";
    }

    if (hrd && aksi === "approved" && p.memotong_kuota && Number(p.sisa) < 0) {
      await client.query("ROLLBACK");
      return "Kuota karyawan tidak mencukupi untuk disetujui";
    }

    const status = aksi === "rejected" ? "rejected" : hrd ? "approved" : "approved_leader";
    await client.query(
      `UPDATE pengajuan_cuti
       SET status = $1,
           perlu_pengganti = CASE WHEN $1 = 'rejected' THEN FALSE ELSE perlu_pengganti END
       WHERE id = $2`,
      [status, id]
    );
    await client.query(
      "INSERT INTO approval_log (pengajuan_id, approver_id, level, aksi, catatan) VALUES ($1, $2, $3, $4, $5)",
      [id, user.id, hrd ? "hrd" : "leader", aksi, catatan]
    );

    await client.query("COMMIT");
    return null;
  } catch (e) {
    await client.query("ROLLBACK");
    console.error(e);
    return "Terjadi kesalahan pada server";
  } finally {
    client.release();
  }
}

function selesai(error, info) {
  revalidatePath("/verifikasi");
  revalidatePath("/dashboard");
  revalidatePath("/cuti");
  redirect(error ? `/verifikasi?error=${encodeURIComponent(error)}` : `/verifikasi?info=${encodeURIComponent(info)}`);
}

export async function putuskan(formData) {
  const user = await requireUser(["ketua_divisi", "hrd"]);
  const id = Number(formData.get("id"));
  const aksi = String(formData.get("aksi"));
  const catatan = String(formData.get("catatan") || "").trim() || null;

  if (!["approved", "rejected"].includes(aksi)) selesai("Aksi tidak valid");
  if (aksi === "rejected" && !catatan) selesai("Catatan wajib diisi saat menolak pengajuan");

  const error = await proses(user, id, aksi, catatan);
  selesai(error, aksi === "approved" ? "Pengajuan disetujui" : "Pengajuan ditolak");
}

export async function setujuiBanyak(formData) {
  const user = await requireUser(["hrd"]);
  const ids = formData.getAll("ids").map(Number).filter(Number.isInteger);
  if (ids.length === 0) selesai("Pilih minimal satu pengajuan");

  let berhasil = 0;
  const gagal = [];
  for (const id of ids) {
    const error = await proses(user, id, "approved", null);
    if (error) gagal.push(`#${id}: ${error}`);
    else berhasil++;
  }

  selesai(
    gagal.length ? `${berhasil} disetujui, ${gagal.length} gagal (${gagal.join("; ")})` : null,
    `${berhasil} pengajuan disetujui`
  );
}

export async function tetapkanPengganti(formData) {
  await requireUser(["hrd"]);
  const id = Number(formData.get("id"));
  const penggantiId = Number(formData.get("handover_user_id"));
  if (!Number.isInteger(id) || id < 1 || !Number.isInteger(penggantiId) || penggantiId < 1) {
    selesai("Pengajuan atau rekan pengganti tidak valid");
  }

  let error = null;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      `SELECT p.user_id, p.tanggal_mulai, p.tanggal_selesai, u.divisi_id
       FROM pengajuan_cuti p
       JOIN users u ON u.id = p.user_id
       WHERE p.id = $1 AND p.perlu_pengganti = TRUE
         AND p.status IN ${AKTIF} AND p.tanggal_selesai >= CURRENT_DATE
       FOR UPDATE OF p`,
      [id]
    );
    const tugas = rows[0];

    if (!tugas) {
      error = "Tugas pengganti tidak ditemukan atau sudah ditangani";
    } else {
      const calon = await client.query(
        `SELECT 1 FROM users k
         WHERE k.id = $1 AND k.divisi_id = $2 AND k.is_active
           AND k.role IN ('user','ketua_divisi') AND k.id <> $3
           AND NOT EXISTS (
             SELECT 1 FROM pengajuan_cuti p
             WHERE p.user_id = k.id AND p.status IN ${AKTIF}
               AND p.tanggal_mulai <= $5 AND p.tanggal_selesai >= $4
           )
         LIMIT 1`,
        [penggantiId, tugas.divisi_id, tugas.user_id, tugas.tanggal_mulai, tugas.tanggal_selesai]
      );
      if (!calon.rows.length) {
        error = "Pilih karyawan atau Ketua Divisi aktif yang tidak sedang cuti pada tanggal tersebut";
      } else {
        await client.query(
          `UPDATE pengajuan_cuti
           SET handover_user_id = $1, perlu_pengganti = FALSE
           WHERE id = $2`,
          [penggantiId, id]
        );
      }
    }

    await client.query(error ? "ROLLBACK" : "COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    console.error(e);
    error = "Terjadi kesalahan pada server";
  } finally {
    client.release();
  }

  selesai(error, "Rekan pengganti berhasil ditetapkan");
}