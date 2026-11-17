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
                WHERE x.user_id = u.id AND jx.memotong_kuota AND x.status IN ${AKTIF}), 0) AS sisa
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
    await client.query("UPDATE pengajuan_cuti SET status = $1 WHERE id = $2", [status, id]);
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