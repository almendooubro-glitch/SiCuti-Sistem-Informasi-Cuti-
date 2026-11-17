"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import pool from "@/lib/db";
import { requireUser } from "@/lib/session";
import { hitungHariKerja, hariIni, selisihHari } from "@/lib/hari";

const TIPE = ["application/pdf", "image/jpeg", "image/png"];
const MAKS_BYTE = 10 * 1024 * 1024; 
const TGL = /^\d{4}-\d{2}-\d{2}$/;
const AKTIF = "('pending','approved_leader','approved')";

const gagal = (error) => ({ error });
const teks = (fd, k) => String(fd.get(k) || "").trim();

export async function ajukanCuti(formData) {
  const user = await requireUser(["user", "ketua_divisi"]);

  try {
    const jenisId = Number(formData.get("jenis_cuti_id"));
    const mulai = teks(formData, "tanggal_mulai");
    const selesai = teks(formData, "tanggal_selesai");
    const setengah = formData.get("setengah_hari") === "on";
    const alasan = teks(formData, "alasan");
    const handoverId = Number(formData.get("handover_user_id")) || null;
    const catatan = teks(formData, "catatan_tugas") || null;
    const alamat = teks(formData, "alamat_selama_cuti") || null;
    const darurat = teks(formData, "nomor_darurat") || null;
    const file = formData.get("lampiran");
    const adaFile = file && typeof file === "object" && file.size > 0;

    const jenis = (await pool.query("SELECT * FROM jenis_cuti WHERE id = $1", [jenisId])).rows[0];
    if (!jenis) return gagal("Jenis cuti tidak valid");
    if (!TGL.test(mulai) || !TGL.test(selesai)) return gagal("Tanggal mulai dan selesai wajib diisi");
    if (selesai < mulai) return gagal("Tanggal selesai tidak boleh sebelum tanggal mulai");
    if (setengah && mulai !== selesai) return gagal("Cuti setengah hari hanya untuk satu tanggal");
    if (!alasan) return gagal("Alasan cuti wajib diisi");
    if (darurat && !/^[0-9+\-\s]{6,20}$/.test(darurat)) return gagal("Nomor darurat tidak valid");

    const total = hitungHariKerja(mulai, selesai, setengah);
    if (total === 0) return gagal("Rentang tanggal tidak memuat hari kerja (Sabtu dan Minggu tidak dihitung)");

    const selisih = selisihHari(hariIni(), mulai);
    if (selisih < 0) {
      if (-selisih > jenis.maks_hari_sesudah) {
        return gagal(
          jenis.maks_hari_sesudah > 0
            ? `${jenis.nama} hanya bisa diajukan maksimal ${jenis.maks_hari_sesudah} hari setelah tanggal mulai`
            : `${jenis.nama} tidak bisa diajukan untuk tanggal yang sudah lewat`
        );
      }
    } else if (selisih < jenis.min_hari_sebelum) {
      return gagal(`${jenis.nama} harus diajukan minimal H-${jenis.min_hari_sebelum}`);
    }

    const u = (await pool.query("SELECT divisi_id, kuota_awal FROM users WHERE id = $1", [user.id])).rows[0];
    if (user.role === "user" && !u.divisi_id) return gagal("Kamu belum masuk divisi, hubungi admin");

    if (jenis.memotong_kuota) {
      const { rows } = await pool.query(
        `SELECT COALESCE(SUM(p.total_hari), 0) AS pakai
         FROM pengajuan_cuti p JOIN jenis_cuti j ON j.id = p.jenis_cuti_id
         WHERE p.user_id = $1 AND j.memotong_kuota AND p.status IN ${AKTIF}`,
        [user.id]
      );
      const sisa = Number(u.kuota_awal) - Number(rows[0].pakai);
      if (total > sisa) return gagal(`Kuota tidak mencukupi. Sisa ${sisa} hari, pengajuan ${total} hari`);
    } else if (jenis.kuota !== null && total > Number(jenis.kuota)) {
      return gagal(`${jenis.nama} maksimal ${Number(jenis.kuota)} hari per pengajuan`);
    }

    const ov = await pool.query(
      `SELECT 1 FROM pengajuan_cuti
       WHERE user_id = $1 AND status IN ${AKTIF} AND tanggal_mulai <= $3 AND tanggal_selesai >= $2
       LIMIT 1`,
      [user.id, mulai, selesai]
    );
    if (ov.rows.length) return gagal("Tanggal bertabrakan dengan pengajuan cuti lain yang masih aktif");

    if (handoverId) {
      const h = await pool.query(
        `SELECT 1 FROM users WHERE id = $1 AND id <> $2 AND divisi_id = $3 AND is_active
           AND role IN ('user','ketua_divisi')`,
        [handoverId, user.id, u.divisi_id]
      );
      if (!h.rows.length) return gagal("Rekan pengganti harus berasal dari divisi yang sama");
    }

    if (adaFile) {
      if (!TIPE.includes(file.type)) return gagal("Lampiran harus berformat PDF, JPG, atau PNG");
      if (file.size > MAKS_BYTE) return gagal("Ukuran lampiran maksimal 10 MB");
    } else if (jenis.wajib_lampiran) {
      return gagal(`${jenis.nama} wajib melampirkan surat/dokumen`);
    }
    const data = adaFile ? Buffer.from(await file.arrayBuffer()) : null;

    await pool.query(
      `INSERT INTO pengajuan_cuti
         (user_id, jenis_cuti_id, tanggal_mulai, tanggal_selesai, setengah_hari, total_hari, alasan,
          handover_user_id, catatan_tugas, alamat_selama_cuti, nomor_darurat,
          lampiran, lampiran_data, lampiran_tipe)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
      [
        user.id, jenisId, mulai, selesai, setengah, total, alasan,
        handoverId, catatan, alamat, darurat,
        adaFile ? file.name.slice(0, 255) : null, data, adaFile ? file.type : null,
      ]
    );
  } catch (e) {
    console.error(e);
    return gagal("Terjadi kesalahan pada server");
  }

  revalidatePath("/cuti");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function batalkanCuti(formData) {
  const user = await requireUser(["user", "ketua_divisi"]);
  const id = Number(formData.get("id"));
  const alasan = teks(formData, "alasan");

  let error = null;
  if (!alasan) {
    error = "Alasan pembatalan wajib diisi";
  } else {
    const r = await pool.query(
      `UPDATE pengajuan_cuti SET status = 'cancelled', alasan_pembatalan = $1
       WHERE id = $2 AND user_id = $3 AND status = 'pending'`,
      [alasan, id, user.id]
    );
    if (r.rowCount === 0) error = "Pengajuan tidak bisa dibatalkan karena sudah diproses";
  }

  revalidatePath("/cuti");
  revalidatePath("/dashboard");
  redirect(error ? `/cuti?error=${encodeURIComponent(error)}&detail=${id}` : `/cuti?detail=${id}`);
}