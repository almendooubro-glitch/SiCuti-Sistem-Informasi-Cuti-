const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function tgl(offset) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function hariKerja(a, b) {
  let n = 0;
  const e = new Date(b + "T00:00:00");
  for (let d = new Date(a + "T00:00:00"); d <= e; d.setDate(d.getDate() + 1)) {
    if (d.getDay() !== 0 && d.getDay() !== 6) n++;
  }
  return Math.max(n, 1);
}

const USERS = [
  ["admin", "admin@sicuti.com", "Admin SiCuti", "admin", 900, true],
  ["hrd", "hrd@sicuti.com", "Rina HRD", "hrd", 800, true],
  ["ketua", "ketua@sicuti.com", "Siti Ketua Divisi", "ketua_divisi", 700, true],
  ["ketua2", "ketua2@sicuti.com", "Andi Ketua Keuangan", "ketua_divisi", 650, true],
  ["karyawan", "karyawan@sicuti.com", "Budi Karyawan", "user", 500, true],
  ["dewi", "dewi@sicuti.com", "Dewi Lestari", "user", 450, true],
  ["eko", "eko@sicuti.com", "Eko Prasetyo", "user", 400, true],
  ["fajar", "fajar@sicuti.com", "Fajar Nugroho", "user", 300, true],
  ["gita", "gita@sicuti.com", "Gita Pratiwi", "user", 90, true], 
  ["hendra", "hendra@sicuti.com", "Hendra Wijaya", "user", 600, false], 
];

const DIVISI = [
  ["Teknologi Informasi", "Pengembangan dan pemeliharaan sistem", "ketua", ["karyawan", "dewi", "eko"]],
  ["Keuangan", "Pengelolaan anggaran dan pelaporan", "ketua2", ["fajar", "gita", "hendra"]],
];

const JENIS = [
  ["Cuti Tahunan", 12, false, true, 3, 0],
  ["Cuti Sakit", null, true, false, 0, 3],
  ["Cuti Menikah", 3, false, false, 7, 0],
  ["Cuti Melahirkan", 90, false, false, 7, 0],
  ["Cuti Duka", 3, false, false, 0, 1],
];

const PENGAJUAN = [
  ["karyawan", "Cuti Tahunan", -2, 14, 16, false, "Liburan keluarga", "dewi", "pending", []],
  ["karyawan", "Cuti Sakit", -4, -5, -4, false, "Demam dan flu", null, "approved",
    [["leader", "ketua", "approved", "Semoga lekas sembuh"], ["hrd", "hrd", "approved", null]]],
  ["dewi", "Cuti Tahunan", -5, 7, 9, false, "Mengurus keperluan pribadi", "eko", "approved_leader",
    [["leader", "ketua", "approved", "Handover sudah jelas"]]],
  ["eko", "Cuti Tahunan", -25, -20, -18, false, "Acara keluarga", "karyawan", "approved",
    [["leader", "ketua", "approved", null], ["hrd", "hrd", "approved", "Disetujui"]]],
  ["fajar", "Cuti Tahunan", -10, -3, -2, false, "Keperluan mendadak", "gita", "rejected",
    [["leader", "ketua2", "rejected", "Sedang tutup buku, mohon ajukan di waktu lain"]]],
  ["gita", "Cuti Tahunan", -1, 5, 5, true, "Kontrol kesehatan", "fajar", "pending", []],
  ["ketua", "Cuti Tahunan", -3, 20, 21, false, "Cuti pribadi ketua divisi", null, "pending", []],
  ["eko", "Cuti Tahunan", -8, -1, 1, false, "Istirahat", "karyawan", "approved",
    [["leader", "ketua", "approved", null], ["hrd", "hrd", "approved", null]]],
];

async function main() {
  const hash = await bcrypt.hash("password123", 10);

  for (const [nama, kuota, lampiran, potong, min, maks] of JENIS) {
    await pool.query(
      `INSERT INTO jenis_cuti (nama, kuota, wajib_lampiran, memotong_kuota, min_hari_sebelum, maks_hari_sesudah)
       VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (nama) DO NOTHING`,
      [nama, kuota, lampiran, potong, min, maks]
    );
  }

  for (const [username, email, nama, role, hari, aktif] of USERS) {
    await pool.query(
      `INSERT INTO users (username, email, password, nama_lengkap, role, is_active, tanggal_bergabung)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (email) DO UPDATE SET
         password = EXCLUDED.password, nama_lengkap = EXCLUDED.nama_lengkap,
         role = EXCLUDED.role, is_active = EXCLUDED.is_active,
         tanggal_bergabung = EXCLUDED.tanggal_bergabung`,
      [username, email, hash, nama, role, aktif, tgl(-hari)]
    );
  }

  const uid = {};
  for (const r of (await pool.query("SELECT id, username FROM users")).rows) uid[r.username] = r.id;

  for (const [nama, deskripsi, ketua, anggota] of DIVISI) {
    await pool.query(
      "INSERT INTO divisi (nama, deskripsi) VALUES ($1, $2) ON CONFLICT (nama) DO NOTHING",
      [nama, deskripsi]
    );
    const { id } = (await pool.query("SELECT id FROM divisi WHERE nama = $1", [nama])).rows[0];
    await pool.query("UPDATE divisi SET ketua_id = $1 WHERE id = $2", [uid[ketua], id]);
    await pool.query("UPDATE users SET divisi_id = $1 WHERE id = ANY($2::int[])", [
      id,
      [uid[ketua], ...anggota.map((a) => uid[a])],
    ]);
  }

  const { count } = (await pool.query("SELECT COUNT(*)::int AS count FROM pengajuan_cuti")).rows[0];
  if (count === 0) {
    const jid = {};
    for (const r of (await pool.query("SELECT id, nama FROM jenis_cuti")).rows) jid[r.nama] = r.id;

    for (const [user, jenis, ajuan, mulai, selesai, setengah, alasan, handover, status, logs] of PENGAJUAN) {
      const m = tgl(mulai);
      const s = tgl(selesai);
      const total = setengah ? 0.5 : hariKerja(m, s);
      const { id } = (
        await pool.query(
          `INSERT INTO pengajuan_cuti
             (user_id, jenis_cuti_id, tanggal_pengajuan, tanggal_mulai, tanggal_selesai, setengah_hari,
              total_hari, alasan, handover_user_id, catatan_tugas, alamat_selama_cuti, nomor_darurat, status)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`,
          [uid[user], jid[jenis], tgl(ajuan), m, s, setengah, total, alasan,
           handover ? uid[handover] : null,
           handover ? "Tugas harian dilanjutkan rekan pengganti" : null,
           "Makassar", "081234567890", status]
        )
      ).rows[0];

      for (const [level, approver, aksi, catatan] of logs) {
        await pool.query(
          "INSERT INTO approval_log (pengajuan_id, approver_id, level, aksi, catatan) VALUES ($1,$2,$3,$4,$5)",
          [id, uid[approver], level, aksi, catatan]
        );
      }
    }
  }

  console.log("Seed selesai");
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});