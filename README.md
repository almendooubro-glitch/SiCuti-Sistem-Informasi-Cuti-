# SiCuti

![Next.js](https://img.shields.io/badge/Next.js-16.4.6-black?logo=next.js&style=flat-square)
![React](https://img.shields.io/badge/React-19.3.0-149ECA?logo=react&style=flat-square)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.3.3-06B6D4?logo=tailwindcss&style=flat-square)
![Node.js](https://img.shields.io/badge/Node.js-%3E%3D20.9.0-339933?logo=nodedotjs&style=flat-square)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-4169E1?logo=postgresql&style=flat-square)
![Lucide React](https://img.shields.io/badge/Lucide_React-Icon_Library-4F46E5?style=flat-square)

**SiCuti** adalah aplikasi web untuk mengelola pengajuan cuti karyawan, pemeriksaan berjenjang, kuota, dan kalender hari libur.

## Daftar Isi

1. [Header Project](#sicuti)
2. [Tentang Project](#tentang-project)
3. [Fitur Utama](#fitur-utama)
4. [Teknologi](#teknologi)
5. [Struktur Folder](#struktur-folder)
6. [Persyaratan Sistem](#persyaratan-sistem)
7. [Instalasi](#instalasi)
8. [Environment Variables](#environment-variables)
9. [Database](#database)
10. [Data Seed](#data-seed)
11. [Panduan Penggunaan](#panduan-penggunaan)
12. [Alur Sistem](#alur-sistem)
13. [Keamanan](#keamanan)
14. [Troubleshooting](#troubleshooting)
15. [Kontributor dan Lisensi](#kontributor-dan-lisensi)

## Tentang Project

Pengajuan cuti memerlukan pencatatan tanggal, sisa kuota, hari kerja, dan keputusan pihak yang berwenang. SiCuti menyediakan satu aplikasi untuk mengelola proses tersebut dan melihat status serta riwayat persetujuan.

Aturan cuti—seperti kebutuhan lampiran, batas pengajuan, pemotongan kuota, kapasitas divisi, hari libur, dan periode larangan cuti—diterapkan oleh aplikasi berdasarkan data di PostgreSQL.

## Fitur Utama

### Semua pengguna

- Masuk dengan email atau nama pengguna dan kata sandi.
- Melihat dashboard sesuai peran, mengubah profil, mengganti kata sandi, dan mengelola foto profil.
- Menggunakan tampilan siang atau malam.

### Karyawan

- Mengajukan cuti dan melihat sisa kuota tahunan serta riwayat pengajuan.
- Memilih jenis cuti, termasuk Cuti Setengah Hari.
- Melihat perhitungan hari kerja yang tidak menghitung Sabtu, Minggu, dan tanggal yang terdaftar sebagai hari libur.
- Mengisi alasan, rekan pengganti, catatan serah tugas, alamat selama cuti, nomor darurat, dan lampiran jika diperlukan.
- Membatalkan pengajuan yang masih menunggu persetujuan dengan menyertakan alasan.

### Ketua Divisi

- Mengajukan cuti untuk diri sendiri seperti karyawan.
- Melihat dan menyetujui atau menolak pengajuan anggota divisi yang dipimpin.
- Melihat ringkasan anggota serta riwayat pengajuan divisi.

### HRD

- Memberikan persetujuan akhir atas pengajuan yang disetujui Ketua Divisi.
- Memproses pengajuan Ketua Divisi secara langsung.
- Menyetujui beberapa pengajuan sekaligus.
- Melihat riwayat dan pemantauan pengajuan, serta mengelola pengaturan cuti.

### Admin

- Membuat, mengubah, mengaktifkan, dan menonaktifkan akun; mengatur peran dan kuota awal.
- Membuat akun Admin baru.
- Mengelola divisi, ketua divisi, dan anggota.
- Mengatur jenis cuti, batas kapasitas divisi, hari libur, dan periode larangan cuti.
- Melihat ringkasan pengguna, divisi, pengajuan, dan aktivitas persetujuan.

### Aturan dan perhitungan cuti

- Pengajuan diperiksa terhadap kuota, masa kerja untuk Cuti Tahunan, batas waktu pengajuan per jenis, tanggal yang bertabrakan, dan kelengkapan lampiran.
- Cuti selain Cuti Sakit dibatasi oleh periode larangan cuti dan batas kapasitas divisi.
- Cuti Setengah Hari hanya berlaku untuk satu tanggal dan mengurangi kuota sebesar 0,5 hari.
- Status pengajuan yang digunakan: menunggu persetujuan, disetujui Ketua Divisi, disetujui, ditolak, dan dibatalkan.

### Hari libur Google Calendar

Admin atau HRD dapat menyinkronkan kalender melalui pengaturan. Aplikasi membaca feed iCalendar publik **Holidays in Indonesia**:

<https://calendar.google.com/calendar/ical/en.indonesian%23holiday%40group.v.calendar.google.com/public/basic.ics>

Fungsi integrasi berada di `src/lib/google-calendar.js`. Feed diproses untuk mengambil tanggal hari libur nasional dan cuti bersama, lalu hasilnya disimpan di tabel `hari_libur`. Tanggal tersebut ikut dipakai dalam perhitungan hari kerja dan kapasitas. Sinkronisasi dilakukan melalui tombol di aplikasi, bukan berjalan otomatis. Data yang dimasukkan manual dipertahankan; data dari Google diperbarui dan data Google yang sudah tidak ada di feed dihapus. Kalender ini bukan sumber resmi pemerintah, sehingga admin tetap dapat mengelola tanggal secara manual.

Integrasi menggunakan feed iCalendar publik, bukan Google Calendar REST API; **`GOOGLE_CALENDAR_API_KEY` tidak diperlukan atau digunakan**.

## Teknologi

| Teknologi | Penggunaan |
| --- | --- |
| Next.js 16.4.6 | Framework web, App Router, Server Components, Server Actions, dan Route Handlers |
| React 19.3.0 | Antarmuka interaktif |
| Tailwind CSS 4.3.3 | Styling responsif |
| PostgreSQL | Penyimpanan akun, sesi, pengajuan, persetujuan, dan pengaturan |
| `pg` | Koneksi aplikasi ke PostgreSQL |
| `bcryptjs` | Hash dan pemeriksaan kata sandi |
| `lucide-react` | Ikon antarmuka |
| Google Calendar iCalendar publik | Sumber data hari libur nasional dan cuti bersama |
| ESLint | Pemeriksaan kode |

## Struktur Folder

```text
.
├── database/
│   └── schema.sql                 # Definisi tabel dan data konfigurasi awal
├── public/                        # Aset statis
├── scripts/
│   └── seed.js                    # Pengisian data contoh
├── src/
│   ├── app/
│   │   ├── api/                   # Route Handler untuk login, logout, foto, dan lampiran
│   │   ├── cuti/                  # Pengajuan dan riwayat cuti pengguna
│   │   ├── dashboard/             # Dashboard sesuai peran
│   │   ├── divisi/                # Pengelolaan divisi
│   │   ├── jenis-cuti/            # Pengelolaan aturan jenis cuti
│   │   ├── login/                 # Halaman masuk dan akun contoh
│   │   ├── pengaturan/            # Kapasitas, hari libur, dan periode larangan
│   │   ├── pengguna/              # Pengelolaan akun oleh Admin
│   │   ├── profil/                # Profil dan riwayat pengguna
│   │   ├── verifikasi/            # Pemeriksaan Ketua Divisi dan HRD
│   │   ├── globals.css            # Tailwind dan tema
│   │   ├── layout.js              # Layout utama
│   │   └── page.js                # Pengalihan ke dashboard atau login
│   ├── components/
│   │   ├── FormulirCuti.jsx       # Formulir pengajuan cuti
│   │   ├── FormulirMasuk.jsx      # Formulir login
│   │   ├── KakiHalaman.jsx        # Bagian bawah halaman
│   │   ├── KerangkaAplikasi.jsx   # Kerangka dan navigasi aplikasi
│   │   ├── KomponenUmum.jsx       # Komponen antarmuka umum
│   │   ├── ModalKeputusan.jsx     # Konfirmasi persetujuan atau penolakan
│   │   ├── PengalihTema.jsx       # Pengalih tema tampilan
│   │   ├── TombolKeluar.jsx       # Tombol keluar akun
│   │   └── TombolKonfirmasi.jsx   # Tombol dengan konfirmasi
│   └── lib/
│       ├── db.js                  # Pool koneksi PostgreSQL
│       ├── google-calendar.js     # Pengambilan dan pemrosesan feed iCalendar
│       ├── hari.js                # Perhitungan tanggal dan hari kerja
│       ├── kapasitas.js           # Pemeriksaan kapasitas cuti divisi
│       └── session.js             # Sesi dan pemeriksaan akses
├── .gitignore
├── eslint.config.mjs
├── jsconfig.json                  # Alias import @/*
├── next.config.mjs
├── package.json
└── package-lock.json
```

### Route API

| Metode dan path | Fungsi | Akses |
| --- | --- | --- |
| `POST /api/login` | Memeriksa kredensial dan membuat sesi | Publik |
| `POST /api/logout` | Menghapus sesi aktif | Pengguna yang masuk |
| `GET /api/foto?id=<id_pengguna>` | Menampilkan foto profil | Pengguna yang masuk |
| `GET /api/lampiran?id=<id_pengajuan>` | Mengambil lampiran pengajuan | Pemohon, HRD, atau Ketua Divisi pemohon |

## Persyaratan Sistem

- Node.js **20.9.0 atau lebih baru** (batas yang dinyatakan oleh Next.js di project).
- npm, disertakan bersama Node.js.
- PostgreSQL yang dapat diakses aplikasi. Project tidak menetapkan versi minimum PostgreSQL.
- Browser modern.

## Instalasi

1. Clone repository dan masuk ke folder project:

   ```bash
   git clone https://github.com/almendooubro-glitch/SiCuti-Sistem-Informasi-Cuti-.git
   cd SiCuti-Sistem-Informasi-Cuti-
   ```

2. Pasang dependency:

   ```bash
   npm install
   ```

3. Buat database PostgreSQL, misalnya `sicuti`, lalu buat file `.env.local` di folder utama project:

   ```dotenv
   DATABASE_URL=postgresql://postgres:KATA_SANDI@localhost:5432/sicuti
   ```

   Ganti `KATA_SANDI` dengan kata sandi database lokal. Jika kata sandi berisi karakter khusus, lakukan URL-encoding pada nilai koneksi.

4. Buat tabel dan konfigurasi awal:

   ```bash
   psql "postgresql://postgres:KATA_SANDI@localhost:5432/sicuti" -f database/schema.sql
   ```

   Perintah ini membutuhkan `psql` dan koneksi ke database yang sama dengan `DATABASE_URL`.

5. Isi akun dan data contoh:

   ```bash
   npm run seed
   ```

6. Jalankan aplikasi dalam mode pengembangan:

   ```bash
   npm run dev
   ```

   Buka <http://localhost:3000>.

Untuk pemeriksaan kode dan menjalankan versi produksi:

```bash
npm run lint
npm run build
npm start
```

`npm start` menjalankan hasil build, jadi jalankan `npm run build` terlebih dahulu.

## Environment Variables

| Variabel | Wajib | Keterangan |
| --- | --- | --- |
| `DATABASE_URL` | Ya | URL koneksi PostgreSQL. Dibaca oleh aplikasi dan skrip seed. |
| `NODE_ENV` | Diatur oleh Next.js | Menentukan mode aplikasi; cookie sesi menggunakan atribut `secure` saat bernilai `production`. Biasanya tidak perlu ditulis sendiri untuk penggunaan lokal. |

Simpan nilai lokal di `.env.local`. File `.env*` diabaikan oleh Git; jangan memasukkan kredensial database ke README atau repository.

Sinkronisasi hari libur menggunakan feed publik dan tidak memerlukan API key Google. Project tidak menggunakan `GOOGLE_CALENDAR_API_KEY`.

## Database

Skema utama berada di [`database/schema.sql`](./database/schema.sql). Jalankan skema sebelum seed. Skema berisi `CREATE TABLE IF NOT EXISTS`, penambahan constraint divisi, dan konfigurasi awal; project tidak menyediakan sistem migrasi terpisah.

| Tabel | Kolom penting dan fungsi |
| --- | --- |
| `users` | `username`, `email`, `password`, `nama_lengkap`, `role`, `divisi_id`, `kuota_awal`, `is_active`, data kontak, foto, dan `tanggal_bergabung`. |
| `divisi` | Nama dan deskripsi divisi serta `ketua_id`. Ketua hanya dapat memimpin satu divisi. |
| `jenis_cuti` | Nama jenis, `kuota`, `wajib_lampiran`, `memotong_kuota`, dan batas hari pengajuan sebelum/sesudah tanggal mulai. |
| `pengajuan_cuti` | Pemohon, jenis, tanggal, `total_hari`, alasan, rekan pengganti, lampiran, status, dan alasan pembatalan. |
| `approval_log` | Catatan keputusan, approver, tingkat persetujuan (`leader` atau `hrd`), aksi, catatan, dan waktu. |
| `sessions` | Hash token sesi, pemilik sesi, dan waktu kedaluwarsa. |
| `hari_libur` | Tanggal unik, keterangan, jenis (`nasional` atau `cuti_bersama`), dan sumber (`manual` atau `google_calendar`). |
| `blackout` | Rentang tanggal dan keterangan periode larangan cuti. |
| `pengaturan` | Nilai konfigurasi dengan kunci unik, termasuk `kapasitas_maks_persen`. |

Relasi utama:

- Pengguna dapat tergabung dalam satu divisi; jika divisi dihapus, hubungan divisi pengguna diatur menjadi kosong.
- Divisi menunjuk satu ketua dari tabel `users`.
- Pengajuan terhubung ke pemohon dan jenis cuti, serta dapat menunjuk pengguna lain sebagai rekan pengganti.
- Log persetujuan terhubung ke pengajuan dan approver.
- Sesi terhubung ke pengguna dan ikut terhapus ketika pengguna dihapus.
- Hari libur memiliki satu baris per tanggal. Data manual tidak ditimpa saat sinkronisasi Google.

Status pengajuan yang dibatasi skema: `pending`, `approved_leader`, `approved`, `rejected`, dan `cancelled`.

## Data Seed

`npm run seed` menjalankan `scripts/seed.js`. Script membaca `DATABASE_URL` (termasuk dari `.env.local`) dan mengisi data awal. Password semua akun contoh adalah **`password123`**; password tersebut di-hash dengan `bcryptjs` menggunakan cost 10 sebelum disimpan.

| Nama pengguna | Email | Peran | Status awal |
| --- | --- | --- | --- |
| `admin` | `admin@sicuti.com` | Admin | Aktif |
| `hrd` | `hrd@sicuti.com` | HRD | Aktif |
| `ketua` | `ketua@sicuti.com` | Ketua Divisi | Aktif |
| `ketua2` | `ketua2@sicuti.com` | Ketua Divisi | Aktif |
| `karyawan` | `karyawan@sicuti.com` | Karyawan | Aktif |
| `dewi` | `dewi@sicuti.com` | Karyawan | Aktif |
| `eko` | `eko@sicuti.com` | Karyawan | Aktif |
| `fajar` | `fajar@sicuti.com` | Karyawan | Aktif |
| `gita` | `gita@sicuti.com` | Karyawan | Aktif |
| `hendra` | `hendra@sicuti.com` | Karyawan | Tidak aktif |

Akun tersebut adalah **akun contoh untuk pengembangan**, bukan akun produksi. Jangan memakai password awal di lingkungan yang berisi data nyata. Akun tidak aktif tidak dapat masuk sampai diaktifkan oleh Admin.

Seed juga menyediakan:

- Dua divisi contoh: Teknologi Informasi (ketua `ketua`, anggota `karyawan`, `dewi`, dan `eko`) serta Keuangan (ketua `ketua2`, anggota `fajar`, `gita`, dan `hendra`).
- Enam jenis cuti awal:

  | Jenis | Nilai kuota jenis cuti | Lampiran wajib | Memotong kuota tahunan | Batas pengajuan |
  | --- | ---: | --- | --- | --- |
  | Cuti Tahunan | 12 hari | Tidak | Ya | Minimal H-3; hanya dapat diambil setelah masa kerja satu tahun |
  | Cuti Sakit | Tanpa batas | Ya | Tidak | Dapat diajukan hingga 3 hari setelah tanggal mulai |
  | Cuti Menikah | 3 hari | Tidak | Tidak | Minimal H-7 |
  | Cuti Melahirkan | 90 hari | Tidak | Tidak | Minimal H-7 |
  | Cuti Duka | 3 hari | Tidak | Tidak | Dapat diajukan hingga 1 hari setelah tanggal mulai |
  | Cuti Setengah Hari | 0,5 hari | Tidak | Ya | Minimal H-3; satu tanggal |

  Untuk jenis yang tidak memotong kuota tahunan, nilai kuota menjadi batas hari per pengajuan. Cuti Tahunan dan Cuti Setengah Hari menggunakan sisa kuota tahunan pengguna.

- Tiga hari libur contoh: 24 Desember 2026 (Cuti Bersama Natal), 25 Desember 2026 (Hari Raya Natal), dan 1 Januari 2027 (Tahun Baru 2027).
- Periode larangan cuti 28–31 Desember 2026 dengan keterangan “Tutup buku akhir tahun”, jika tabel `blackout` masih kosong.
- Batas kapasitas awal sebesar 50%.
- Delapan pengajuan contoh dan log persetujuan, **hanya jika tabel pengajuan masih kosong**:

  | Pemohon | Jenis cuti | Status awal |
  | --- | --- | --- |
  | `karyawan` | Cuti Tahunan | Menunggu persetujuan |
  | `karyawan` | Cuti Sakit | Disetujui |
  | `dewi` | Cuti Tahunan | Disetujui Ketua Divisi |
  | `eko` | Cuti Tahunan | Disetujui |
  | `fajar` | Cuti Tahunan | Ditolak |
  | `gita` | Cuti Tahunan | Menunggu persetujuan |
  | `ketua` | Cuti Tahunan | Menunggu persetujuan |
  | `eko` | Cuti Tahunan | Disetujui |

  Tanggal contoh pengajuan dihitung relatif terhadap tanggal saat seed dijalankan. Beberapa pengajuan memiliki catatan persetujuan pada `approval_log`.

- Data kontak contoh untuk pengguna yang kolom teleponnya belum terisi.

Sebagian data dimasukkan dengan `ON CONFLICT` agar data yang sudah ada tidak diduplikasi. Namun, menjalankan seed pada database yang telah dipakai dapat memperbarui kata sandi, nama, peran, status aktif, tanggal bergabung, dan penempatan divisi untuk akun contoh dengan email yang sama. Pengajuan contoh tidak ditambahkan jika sudah ada pengajuan.

### Reset data contoh

```bash
npm run reset-seed
```

Perintah ini menjalankan seed dengan opsi `--reset`, yang mengosongkan tabel sesi, persetujuan, pengajuan, periode larangan, hari libur, pengaturan, divisi, jenis cuti, dan pengguna sebelum membuat ulang data contoh. **Semua data pada tabel tersebut akan terhapus. Jangan jalankan pada database produksi atau database yang berisi data yang ingin dipertahankan.**

## Panduan Penggunaan

### Masuk

Masuk menggunakan email atau nama pengguna dan kata sandi. Pada halaman login, akun contoh yang aktif dapat dipilih untuk mengisi formulir dengan cepat. Fitur tersebut hanya untuk kemudahan pengembangan.

### Karyawan

1. Buka **Cuti Saya** lalu pilih **Ajukan Cuti**.
2. Pilih jenis cuti, tentukan tanggal, dan lengkapi alasan serta informasi pendukung.
3. Periksa total hari kerja dan sisa kuota yang ditampilkan, lalu kirim pengajuan.
4. Buka detail pengajuan untuk melihat status dan riwayat persetujuan.
5. Pengajuan hanya dapat dibatalkan saat masih menunggu persetujuan; alasan pembatalan wajib diisi.

### Ketua Divisi

1. Buka **Verifikasi** untuk melihat pengajuan anggota divisi.
2. Periksa detail pengajuan dan lampiran jika tersedia.
3. Setujui atau tolak pengajuan. Catatan wajib diberikan saat menolak.
4. Pengajuan cuti pribadi dilakukan melalui **Cuti Saya** seperti karyawan.

### HRD

1. Buka **Persetujuan Akhir** untuk memeriksa pengajuan yang menunggu keputusan akhir.
2. Tinjau sisa kuota, kapasitas divisi, dan keputusan Ketua Divisi jika tersedia.
3. Setujui atau tolak satu pengajuan; penolakan membutuhkan catatan. Beberapa pengajuan dapat dipilih untuk persetujuan sekaligus.
4. Gunakan **Pengaturan** untuk mengelola kapasitas, kalender hari libur, dan periode larangan cuti.

### Admin

- Gunakan **Pengguna** untuk membuat akun, memilih peran, mengatur kuota awal, dan mengelola status akun.
- Gunakan **Divisi** untuk menetapkan ketua dan mengatur anggota.
- Gunakan **Jenis Cuti** untuk mengatur kuota, kebutuhan lampiran, pemotongan kuota, serta batas waktu pengajuan.
- Gunakan **Pengaturan** untuk mengubah batas kapasitas, menambah atau menyinkronkan hari libur, dan mengelola periode larangan cuti.
- Buka profil pengguna melalui **Kelola** untuk mengatur peran, kuota awal, dan status aktif.

## Alur Sistem

```mermaid
flowchart TD
    A[Pemohon mengisi formulir] --> B{Validasi lolos?}
    B -- Tidak --> C[Perbaiki data]
    C --> A
    B -- Ya --> D[Pengajuan disimpan dengan status pending]
    D --> E{Pemohon Ketua Divisi?}
    E -- Tidak --> F[Verifikasi Ketua Divisi]
    F --> G{Keputusan Ketua Divisi}
    G -- Ditolak --> R[Status ditolak]
    G -- Disetujui --> H[Persetujuan akhir HRD]
    E -- Ya --> H
    H --> I{Keputusan HRD}
    I -- Ditolak --> R
    I -- Disetujui --> J[Status disetujui]
    D --> K{Dibatalkan sebelum diproses?}
    K -- Ya --> L[Status dibatalkan]
```

## Keamanan

- Kata sandi di-hash dengan bcrypt melalui `bcryptjs`; kata sandi tidak disimpan sebagai teks biasa.
- Sesi menggunakan token acak. Database menyimpan hash SHA-256 token, bukan token sesi mentah.
- Cookie sesi memakai `httpOnly`, `sameSite: "lax"`, dan `secure` pada mode produksi. Masa berlaku sesi satu hari atau 30 hari jika opsi **Ingat saya** dipilih.
- Pemeriksaan login memastikan akun aktif. Halaman dan aksi server membatasi akses berdasarkan peran.
- Query database menggunakan parameter untuk nilai masukan.
- Lampiran cuti dibatasi ke PDF, JPG, atau PNG hingga 900 KB. Foto profil menerima JPG, PNG, atau WEBP. Formulir menampilkan batas 900 KB, sedangkan validasi server saat ini mengizinkan hingga 10 MB.
- Pengambilan lampiran dibatasi untuk pemohon, HRD, dan Ketua Divisi yang memimpin divisi pemohon. Foto hanya dapat diambil oleh pengguna yang sudah masuk.
- `.env.local` diabaikan oleh Git. Jangan mengunggah URL database atau kredensial.

Untuk penggunaan produksi, gunakan HTTPS, rahasiakan kredensial database, batasi akses database, dan siapkan backup. Repo ini tidak menyediakan autentikasi multifaktor atau notifikasi email.

## Troubleshooting

| Masalah | Solusi |
| --- | --- |
| Aplikasi tidak dapat terhubung ke database | Pastikan PostgreSQL berjalan, database sudah dibuat, dan `DATABASE_URL` di `.env.local` benar. |
| Pesan `DATABASE_URL tidak ditemukan` saat seed | Buat `.env.local` di folder utama atau atur variabel `DATABASE_URL` pada lingkungan shell. |
| Tabel atau kolom belum tersedia | Jalankan `database/schema.sql` pada database yang sama sebelum `npm run seed`. Skema ini adalah file SQL project; tidak ada perintah migrasi npm tersendiri. |
| Tidak bisa masuk dengan akun contoh | Jalankan `npm run seed`, gunakan email/nama pengguna seed dan password awal `password123`; pastikan akunnya aktif. |
| Pengajuan ditolak oleh validasi tanggal atau kuota | Periksa aturan jenis cuti, tanggal kerja, hari libur, periode larangan, masa kerja, pengajuan lain yang bertabrakan, dan sisa kuota. |
| Lampiran atau foto tidak diterima | Periksa format dan ukuran file sesuai batas yang tercantum di formulir. |
| Sinkronisasi Google Calendar gagal | Pastikan server dapat mengakses feed publik. Integrasi saat ini tidak memerlukan `GOOGLE_CALENDAR_API_KEY`; periksa pesan kesalahan pada halaman pengaturan. Admin atau HRD juga dapat memasukkan tanggal secara manual. |
| Port pengembangan sudah digunakan | Hentikan aplikasi lain yang memakai port 3000 atau jalankan Next.js dengan opsi port, misalnya `npm run dev -- -p 3001`. |

## Kontributor dan Lisensi

Repository ini belum mencantumkan daftar kontributor khusus. Tidak ditemukan berkas `LICENSE`, sehingga lisensi project belum dinyatakan. Pastikan memperoleh persetujuan pemilik repository sebelum mendistribusikan atau menggunakan project di luar ketentuan repository.
