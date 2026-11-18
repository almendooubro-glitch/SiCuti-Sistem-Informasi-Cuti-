"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import pool from "@/lib/db";
import { requireUser } from "@/lib/session";

const PERAN = ["admin", "hrd"];
const TGL = /^\d{4}-\d{2}-\d{2}$/;
const teks = (fd, k) => String(fd.get(k) || "").trim();

function selesai(error, info) {
  revalidatePath("/pengaturan");
  revalidatePath("/cuti");
  redirect(
    error ? `/pengaturan?error=${encodeURIComponent(error)}` : `/pengaturan?info=${encodeURIComponent(info)}`
  );
}

export async function simpanKapasitas(formData) {
  await requireUser(PERAN);
  const n = Number(formData.get("persen"));
  if (!Number.isInteger(n) || n < 1 || n > 100) selesai("Persentase harus bilangan bulat 1 sampai 100");

  await pool.query(
    `INSERT INTO pengaturan (kunci, nilai) VALUES ('kapasitas_maks_persen', $1)
     ON CONFLICT (kunci) DO UPDATE SET nilai = EXCLUDED.nilai`,
    [String(n)]
  );
  selesai(null, "Batas kapasitas disimpan");
}

export async function tambahLibur(formData) {
  await requireUser(PERAN);
  const tanggal = teks(formData, "tanggal");
  const keterangan = teks(formData, "keterangan");
  const jenis = teks(formData, "jenis");

  let error = null;
  if (!TGL.test(tanggal) || !keterangan) error = "Tanggal dan keterangan wajib diisi";
  else if (!["nasional", "cuti_bersama"].includes(jenis)) error = "Jenis tidak valid";
  else {
    try {
      await pool.query("INSERT INTO hari_libur (tanggal, keterangan, jenis) VALUES ($1, $2, $3)", [
        tanggal,
        keterangan,
        jenis,
      ]);
    } catch (e) {
      error = e.code === "23505" ? "Tanggal tersebut sudah terdaftar" : "Tanggal tidak valid";
    }
  }
  selesai(error, "Hari libur ditambahkan");
}

export async function hapusLibur(formData) {
  await requireUser(PERAN);
  await pool.query("DELETE FROM hari_libur WHERE id = $1", [Number(formData.get("id"))]);
  selesai(null, "Hari libur dihapus");
}

export async function tambahBlackout(formData) {
  await requireUser(PERAN);
  const mulai = teks(formData, "tanggal_mulai");
  const akhir = teks(formData, "tanggal_selesai");
  const keterangan = teks(formData, "keterangan");

  let error = null;
  if (!TGL.test(mulai) || !TGL.test(akhir) || !keterangan) error = "Semua field wajib diisi";
  else if (akhir < mulai) error = "Tanggal selesai tidak boleh sebelum tanggal mulai";
  else {
    try {
      await pool.query(
        "INSERT INTO blackout (tanggal_mulai, tanggal_selesai, keterangan) VALUES ($1, $2, $3)",
        [mulai, akhir, keterangan]
      );
    } catch {
      error = "Tanggal tidak valid";
    }
  }
  selesai(error, "Periode blackout ditambahkan");
}

export async function hapusBlackout(formData) {
  await requireUser(PERAN);
  await pool.query("DELETE FROM blackout WHERE id = $1", [Number(formData.get("id"))]);
  selesai(null, "Periode blackout dihapus");
}