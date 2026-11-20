"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import pool from "@/lib/db";
import { requireUser } from "@/lib/session";

const ROLES = ["admin", "user", "ketua_divisi", "hrd"];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function simpanPengguna(formData) {
  const admin = await requireUser(["admin"]);

  const id = Number(formData.get("id")) || null;
  const dariProfil = String(formData.get("dari") || "") === "profil" && Boolean(id);
  const username = String(formData.get("username") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const nama = String(formData.get("nama_lengkap") || "").trim();
  const password = String(formData.get("password") || "");
  const role = String(formData.get("role") || "");
  const kuota = Number(formData.get("kuota_awal"));
  const aktif = formData.get("is_active") === "on";

  let error = null;
  if (!username || !email || !nama || !ROLES.includes(role)) {
    error = "Semua isian wajib diisi";
  } else if (!EMAIL.test(email)) {
    error = "Alamat email tidak valid";
  } else if ((!id || password) && password.length < 6) {
    error = "Kata sandi minimal 6 karakter";
  } else if (Number.isNaN(kuota) || kuota < 0) {
    error = "Kuota cuti tidak valid";
  } else if (id === admin.id && (role !== "admin" || !aktif)) {
    error = "Peran dan status akun sendiri tidak boleh diubah";
  }

  if (!error) {
    try {
      if (id) {
        await pool.query(
          `UPDATE users SET username=$1, email=$2, nama_lengkap=$3, role=$4,
                  is_active=$5, kuota_awal=$6 WHERE id=$7`,
          [username, email, nama, role, aktif, kuota, id]
        );
        if (password) {
          await pool.query("UPDATE users SET password=$1 WHERE id=$2", [
            await bcrypt.hash(password, 10),
            id,
          ]);
        }
      } else {
        await pool.query(
          `INSERT INTO users (username, email, password, nama_lengkap, role, kuota_awal)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [username, email, await bcrypt.hash(password, 10), nama, role, kuota]
        );
      }
    } catch (e) {
      if (e.code === "23505") error = "Email atau nama pengguna sudah terdaftar";
      else {
        console.error(e);
        error = "Terjadi kesalahan pada server";
      }
    }
  }

  if (error) {
    const q = `error=${encodeURIComponent(error)}`;
    redirect(dariProfil ? `/profil?id=${id}&${q}` : `/pengguna?${q}${id ? `&edit=${id}` : ""}`);
  }
  revalidatePath("/pengguna");
  revalidatePath("/profil");
  revalidatePath("/", "layout");
  redirect(
    dariProfil ? `/profil?id=${id}&info=${encodeURIComponent("Pengaturan akun berhasil disimpan")}` : "/pengguna"
  );
}

export async function hapusPengguna(formData) {
  await requireUser(["admin"]);
  const id = Number(formData.get("id"));

  let error = null;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const cek = await client.query(
      "SELECT id FROM users WHERE id = $1 AND role IN ('user', 'ketua_divisi') FOR UPDATE",
      [id]
    );

    if (cek.rowCount === 0) {
      await client.query("ROLLBACK");
      error = "Hanya karyawan dan ketua divisi yang dapat dihapus";
    } else {
      await client.query("UPDATE pengajuan_cuti SET handover_user_id = NULL WHERE handover_user_id = $1", [id]);
      await client.query("DELETE FROM approval_log WHERE approver_id = $1", [id]);
      await client.query("DELETE FROM pengajuan_cuti WHERE user_id = $1", [id]);
      await client.query("DELETE FROM users WHERE id = $1", [id]);
      await client.query("COMMIT");
    }
  } catch (e) {
    await client.query("ROLLBACK");
    console.error(e);
    error = "Terjadi kesalahan pada server";
  } finally {
    client.release();
  }

  if (error) redirect(`/pengguna?error=${encodeURIComponent(error)}`);
  revalidatePath("/", "layout");
  redirect("/pengguna");
}