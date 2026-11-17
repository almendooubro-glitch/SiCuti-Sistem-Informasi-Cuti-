"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import pool from "@/lib/db";
import { requireUser } from "@/lib/session";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TELEPON = /^[0-9+\-\s]{6,20}$/;
const TIPE = ["image/jpeg", "image/png", "image/webp"];
const MAKS_BYTE = 900 * 1024 * 1024; 
const teks = (fd, k) => String(fd.get(k) || "").trim();

export async function simpanProfil(formData) {
  const me = await requireUser();
  const id = Number(formData.get("id")) || me.id;
  if (id !== me.id && me.role !== "admin") redirect("/profil");

  const username = teks(formData, "username");
  const email = teks(formData, "email").toLowerCase();
  const nama = teks(formData, "nama_lengkap");
  const telepon = teks(formData, "telepon") || null;
  const alamat = teks(formData, "alamat") || null;
  const password = String(formData.get("password") || "");
  const hapusFoto = formData.get("hapus_foto") === "on";
  const file = formData.get("foto");
  const adaFile = file && typeof file === "object" && file.size > 0;

  let error = null;
  if (!username || !email || !nama) error = "Username, email, dan nama lengkap wajib diisi";
  else if (!EMAIL.test(email)) error = "Format email tidak valid";
  else if (telepon && !TELEPON.test(telepon)) error = "Nomor telepon tidak valid";
  else if (password && password.length < 6) error = "Password baru minimal 6 karakter";
  else if (adaFile && !TIPE.includes(file.type)) error = "Foto harus berformat JPG, PNG, atau WEBP";
  else if (adaFile && file.size > MAKS_BYTE) error = "Ukuran foto maksimal 10 MB";
  if (!error) {
    try {
      await pool.query(
        `UPDATE users SET username=$1, email=$2, nama_lengkap=$3, telepon=$4, alamat=$5 WHERE id=$6`,
        [username, email, nama, telepon, alamat, id]
      );
      if (password) {
        await pool.query("UPDATE users SET password=$1 WHERE id=$2", [await bcrypt.hash(password, 10), id]);
      }
      if (hapusFoto) {
        await pool.query("UPDATE users SET foto=NULL, foto_data=NULL, foto_tipe=NULL WHERE id=$1", [id]);
      } else if (adaFile) {
        await pool.query("UPDATE users SET foto=$1, foto_data=$2, foto_tipe=$3 WHERE id=$4", [
          file.name.slice(0, 255),
          Buffer.from(await file.arrayBuffer()),
          file.type,
          id,
        ]);
      }
    } catch (e) {
      if (e.code === "23505") error = "Email atau username sudah dipakai pengguna lain";
      else {
        console.error(e);
        error = "Terjadi kesalahan pada server";
      }
    }
  }

  revalidatePath("/profil");
  revalidatePath("/", "layout");
  const base = id !== me.id ? `id=${id}&` : "";
  redirect(
    error
      ? `/profil?${base}error=${encodeURIComponent(error)}`
      : `/profil?${base}info=${encodeURIComponent("Profil berhasil disimpan")}`
  );
}