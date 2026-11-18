const { loadEnvConfig } = require("@next/env");
loadEnvConfig(process.cwd());

const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const p2 = (n) => String(n).padStart(2, "0");

const fmt = (d) =>
  `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;

function tgl(offset) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return fmt(d);
}

function hariKerja(a, b, libur) {
  let n = 0;

  const akhir = new Date(b + "T00:00:00");

  for (
    let d = new Date(a + "T00:00:00");
    d <= akhir;
    d.setDate(d.getDate() + 1)
  ) {
    if (
      d.getDay() !== 0 &&
      d.getDay() !== 6 &&
      !libur.has(fmt(d))
    ) {
      n++;
    }
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
  [
    "Teknologi Informasi",
    "Pengembangan dan pemeliharaan sistem",
    "ketua",
    ["karyawan", "dewi", "eko"],
  ],
  [
    "Keuangan",
    "Pengelolaan anggaran dan pelaporan",
    "ketua2",
    ["fajar", "gita", "hendra"],
  ],
];

const JENIS = [
  ["Cuti Tahunan", 12, false, true, 3, 0],
  ["Cuti Sakit", null, true, false, 0, 3],
  ["Cuti Menikah", 3, false, false, 7, 0],
  ["Cuti Melahirkan", 90, false, false, 7, 0],
  ["Cuti Duka", 3, false, false, 0, 1],
];

const LIBUR = [
  ["2026-12-24", "Cuti Bersama Natal", "cuti_bersama"],
  ["2026-12-25", "Hari Raya Natal", "nasional"],
  ["2027-01-01", "Tahun Baru 2027", "nasional"],
];

const PENGAJUAN = [
  [
    "karyawan", "Cuti Tahunan", -2, 14, 16,
    false, "Liburan keluarga", "dewi", "pending", [],
  ],
  [
    "karyawan", "Cuti Sakit", -4, -5, -4,
    false, "Demam dan flu", null, "approved",
    [
      ["leader", "ketua", "approved", "Semoga lekas sembuh"],
      ["hrd", "hrd", "approved", null],
    ],
  ],
  [
    "dewi", "Cuti Tahunan", -5, 7, 9,
    false, "Mengurus keperluan pribadi", "eko", "approved_leader",
    [
      ["leader", "ketua", "approved", "Handover sudah jelas"],
    ],
  ],
  [
    "eko", "Cuti Tahunan", -25, -20, -18,
    false, "Acara keluarga", "karyawan", "approved",
    [
      ["leader", "ketua", "approved", null],
      ["hrd", "hrd", "approved", "Disetujui"],
    ],
  ],
  [
    "fajar", "Cuti Tahunan", -10, -3, -2,
    false, "Keperluan mendadak", "gita", "rejected",
    [
      [
        "leader",
        "ketua2",
        "rejected",
        "Sedang tutup buku, mohon ajukan di waktu lain",
      ],
    ],
  ],
  [
    "gita", "Cuti Tahunan", -1, 5, 5,
    true, "Kontrol kesehatan", "fajar", "pending", [],
  ],
  [
    "ketua", "Cuti Tahunan", -3, 20, 21,
    false, "Cuti pribadi ketua divisi", null, "pending", [],
  ],
  [
    "eko", "Cuti Tahunan", -8, -1, 1,
    false, "Istirahat", "karyawan", "approved",
    [
      ["leader", "ketua", "approved", null],
      ["hrd", "hrd", "approved", null],
    ],
  ],
];

async function resetDatabase() {
  const client = await pool.connect();

  try {
    console.log("Memulai reset database SiCuti...");

    await client.query("BEGIN");

    await client.query(`
      TRUNCATE TABLE
        approval_log,
        pengajuan_cuti,
        sessions,
        blackout,
        hari_libur,
        pengaturan,
        divisi,
        jenis_cuti,
        users
      RESTART IDENTITY CASCADE;
    `);

    await client.query("COMMIT");

    console.log("Reset database berhasil!");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL tidak ditemukan. Periksa file .env.local.");
  }

  const reset = process.argv.includes("--reset");

  if (reset) {
    await resetDatabase();
  }

  console.log("Memulai pengisian data SiCuti...");

  const hash = await bcrypt.hash("password123", 10);

  for (const [nama, kuota, lampiran, potong, min, maks] of JENIS) {
    await pool.query(
      `INSERT INTO jenis_cuti
        (nama, kuota, wajib_lampiran, memotong_kuota,
         min_hari_sebelum, maks_hari_sesudah)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (nama) DO NOTHING`,
      [nama, kuota, lampiran, potong, min, maks]
    );
  }

  await pool.query(
    `INSERT INTO pengaturan (kunci, nilai)
     VALUES ('kapasitas_maks_persen', '50')
     ON CONFLICT (kunci) DO NOTHING`
  );

  for (const [tanggal, keterangan, jenis] of LIBUR) {
    await pool.query(
      `INSERT INTO hari_libur (tanggal, keterangan, jenis)
       VALUES ($1, $2, $3)
       ON CONFLICT (tanggal) DO NOTHING`,
      [tanggal, keterangan, jenis]
    );
  }

  const blackout = await pool.query(
    "SELECT 1 FROM blackout LIMIT 1"
  );

  if (blackout.rows.length === 0) {
    await pool.query(
      `INSERT INTO blackout
        (tanggal_mulai, tanggal_selesai, keterangan)
       VALUES ($1, $2, $3)`,
      ["2026-12-28", "2026-12-31", "Tutup buku akhir tahun"]
    );
  }

  const hasilLibur = await pool.query(
    `SELECT to_char(tanggal, 'YYYY-MM-DD') AS tanggal
     FROM hari_libur`
  );

  const libur = new Set(
    hasilLibur.rows.map((r) => r.tanggal)
  );

  for (const [username, email, nama, role, hari, aktif] of USERS) {
    await pool.query(
      `INSERT INTO users
        (username, email, password, nama_lengkap, role,
         is_active, tanggal_bergabung)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (email) DO UPDATE SET
         password = EXCLUDED.password,
         nama_lengkap = EXCLUDED.nama_lengkap,
         role = EXCLUDED.role,
         is_active = EXCLUDED.is_active,
         tanggal_bergabung = EXCLUDED.tanggal_bergabung`,
      [
        username,
        email,
        hash,
        nama,
        role,
        aktif,
        tgl(-hari),
      ]
    );
  }

  const hasilUsers = await pool.query(
    "SELECT id, username FROM users"
  );

  const uid = {};

  for (const user of hasilUsers.rows) {
    uid[user.username] = user.id;
  }

  await pool.query(
    `UPDATE users
     SET telepon = '081234567890',
         alamat = 'Makassar, Sulawesi Selatan'
     WHERE telepon IS NULL`
  );

  for (const [nama, deskripsi, ketua, anggota] of DIVISI) {
    await pool.query(
      `INSERT INTO divisi (nama, deskripsi)
       VALUES ($1, $2)
       ON CONFLICT (nama) DO NOTHING`,
      [nama, deskripsi]
    );

    const hasilDivisi = await pool.query(
      "SELECT id FROM divisi WHERE nama = $1",
      [nama]
    );

    const idDivisi = hasilDivisi.rows[0].id;

    await pool.query(
      "UPDATE divisi SET ketua_id = $1 WHERE id = $2",
      [uid[ketua], idDivisi]
    );

    const anggotaIds = [
      uid[ketua],
      ...anggota.map((username) => uid[username]),
    ];

    await pool.query(
      `UPDATE users
       SET divisi_id = $1
       WHERE id = ANY($2::int[])`,
      [idDivisi, anggotaIds]
    );
  }

  const hasilCount = await pool.query(
    "SELECT COUNT(*)::int AS count FROM pengajuan_cuti"
  );

  const jumlahPengajuan = hasilCount.rows[0].count;

  if (jumlahPengajuan === 0) {
    const hasilJenis = await pool.query(
      "SELECT id, nama FROM jenis_cuti"
    );

    const jid = {};

    for (const jenis of hasilJenis.rows) {
      jid[jenis.nama] = jenis.id;
    }

    for (const [
      user,
      jenis,
      ajuan,
      mulai,
      selesai,
      setengah,
      alasan,
      handover,
      status,
      logs,
    ] of PENGAJUAN) {
      if (!uid[user] || !jid[jenis]) {
        throw new Error(
          `Data pengajuan tidak valid: ${user} - ${jenis}`
        );
      }

      const tanggalMulai = tgl(mulai);
      const tanggalSelesai = tgl(selesai);

      const total = setengah
        ? 0.5
        : hariKerja(tanggalMulai, tanggalSelesai, libur);

      const hasilPengajuan = await pool.query(
        `INSERT INTO pengajuan_cuti
          (user_id, jenis_cuti_id, tanggal_pengajuan,
           tanggal_mulai, tanggal_selesai, setengah_hari,
           total_hari, alasan, handover_user_id, catatan_tugas,
           alamat_selama_cuti, nomor_darurat, status)
         VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         RETURNING id`,
        [
          uid[user],
          jid[jenis],
          tgl(ajuan),
          tanggalMulai,
          tanggalSelesai,
          setengah,
          total,
          alasan,
          handover ? uid[handover] : null,
          handover
            ? "Tugas harian dilanjutkan rekan pengganti"
            : null,
          "Makassar",
          "081234567890",
          status,
        ]
      );

      const idPengajuan = hasilPengajuan.rows[0].id;

      for (const [level, approver, aksi, catatan] of logs) {
        if (!uid[approver]) {
          throw new Error(
            `Approver tidak ditemukan: ${approver}`
          );
        }

        await pool.query(
          `INSERT INTO approval_log
            (pengajuan_id, approver_id, level, aksi, catatan)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            idPengajuan,
            uid[approver],
            level,
            aksi,
            catatan,
          ]
        );
      }
    }
  }

  console.log("================================");
  console.log("Seed SiCuti berhasil!");
  console.log(`Jumlah pengguna: ${USERS.length}`);
  console.log(`Jumlah divisi: ${DIVISI.length}`);
  console.log(`Jumlah jenis cuti: ${JENIS.length}`);
  console.log(
    `Jumlah pengajuan: ${
      jumlahPengajuan === 0 ? PENGAJUAN.length : jumlahPengajuan
    }`
  );
  console.log("Password seluruh akun: password123");
  console.log("================================");
}

main()
  .catch((error) => {
    console.error("Seed gagal:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
