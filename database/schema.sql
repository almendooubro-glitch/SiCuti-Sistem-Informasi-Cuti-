CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(100) NOT NULL,
  nama_lengkap VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user'
    CHECK (role IN ('admin','user','ketua_divisi','hrd')),
  divisi_id INTEGER,
  kuota_awal NUMERIC(4,1) NOT NULL DEFAULT 12,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  telepon VARCHAR(20),
  alamat TEXT,
  foto VARCHAR(255),
  foto_data BYTEA,
  foto_tipe VARCHAR(100),
  tanggal_bergabung DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS divisi (
  id SERIAL PRIMARY KEY,
  nama VARCHAR(100) UNIQUE NOT NULL,
  deskripsi TEXT,
  ketua_id INTEGER UNIQUE REFERENCES users(id) ON DELETE SET NULL,
  dibuat_pada TIMESTAMP NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_users_divisi') THEN
    ALTER TABLE users
      ADD CONSTRAINT fk_users_divisi
      FOREIGN KEY (divisi_id) REFERENCES divisi(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS jenis_cuti (
  id SERIAL PRIMARY KEY,
  nama VARCHAR(100) UNIQUE NOT NULL,
  kuota NUMERIC(4,1),
  wajib_lampiran BOOLEAN NOT NULL DEFAULT FALSE,
  memotong_kuota BOOLEAN NOT NULL DEFAULT FALSE,
  min_hari_sebelum INTEGER NOT NULL DEFAULT 0,
  maks_hari_sesudah INTEGER NOT NULL DEFAULT 0
);

INSERT INTO jenis_cuti (nama, kuota, wajib_lampiran, memotong_kuota, min_hari_sebelum, maks_hari_sesudah) VALUES
  ('Cuti Tahunan', 12, FALSE, TRUE, 3, 0),
  ('Cuti Sakit', NULL, TRUE, FALSE, 0, 3),
  ('Cuti Menikah', 3, FALSE, FALSE, 7, 0),
  ('Cuti Melahirkan', 90, FALSE, FALSE, 7, 0),
  ('Cuti Duka', 3, FALSE, FALSE, 0, 1)
ON CONFLICT (nama) DO NOTHING;

CREATE TABLE IF NOT EXISTS pengajuan_cuti (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  jenis_cuti_id INTEGER NOT NULL REFERENCES jenis_cuti(id),
  tanggal_pengajuan DATE NOT NULL DEFAULT CURRENT_DATE,
  tanggal_mulai DATE NOT NULL,
  tanggal_selesai DATE NOT NULL,
  setengah_hari BOOLEAN NOT NULL DEFAULT FALSE,
  total_hari NUMERIC(4,1) NOT NULL,
  alasan TEXT NOT NULL,
  handover_user_id INTEGER REFERENCES users(id),
  catatan_tugas TEXT,
  alamat_selama_cuti TEXT,
  nomor_darurat VARCHAR(20),
  lampiran VARCHAR(255),
  lampiran_data BYTEA,
  lampiran_tipe VARCHAR(100),
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved_leader','approved','rejected','cancelled')),
  alasan_pembatalan TEXT
);

CREATE TABLE IF NOT EXISTS approval_log (
  id SERIAL PRIMARY KEY,
  pengajuan_id INTEGER NOT NULL REFERENCES pengajuan_cuti(id) ON DELETE CASCADE,
  approver_id INTEGER NOT NULL REFERENCES users(id),
  level VARCHAR(10) NOT NULL CHECK (level IN ('leader','hrd')),
  aksi VARCHAR(10) NOT NULL CHECK (aksi IN ('approved','rejected')),
  catatan TEXT,
  dibuat_pada TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  token_hash VARCHAR(64) UNIQUE NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS hari_libur (
  id SERIAL PRIMARY KEY,
  tanggal DATE UNIQUE NOT NULL,
  keterangan VARCHAR(150) NOT NULL,
  jenis VARCHAR(20) NOT NULL DEFAULT 'nasional'
    CHECK (jenis IN ('nasional','cuti_bersama'))
);

CREATE TABLE IF NOT EXISTS blackout (
  id SERIAL PRIMARY KEY,
  tanggal_mulai DATE NOT NULL,
  tanggal_selesai DATE NOT NULL,
  keterangan VARCHAR(150) NOT NULL,
  CHECK (tanggal_selesai >= tanggal_mulai)
);

CREATE TABLE IF NOT EXISTS pengaturan (
  kunci VARCHAR(50) PRIMARY KEY,
  nilai VARCHAR(50) NOT NULL
);

INSERT INTO pengaturan (kunci, nilai)
VALUES ('kapasitas_maks_persen', '50')
ON CONFLICT (kunci) DO NOTHING;