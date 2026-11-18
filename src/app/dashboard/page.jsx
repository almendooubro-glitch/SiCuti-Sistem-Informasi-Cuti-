import {
  LayoutDashboard, UserCheck, UserX, CalendarDays, Clock, Building2, CalendarCheck,
  HeartPulse, FileText, Crown, Inbox, Users, Hourglass, Plane,
} from "lucide-react";
import { requireUser } from "@/lib/session";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";

const LABEL_ROLE = {
  admin: "Admin",
  user: "Karyawan",
  ketua_divisi: "Ketua Divisi",
  hrd: "HRD",
};

const tgl = (d) => new Date(d).toLocaleDateString("id-ID");

function Kartu({ judul, nilai, ikon: Ikon }) {
  return (
    <div className="border border-slate-700 rounded-lg p-4">
      <p className="text-sm text-slate-400"><Ikon size={16} /> {judul}</p>
      <p className="text-2xl font-bold mt-1">{nilai}</p>
    </div>
  );
}

function Daftar({ judul, items, kosong, ikon: Ikon }) {
  return (
    <section>
      <h2 className="font-semibold mb-2"><Ikon size={16} /> {judul}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-slate-400">{kosong}</p>
      ) : (
        <ul className="list-disc pl-5 space-y-1 text-sm">
          {items.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
      )}
    </section>
  );
}

