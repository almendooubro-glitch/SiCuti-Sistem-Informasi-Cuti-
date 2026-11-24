"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import pool from "@/lib/db";
import { requireUser } from "@/lib/session";
import { hitungHariKerja, hariIni, selisihHari } from "@/lib/hari";
import { cekKapasitas } from "@/lib/kapasitas";

const TIPE = ["application/pdf", "image/jpeg", "image/png"];
const MAKS_BYTE = 900 * 1024; 
const TGL = /^\d{4}-\d{2}-\d{2}$/;
const AKTIF = "('pending','approved_leader','approved')";

const gagal = (error) => ({ error });
const teks = (fd, k) => String(fd.get(k) || "").trim();

export async function ajukanCuti(formData) {
  const user = await requireUser(["user", "ketua_divisi"]);
  let perluTindakLanjut = false;
  let jumlahTugasDialihkan = 0;

  try {
    const jenisId = Number(formData.get("jenis_cuti_id"));
    const mulai = teks(formData, "tanggal_mulai");
    const selesai = teks(formData, "tanggal_selesai");
    const alasan = teks(formData, "alasan");
    const handoverId = Number(formData.get("handover_user_id")) || null;
    const catatan = teks(formData, "catatan_tugas") || null;
    const alamat = teks(formData, "alamat_selama_cuti") || null;
    const darurat = teks(formData, "nomor_darurat") || null;
    const file = formData.get("lampiran");
    const adaFile = file && typeof file === "object" && file.size > 0;

    const jenis = (await pool.query("SELECT * FROM jenis_cuti WHERE id = $1", [jenisId])).rows[0];
    if (!jenis) return gagal("Jenis cuti tidak valid");
    const setengah = jenis.nama === "Cuti Setengah Hari";
    if (!TGL.test(mulai) || !TGL.test(selesai)) return gagal("Tanggal mulai dan selesai wajib diisi");
    if (selesai < mulai) return gagal("Tanggal selesai tidak boleh sebelum tanggal mulai");
    if (setengah && mulai !== selesai) return gagal("Cuti setengah hari hanya untuk satu tanggal");
    if (!alasan) return gagal("Alasan cuti wajib diisi");
    if (darurat && !/^[0-9+\-\s]{6,20}$/.test(darurat)) return gagal("Nomor darurat tidak valid");

    const libur = (
      await pool.query(
        "SELECT to_char(tanggal,'YYYY-MM-DD') AS t FROM hari_libur WHERE tanggal BETWEEN $1 AND $2",
        [mulai, selesai]
      )
    ).rows.map((r) => r.t);
    const total = hitungHariKerja(mulai, selesai, setengah, libur);
    if (total === 0) {
      return gagal("Rentang tanggal tidak memuat hari kerja (Sabtu, Minggu, dan hari libur tidak dihitung)");
    }

    const biasa = jenis.nama !== "Cuti Sakit";
    if (biasa) {
      const bo = (
        await pool.query(
          "SELECT keterangan FROM blackout WHERE tanggal_mulai <= $2 AND tanggal_selesai >= $1 LIMIT 1",
          [mulai, selesai]
        )
      ).rows[0];
      if (bo) return gagal(`Cuti tidak bisa diajukan pada periode larangan cuti: ${bo.keterangan}`);
    }

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

    const u = (
      await pool.query(
        `SELECT divisi_id, kuota_awal,
                to_char((tanggal_bergabung + INTERVAL '1 year')::date, 'YYYY-MM-DD') AS eligible_sejak
         FROM users WHERE id = $1`,
        [user.id]
      )
    ).rows[0];
    if (user.role === "user" && !u.divisi_id) return gagal("Kamu belum terdaftar di divisi. Hubungi admin.");

    if (jenis.nama === "Cuti Tahunan" && mulai < u.eligible_sejak) {
      const sejak = new Date(u.eligible_sejak + "T00:00:00").toLocaleDateString("id-ID");
      return gagal(`Cuti Tahunan baru bisa diambil setelah masa kerja 1 tahun (mulai ${sejak})`);
    }

    if (biasa && u.divisi_id) {
      const k = await cekKapasitas(u.divisi_id, mulai, selesai, user.id);
      if (k?.melebihi) {
        const hari = new Date(k.tanggal + "T00:00:00").toLocaleDateString("id-ID");
        return gagal(
          `Kapasitas divisi penuh: pada ${hari} akan ada ${k.persen}% anggota yang cuti (batas ${k.maks}%)`
        );
      }
    }

    if (jenis.memotong_kuota) {
      const { rows } = await pool.query(
        `SELECT COALESCE(SUM(p.total_hari), 0) AS pakai
         FROM pengajuan_cuti p JOIN jenis_cuti j ON j.id = p.jenis_cuti_id
         WHERE p.user_id = $1 AND j.memotong_kuota AND p.status IN ${AKTIF}
           AND EXTRACT(YEAR FROM p.tanggal_mulai) = $2`,
        [user.id, Number(mulai.slice(0, 4))]
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

    if (jenis.nama !== "Cuti Sakit") {
      const tugasPengganti = await pool.query(
        `SELECT 1 FROM pengajuan_cuti
         WHERE handover_user_id = $1 AND status IN ${AKTIF}
           AND tanggal_selesai >= CURRENT_DATE
           AND tanggal_mulai <= $3 AND tanggal_selesai >= $2
         LIMIT 1`,
        [user.id, mulai, selesai]
      );
      if (tugasPengganti.rows.length) {
        return gagal("Tanggal bertabrakan dengan masa cuti saat kamu ditunjuk sebagai rekan pengganti");
      }
    }

    if (handoverId) {
      const h = await pool.query(
        `SELECT 1 FROM users WHERE id = $1 AND id <> $2 AND divisi_id = $3 AND is_active
           AND role IN ('user','ketua_divisi')`,
        [handoverId, user.id, u.divisi_id]
      );
      if (!h.rows.length) return gagal("Rekan pengganti harus berasal dari divisi yang sama");

      if (jenis.nama === "Cuti Sakit") {
        const penunjuk = await pool.query(
          `SELECT 1 FROM pengajuan_cuti
           WHERE handover_user_id = $1 AND user_id = $2 AND status IN ${AKTIF}
             AND tanggal_selesai >= CURRENT_DATE
             AND tanggal_mulai <= $4 AND tanggal_selesai >= $3
           LIMIT 1`,
          [user.id, handoverId, mulai, selesai]
        );
        if (penunjuk.rows.length) {
          return gagal("Kamu tidak bisa menunjuk kembali orang yang menunjukmu sebagai rekan pengganti pada tanggal yang sama");
        }
      }
    }

    if (adaFile) {
      if (!TIPE.includes(file.type)) return gagal("Lampiran harus berformat PDF, JPG, atau PNG");
      if (file.size > MAKS_BYTE) return gagal("Ukuran lampiran maksimal 900 KB");
    } else if (jenis.wajib_lampiran) {
      return gagal(`${jenis.nama} wajib melampirkan surat/dokumen`);
    }
    const data = adaFile ? Buffer.from(await file.arrayBuffer()) : null;

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      if (jenis.nama === "Cuti Sakit") {
        const { rows: tugas } = await client.query(
          `SELECT p.id, p.user_id, p.tanggal_mulai, p.tanggal_selesai, u.divisi_id
           FROM pengajuan_cuti p
           JOIN users u ON u.id = p.user_id
           WHERE p.handover_user_id = $1 AND p.status IN ${AKTIF}
             AND p.tanggal_selesai >= CURRENT_DATE
             AND p.tanggal_mulai <= $3 AND p.tanggal_selesai >= $2
           ORDER BY p.id
           FOR UPDATE OF p`,
          [user.id, mulai, selesai]
        );

        for (const tugasAktif of tugas) {
          let penggantiId = null;
          if (tugasAktif.divisi_id) {
            const karyawan = await client.query(
              `SELECT k.id
               FROM users k
               WHERE k.divisi_id = $1 AND k.is_active AND k.role = 'user'
                 AND k.id <> $2 AND k.id <> $3
                 AND NOT EXISTS (
                   SELECT 1 FROM pengajuan_cuti p
                   WHERE p.user_id = k.id AND p.status IN ${AKTIF}
                     AND p.tanggal_mulai <= $5 AND p.tanggal_selesai >= $4
                 )
               ORDER BY k.nama_lengkap, k.id
               LIMIT 1`,
              [
                tugasAktif.divisi_id,
                user.id,
                tugasAktif.user_id,
                tugasAktif.tanggal_mulai,
                tugasAktif.tanggal_selesai,
              ]
            );
            penggantiId = karyawan.rows[0]?.id ?? null;

            if (!penggantiId) {
              const ketua = await client.query(
                `SELECT k.id
                 FROM divisi d
                 JOIN users k ON k.id = d.ketua_id
                 WHERE d.id = $1 AND k.is_active AND k.role = 'ketua_divisi'
                   AND k.id <> $2 AND k.id <> $3
                   AND NOT EXISTS (
                     SELECT 1 FROM pengajuan_cuti p
                     WHERE p.user_id = k.id AND p.status IN ${AKTIF}
                       AND p.tanggal_mulai <= $5 AND p.tanggal_selesai >= $4
                   )
                 LIMIT 1`,
                [
                  tugasAktif.divisi_id,
                  user.id,
                  tugasAktif.user_id,
                  tugasAktif.tanggal_mulai,
                  tugasAktif.tanggal_selesai,
                ]
              );
              penggantiId = ketua.rows[0]?.id ?? null;
            }
          }

          await client.query(
            `UPDATE pengajuan_cuti
             SET handover_user_id = $1, perlu_pengganti = $2
             WHERE id = $3`,
            [penggantiId, !penggantiId, tugasAktif.id]
          );
          if (penggantiId) jumlahTugasDialihkan += 1;
          else perluTindakLanjut = true;
        }
      }

      await client.query(
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

      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  } catch (e) {
    console.error(e);
    return gagal("Terjadi kesalahan pada server");
  }

  revalidatePath("/cuti");
  revalidatePath("/dashboard");
  const info = perluTindakLanjut
    ? jumlahTugasDialihkan
      ? "Pengajuan cuti sakit berhasil. Sebagian tugas dialihkan, sisanya perlu ditindaklanjuti HRD."
      : "Pengajuan cuti sakit berhasil. Tugas tanpa pengganti sudah ditandai untuk HRD."
    : jumlahTugasDialihkan
      ? "Pengajuan cuti sakit berhasil dan tugas pengganti telah dialihkan."
      : null;
  return { ok: true, info };
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
      `UPDATE pengajuan_cuti
       SET status = 'cancelled', alasan_pembatalan = $1, perlu_pengganti = FALSE
       WHERE id = $2 AND user_id = $3 AND status = 'pending'`,
      [alasan, id, user.id]
    );
    if (r.rowCount === 0) error = "Pengajuan tidak bisa dibatalkan karena sudah diproses";
  }

  revalidatePath("/cuti");
  revalidatePath("/dashboard");
  redirect(error ? `/cuti?error=${encodeURIComponent(error)}&detail=${id}` : `/cuti?detail=${id}`);
}