"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import pool from "@/lib/db";
import { requireUser } from "@/lib/session";
import { ambilHariLiburIndonesia } from "@/lib/google-calendar";

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

export async function sinkronkanHariLiburGoogle() {
  await requireUser(PERAN);

  let error = null;
  let info = null;
  try {
    const hariLibur = await ambilHariLiburIndonesia();
    if (hariLibur.length === 0) {
      throw new Error("Google Calendar tidak mengembalikan hari libur");
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      try {
        const hasil = await client.query(
          `INSERT INTO hari_libur (tanggal, keterangan, jenis, sumber)
           SELECT tanggal, keterangan, jenis, 'google_calendar'
           FROM UNNEST($1::date[], $2::varchar[], $3::varchar[])
             AS data(tanggal, keterangan, jenis)
           ON CONFLICT (tanggal) DO UPDATE
             SET keterangan = EXCLUDED.keterangan, jenis = EXCLUDED.jenis
             WHERE hari_libur.sumber = 'google_calendar'
           RETURNING id`,
          [
            hariLibur.map((hari) => hari.tanggal),
            hariLibur.map((hari) => hari.keterangan),
            hariLibur.map((hari) => hari.jenis),
          ]
        );
        await client.query(
          `DELETE FROM hari_libur
           WHERE sumber = 'google_calendar'
             AND NOT (tanggal = ANY($1::date[]))`,
          [hariLibur.map((hari) => hari.tanggal)]
        );
        await client.query("COMMIT");
        info = `Sinkronisasi selesai: ${hasil.rowCount} tanggal disinkronkan, ${hariLibur.length - hasil.rowCount} tanggal manual dipertahankan`;
      } catch (e) {
        await client.query("ROLLBACK");
        throw e;
      }
    } finally {
      client.release();
    }
  } catch (e) {
    console.error("Gagal menyinkronkan hari libur Google Calendar:", e);
    error = `Sinkronisasi Google Calendar gagal: ${e.message}`;
  }

  selesai(error, info);
}

export async function tambahBlackout(formData) {
  await requireUser(PERAN);
  const mulai = teks(formData, "tanggal_mulai");
  const akhir = teks(formData, "tanggal_selesai");
  const keterangan = teks(formData, "keterangan");

  let error = null;
  if (!TGL.test(mulai) || !TGL.test(akhir) || !keterangan) error = "Semua isian wajib diisi";
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
  selesai(error, "Periode larangan cuti ditambahkan");
}

export async function hapusBlackout(formData) {
  await requireUser(PERAN);
  await pool.query("DELETE FROM blackout WHERE id = $1", [Number(formData.get("id"))]);
  selesai(null, "Periode larangan cuti dihapus");
}