async function DashboardAdmin() {
  const { rows } = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM users WHERE role IN ('user','ketua_divisi') AND is_active)::int AS aktif,
      (SELECT COUNT(*) FROM users WHERE role IN ('user','ketua_divisi') AND NOT is_active)::int AS nonaktif,
      (SELECT COUNT(*) FROM pengajuan_cuti
         WHERE date_trunc('month', tanggal_pengajuan) = date_trunc('month', CURRENT_DATE))::int AS bulan_ini,
      (SELECT COUNT(*) FROM pengajuan_cuti WHERE status IN ('pending','approved_leader'))::int AS pending,
      (SELECT COUNT(*) FROM divisi)::int AS divisi
  `);
  const baru = await pool.query(`
    SELECT nama_lengkap, tanggal_bergabung FROM users
    WHERE role IN ('user','ketua_divisi') AND is_active
      AND tanggal_bergabung > CURRENT_DATE - INTERVAL '1 year'
    ORDER BY tanggal_bergabung DESC
  `);
  const s = rows[0];

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Kartu judul="Karyawan Aktif" nilai={s.aktif} ikon={UserCheck} />
        <Kartu judul="Karyawan Tidak Aktif" nilai={s.nonaktif} ikon={UserX} />
        <Kartu judul="Pengajuan Bulan Ini" nilai={s.bulan_ini} ikon={CalendarDays} />
        <Kartu judul="Pending Approval" nilai={s.pending} ikon={Clock} />
        <Kartu judul="Total Divisi" nilai={s.divisi} ikon={Building2} />
      </div>
      <Daftar
        judul="Masa Kerja < 1 Tahun (belum eligible cuti tahunan)"
        ikon={Hourglass}
        items={baru.rows.map((r) => `${r.nama_lengkap} (bergabung ${tgl(r.tanggal_bergabung)})`)}
        kosong="Tidak ada karyawan."
      />
    </>
  );
}

async function DashboardKaryawan({ user }) {
  const { rows } = await pool.query(
    `SELECT
       u.kuota_awal - COALESCE((
         SELECT SUM(p.total_hari) FROM pengajuan_cuti p
         JOIN jenis_cuti j ON j.id = p.jenis_cuti_id
         WHERE p.user_id = u.id AND j.memotong_kuota
           AND EXTRACT(YEAR FROM p.tanggal_mulai) = EXTRACT(YEAR FROM CURRENT_DATE)
           AND p.status IN ('pending','approved_leader','approved')
       ), 0) AS sisa,
       (SELECT COUNT(*) FROM pengajuan_cuti p
          JOIN jenis_cuti j ON j.id = p.jenis_cuti_id
          WHERE p.user_id = u.id AND j.nama = 'Cuti Sakit')::int AS sakit,
       (SELECT COUNT(*) FROM pengajuan_cuti WHERE user_id = u.id)::int AS total,
       d.nama AS divisi, k.nama_lengkap AS ketua
     FROM users u
     LEFT JOIN divisi d ON d.id = u.divisi_id
     LEFT JOIN users k ON k.id = d.ketua_id
     WHERE u.id = $1`,
    [user.id]
  );
  const s = rows[0];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      <Kartu judul="Sisa Kuota Cuti Tahunan" nilai={`${Number(s.sisa)} hari`} ikon={CalendarCheck} />
      <Kartu judul="Cuti Sakit Diajukan" nilai={s.sakit} ikon={HeartPulse} />
      <Kartu judul="Total Pengajuan" nilai={s.total} ikon={FileText} />
      <Kartu judul="Divisi" nilai={s.divisi || "-"} ikon={Building2} />
      <Kartu judul="Ketua Divisi" nilai={s.ketua || "-"} ikon={Crown} />
    </div>
  );
}

async function DashboardKetua({ user }) {
  const div = await pool.query("SELECT id, nama FROM divisi WHERE ketua_id = $1", [user.id]);
  if (div.rows.length === 0) {
    return <p className="text-slate-400">Kamu belum ditetapkan sebagai ketua divisi mana pun. Hubungi admin.</p>;
  }
  const divisiId = div.rows[0].id;

  const stat = await pool.query(
    `SELECT COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE p.status = 'pending')::int AS pending
     FROM pengajuan_cuti p JOIN users u ON u.id = p.user_id
     WHERE u.divisi_id = $1 AND u.id <> $2`,
    [divisiId, user.id]
  );
  const anggota = await pool.query(
    `SELECT u.nama_lengkap,
       EXISTS (
         SELECT 1 FROM pengajuan_cuti p
         WHERE p.user_id = u.id AND p.status = 'approved'
           AND p.tanggal_mulai <= date_trunc('week', CURRENT_DATE)::date + 6
           AND p.tanggal_selesai >= date_trunc('week', CURRENT_DATE)::date
       ) AS cuti
     FROM users u WHERE u.divisi_id = $1 AND u.id <> $2
     ORDER BY u.nama_lengkap`,
    [divisiId, user.id]
  );

  return (
    <>
      <p className="text-slate-400">Divisi {div.rows[0].nama}</p>
      <div className="grid grid-cols-2 gap-4">
        <Kartu judul="Pengajuan Masuk" nilai={stat.rows[0].total} ikon={Inbox} />
        <Kartu judul="Pending Verifikasi" nilai={stat.rows[0].pending} ikon={Clock} />
      </div>
      <Daftar
        judul="Anggota Divisi"
        ikon={Users}
        items={anggota.rows.map((a) => (a.cuti ? `${a.nama_lengkap} (sedang cuti minggu ini)` : a.nama_lengkap))}
        kosong="Belum ada anggota."
      />
    </>
  );
}

async function DashboardHrd() {
  const stat = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM pengajuan_cuti
         WHERE date_trunc('month', tanggal_pengajuan) = date_trunc('month', CURRENT_DATE))::int AS bulan_ini,
      (SELECT COUNT(*) FROM pengajuan_cuti p JOIN users u ON u.id = p.user_id
         WHERE p.status = 'approved_leader'
            OR (p.status = 'pending' AND u.role = 'ketua_divisi'))::int AS pending
  `);
  const cuti = await pool.query(`
    SELECT DISTINCT u.nama_lengkap
    FROM pengajuan_cuti p JOIN users u ON u.id = p.user_id
    WHERE p.status = 'approved'
      AND p.tanggal_mulai <= (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month')::date - 1
      AND p.tanggal_selesai >= date_trunc('month', CURRENT_DATE)::date
    ORDER BY 1
  `);
  const divisi = await pool.query(`
    SELECT d.nama, k.nama_lengkap AS ketua,
           (SELECT COUNT(*) FROM users WHERE divisi_id = d.id)::int AS anggota
    FROM divisi d LEFT JOIN users k ON k.id = d.ketua_id
    ORDER BY d.nama
  `);

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <Kartu judul="Pengajuan Bulan Ini" nilai={stat.rows[0].bulan_ini} ikon={CalendarDays} />
        <Kartu judul="Pending Final Approval" nilai={stat.rows[0].pending} ikon={Clock} />
      </div>
      <Daftar
        judul="Karyawan Sedang Cuti Bulan Ini"
        ikon={Plane}
        items={cuti.rows.map((r) => r.nama_lengkap)}
        kosong="Tidak ada yang cuti bulan ini."
      />
      <Daftar
        judul="Daftar Divisi"
        ikon={Building2}
        items={divisi.rows.map((d) => `${d.nama} (ketua: ${d.ketua || "-"}, ${d.anggota} anggota)`)}
        kosong="Belum ada divisi."
      />
    </>
  );
}

export default async function DashboardPage() {
  const user = await requireUser();

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold"><LayoutDashboard size={24} /> Dashboard</h1>
        <p className="text-slate-400">
          Selamat datang, {user.nama_lengkap} ({LABEL_ROLE[user.role]})
        </p>
      </div>

      {user.role === "admin" && <DashboardAdmin />}
      {user.role === "user" && <DashboardKaryawan user={user} />}
      {user.role === "ketua_divisi" && <DashboardKetua user={user} />}
      {user.role === "hrd" && <DashboardHrd />}
    </main>
  );
}