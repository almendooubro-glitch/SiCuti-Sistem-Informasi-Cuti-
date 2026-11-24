"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import pool from "@/lib/db";
import { requireUser } from "@/lib/session";

export async function simpanDivisi(formData) {
  await requireUser(["admin"]);

  const id = Number(formData.get("id")) || null;
  const nama = String(formData.get("nama") || "").trim();
  const deskripsi = String(formData.get("deskripsi") || "").trim() || null;
  const ketuaId = Number(formData.get("ketua_id")) || null;

  let error = null;
  if (!nama) error = "Nama divisi wajib diisi";
  else if (!ketuaId) error = "Ketua divisi wajib dipilih";

  if (!error) {
    try {
      let divisiId = id;
      if (id) {
        const lama = (await pool.query("SELECT ketua_id FROM divisi WHERE id = $1", [id])).rows[0];
        await pool.query(
          "UPDATE divisi SET nama = $1, deskripsi = $2, ketua_id = $3 WHERE id = $4",
          [nama, deskripsi, ketuaId, id]
        );
        if (lama?.ketua_id && lama.ketua_id !== ketuaId) {
          await pool.query("UPDATE users SET divisi_id = NULL WHERE id = $1 AND divisi_id = $2", [lama.ketua_id, id]);
        }
      } else {
        const r = await pool.query(
          "INSERT INTO divisi (nama, deskripsi, ketua_id) VALUES ($1, $2, $3) RETURNING id",
          [nama, deskripsi, ketuaId]
        );
        divisiId = r.rows[0].id;
      }
      await pool.query("UPDATE users SET divisi_id = $1 WHERE id = $2", [divisiId, ketuaId]);
    } catch (e) {
      if (e.code === "23505") {
        error = String(e.constraint).includes("ketua")
          ? "Ketua divisi tersebut sudah memimpin divisi lain"
          : "Nama divisi sudah dipakai";
      } else {
        console.error(e);
        error = "Terjadi kesalahan pada server";
      }
    }
  }

  if (error) redirect(`/divisi?error=${encodeURIComponent(error)}${id ? `&edit=${id}` : ""}`);
  revalidatePath("/divisi");
  redirect("/divisi");
}

export async function hapusDivisi(formData) {
  await requireUser(["admin"]);
  await pool.query("DELETE FROM divisi WHERE id = $1", [Number(formData.get("id"))]);
  revalidatePath("/divisi");
  redirect("/divisi");
}

export async function tambahAnggota(formData) {
  await requireUser(["admin"]);
  const divisiId = Number(formData.get("divisi_id"));
  const userId = Number(formData.get("user_id"));
  if (userId) {
    await pool.query(
      "UPDATE users SET divisi_id = $1 WHERE id = $2 AND role = 'user' AND divisi_id IS NULL",
      [divisiId, userId]
    );
  }
  revalidatePath("/divisi");
  redirect(`/divisi?detail=${divisiId}`);
}

export async function hapusAnggota(formData) {
  await requireUser(["admin"]);
  const divisiId = Number(formData.get("divisi_id"));
  await pool.query(
    "UPDATE users SET divisi_id = NULL WHERE id = $1 AND divisi_id = $2 AND role = 'user'",
    [Number(formData.get("user_id")), divisiId]
  );
  revalidatePath("/divisi");
  redirect(`/divisi?detail=${divisiId}`);
}