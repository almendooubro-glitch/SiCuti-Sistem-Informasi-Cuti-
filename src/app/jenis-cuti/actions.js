"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import pool from "@/lib/db";
import { requireUser } from "@/lib/session";

export async function simpanJenisCuti(formData) {
  await requireUser(["admin"]);

  const id = Number(formData.get("id")) || null;
  const nama = String(formData.get("nama") || "").trim();
  const kuotaRaw = String(formData.get("kuota") || "").trim();
  const kuota = kuotaRaw === "" ? null : Number(kuotaRaw);
  const minSebelum = Number(formData.get("min_hari_sebelum"));
  const maksSesudah = Number(formData.get("maks_hari_sesudah"));
  const lampiran = formData.get("wajib_lampiran") === "on";
  const potong = formData.get("memotong_kuota") === "on";

  let error = null;
  if (!nama) error = "Nama jenis cuti wajib diisi";
  else if (
    (kuota !== null && (Number.isNaN(kuota) || kuota < 0)) ||
    Number.isNaN(minSebelum) ||
    Number.isNaN(maksSesudah) ||
    minSebelum < 0 ||
    maksSesudah < 0
  ) {
    error = "Kuota dan batas hari harus berupa angka 0 atau lebih";
  }

  if (!error) {
    try {
      if (id) {
        // Nama dua jenis inti dikunci karena dipakai sistem untuk aturan khusus
        await pool.query(
          `UPDATE jenis_cuti SET
             nama = CASE WHEN nama IN ('Cuti Tahunan', 'Cuti Sakit') THEN nama ELSE $1 END,
             kuota = $2, wajib_lampiran = $3, memotong_kuota = $4,
             min_hari_sebelum = $5, maks_hari_sesudah = $6
           WHERE id = $7`,
          [nama, kuota, lampiran, potong, minSebelum, maksSesudah, id]
        );
      } else {
        await pool.query(
          `INSERT INTO jenis_cuti (nama, kuota, wajib_lampiran, memotong_kuota, min_hari_sebelum, maks_hari_sesudah)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [nama, kuota, lampiran, potong, minSebelum, maksSesudah]
        );
      }
    } catch (e) {
      if (e.code === "23505") error = "Nama jenis cuti sudah ada";
      else {
        console.error(e);
        error = "Terjadi kesalahan pada server";
      }
    }
  }

  if (error) {
    redirect(
      `/jenis-cuti?error=${encodeURIComponent(error)}${id ? `&edit=${id}` : ""}`
    );
  }
  revalidatePath("/jenis-cuti");
  redirect("/jenis-cuti");
}