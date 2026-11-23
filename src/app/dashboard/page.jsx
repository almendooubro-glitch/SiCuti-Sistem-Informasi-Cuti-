import Link from "next/link";
import {
  LayoutDashboard, UserCheck, UserX, CalendarDays, Clock, Building2, CalendarCheck,
  HeartPulse, FileText, Crown, Inbox, Users, Hourglass, Plane, Plus, Settings, Tags,
  ClipboardCheck, History, ArrowRight, UserRound,
} from "lucide-react";
import { requireUser } from "@/lib/session";
import pool from "@/lib/db";
import {
  PAGE, LABEL_ROLE, Panel, StatCard, Badge, Progress, Kosong, tgl, btn, TABLE, TH, TD, TR,
} from "@/components/ui";

export const dynamic = "force-dynamic";

function Hero({ user, children }) {
  return (
    <div className="rounded-3xl bg-gradient-to-br from-[#012677] via-[#022F8E] to-[#0450D5] p-5 text-white shadow-lg shadow-[#012677]/20 sm:p-7">
      <p className="text-sm text-[#CBDFFC]">{LABEL_ROLE[user.role]}</p>
      <h1 className="mt-1 flex items-center gap-2 text-xl font-bold sm:text-2xl">
        <LayoutDashboard size={24} /> Selamat datang, {user.nama_lengkap}
      </h1>
      {children}
    </div>
  );
}

function Aksi({ href, ikon: Ikon, label }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg border border-[#CBDFFC] p-3 text-sm font-medium text-[#012677] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#54B7FD] hover:bg-[#E8F0FD] hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2893FC] dark:border-[#54B7FD]/20 dark:text-[#E8F0FD] dark:hover:bg-[#0450D5]/25"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#CBDFFC] text-[#0450D5] dark:bg-[#0450D5]/25 dark:text-[#54B7FD]">
        <Ikon size={16} />
      </span>
      {label}
      <ArrowRight size={14} className="ml-auto text-slate-400" />
    </Link>
  );
}

function Lihat({ href, label = "Lihat semua" }) {
  return (
    <Link href={href} className={btn("ghost", "sm")}>
      {label} <ArrowRight size={14} />
    </Link>
  );
}

function TabelPengajuan({ rows, pemohon = true, handover = false }) {
  if (rows.length === 0) return <Kosong>Belum ada pengajuan.</Kosong>;
  return (
    <div className="overflow-x-auto">
      <table className={TABLE}>
        <thead>
          <tr>
            {pemohon && <th className={TH}>Pemohon</th>}
            <th className={TH}>Jenis</th>
            <th className={TH}>Periode</th>
            <th className={TH}>Hari</th>
            {handover && <th className={TH}>Pengganti</th>}
            <th className={TH}>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className={TR}>
              {pemohon && <td className={`${TD} font-medium text-[#012677] dark:text-[#FEFEFE]`}>{r.nama_lengkap}</td>}
              <td className={TD}>{r.jenis}</td>
              <td className={`${TD} whitespace-nowrap`}>{tgl(r.tanggal_mulai)} - {tgl(r.tanggal_selesai)}</td>
              <td className={TD}>{Number(r.total_hari)}</td>
              {handover && <td className={TD}>{r.handover || "-"}</td>}
              <td className={TD}><Badge status={r.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DaftarNama({ items, kosong }) {
  if (items.length === 0) return <p className="text-sm text-slate-400">{kosong}</p>;
  return (
    <ul className="space-y-2 text-sm text-slate-700">
      {items.map((t, i) => (
        <li key={i} className="flex items-start gap-2">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#2893FC]" />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

async function DashboardAdmin({ user }) {
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
  const terbaru = await pool.query(`
    SELECT p.id, u.nama_lengkap, j.nama AS jenis, p.tanggal_mulai, p.tanggal_selesai, p.total_hari, p.status
    FROM pengajuan_cuti p JOIN users u ON u.id = p.user_id JOIN jenis_cuti j ON j.id = p.jenis_cuti_id
    ORDER BY p.tanggal_pengajuan DESC, p.id DESC LIMIT 5
  `);
  const aktivitas = await pool.query(`
    SELECT l.level, l.aksi, l.dibuat_pada, a.nama_lengkap AS approver, u.nama_lengkap AS pemohon
    FROM approval_log l
    JOIN users a ON a.id = l.approver_id
    JOIN pengajuan_cuti p ON p.id = l.pengajuan_id
    JOIN users u ON u.id = p.user_id
    ORDER BY l.id DESC LIMIT 6
  `);
  const s = rows[0];

  return (
    <>
      <Hero user={user}>
        <p className="mt-1 text-sm text-[#CBDFFC]">Pantau pengguna, divisi, dan pengajuan cuti di seluruh sistem.</p>
      </Hero>

      <div className="flex flex-wrap justify-center gap-4">
        <StatCard className="w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.667rem)] 2xl:w-[calc(20%-0.8rem)]" judul="Karyawan Aktif" nilai={s.aktif} ikon={UserCheck} tone="indigo" />
        <StatCard className="w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.667rem)] 2xl:w-[calc(20%-0.8rem)]" judul="Karyawan Tidak Aktif" nilai={s.nonaktif} ikon={UserX} tone="indigo" />
        <StatCard className="w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.667rem)] 2xl:w-[calc(20%-0.8rem)]" judul="Pengajuan Bulan Ini" nilai={s.bulan_ini} ikon={CalendarDays} tone="indigo" />
        <StatCard className="w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.667rem)] 2xl:w-[calc(20%-0.8rem)]" judul="Menunggu Persetujuan" nilai={s.pending} ikon={Clock} tone="indigo" />
        <StatCard className="w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.667rem)] 2xl:w-[calc(20%-0.8rem)]" judul="Total Divisi" nilai={s.divisi} ikon={Building2} tone="indigo" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel ikon={FileText} judul="Pengajuan Terbaru" className="lg:col-span-2" flush>
          <TabelPengajuan rows={terbaru.rows} />
        </Panel>
        <Panel ikon={Plus} judul="Aksi Cepat">
          <div className="space-y-2">
            <Aksi href="/pengguna" ikon={Users} label="Kelola Pengguna" />
            <Aksi href="/divisi" ikon={Building2} label="Kelola Divisi" />
            <Aksi href="/jenis-cuti" ikon={Tags} label="Jenis Cuti" />
            <Aksi href="/pengaturan" ikon={Settings} label="Pengaturan" />
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel ikon={History} judul="Aktivitas Persetujuan">
          {aktivitas.rows.length === 0 ? (
            <p className="text-sm text-slate-400">Belum ada aktivitas.</p>
          ) : (
            <ol className="space-y-4 border-l border-slate-200 pl-4">
              {aktivitas.rows.map((a, i) => (
                <li key={i} className="relative text-sm text-slate-700">
                  <span
                    className={`absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-white ${
                      a.aksi === "approved" ? "bg-emerald-500" : "bg-rose-500"
                    }`}
                  />
                  <strong>{a.approver}</strong> {a.aksi === "approved" ? "menyetujui" : "menolak"} pengajuan{" "}
                  <strong>{a.pemohon}</strong> sebagai {a.level === "leader" ? "Ketua Divisi" : "HRD"}
                  <span className="block text-xs text-slate-400">{tgl(a.dibuat_pada)}</span>
                </li>
              ))}
            </ol>
          )}
        </Panel>
        <Panel ikon={Hourglass} judul="Masa Kerja < 1 Tahun (belum memenuhi syarat cuti tahunan)">
          <DaftarNama
            items={baru.rows.map((r) => `${r.nama_lengkap} (bergabung ${tgl(r.tanggal_bergabung)})`)}
            kosong="Tidak ada karyawan."
          />
        </Panel>
      </div>
    </>
  );
}

async function DashboardKaryawan({ user }) {
  const { rows } = await pool.query(
    `SELECT
       u.kuota_awal,
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
  const terbaru = await pool.query(
    `SELECT p.id, j.nama AS jenis, p.tanggal_mulai, p.tanggal_selesai, p.total_hari, p.status
     FROM pengajuan_cuti p JOIN jenis_cuti j ON j.id = p.jenis_cuti_id
     WHERE p.user_id = $1 ORDER BY p.tanggal_pengajuan DESC, p.id DESC LIMIT 5`,
    [user.id]
  );
  const s = rows[0];

  return (
    <>
      <Hero user={user}>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/cuti?baru=1" className="inline-flex items-center gap-2 rounded-lg bg-[#FEFEFE] px-4 py-2 text-sm font-medium text-[#0450D5] shadow-sm transition hover:bg-[#CBDFFC]">
            <Plus size={16} /> Ajukan Cuti
          </Link>
          <Link href="/cuti" className="inline-flex items-center gap-2 rounded-lg bg-white/15 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/25">
            <History size={16} /> Riwayat Cuti
          </Link>
        </div>
      </Hero>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel ikon={CalendarCheck} judul="Sisa Kuota Cuti Tahunan" className="lg:col-span-2">
          <p className="text-3xl font-bold text-slate-900">
            {Number(s.sisa)} <span className="text-base font-medium text-slate-500">dari {Number(s.kuota_awal)} hari</span>
          </p>
          <div className="mt-3">
            <Progress sisa={Number(s.sisa)} total={Number(s.kuota_awal)} />
          </div>
          <p className="mt-2 text-xs text-slate-500">Termasuk pengajuan yang masih menunggu persetujuan, dihitung untuk tahun berjalan.</p>
        </Panel>
        <div className="grid gap-4">
          <StatCard judul="Cuti Sakit Diajukan" nilai={s.sakit} ikon={HeartPulse} tone="rose" />
          <StatCard judul="Total Pengajuan" nilai={s.total} ikon={FileText} tone="indigo" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard judul="Divisi" nilai={s.divisi || "-"} ikon={Building2} tone="sky" />
        <StatCard judul="Ketua Divisi" nilai={s.ketua || "-"} ikon={Crown} tone="slate" />
      </div>

      <Panel ikon={History} judul="Pengajuan Terbaru" aksi={<Lihat href="/cuti" />} flush>
        <TabelPengajuan rows={terbaru.rows} pemohon={false} />
      </Panel>
    </>
  );
}

async function DashboardKetua({ user }) {
  const div = await pool.query("SELECT id, nama FROM divisi WHERE ketua_id = $1", [user.id]);
  if (div.rows.length === 0) {
    return (
      <>
        <Hero user={user} />
        <p className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
          Kamu belum ditetapkan sebagai ketua divisi mana pun. Hubungi admin.
        </p>
      </>
    );
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
  const terbaru = await pool.query(
    `SELECT p.id, u.nama_lengkap, j.nama AS jenis, p.tanggal_mulai, p.tanggal_selesai, p.total_hari, p.status,
            h.nama_lengkap AS handover
     FROM pengajuan_cuti p
     JOIN users u ON u.id = p.user_id
     JOIN jenis_cuti j ON j.id = p.jenis_cuti_id
     LEFT JOIN users h ON h.id = p.handover_user_id
     WHERE u.divisi_id = $1 AND u.id <> $2
     ORDER BY p.tanggal_pengajuan DESC, p.id DESC LIMIT 5`,
    [divisiId, user.id]
  );

  return (
    <>
      <Hero user={user}>
        <p className="mt-1 text-sm text-[#CBDFFC]">Divisi {div.rows[0].nama}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/verifikasi" className="inline-flex items-center gap-2 rounded-lg bg-[#FEFEFE] px-4 py-2 text-sm font-medium text-[#0450D5] shadow-sm transition hover:bg-[#CBDFFC]">
            <ClipboardCheck size={16} /> Verifikasi Pengajuan
          </Link>
          <Link href="/cuti?baru=1" className="inline-flex items-center gap-2 rounded-lg bg-white/15 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/25">
            <Plus size={16} /> Ajukan Cuti Pribadi
          </Link>
        </div>
      </Hero>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard judul="Pengajuan Masuk" nilai={stat.rows[0].total} ikon={Inbox} tone="indigo" />
        <StatCard judul="Menunggu Verifikasi" nilai={stat.rows[0].pending} ikon={Clock} tone="amber" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel ikon={FileText} judul="Pengajuan Anggota Terbaru" aksi={<Lihat href="/verifikasi" />} className="lg:col-span-2" flush>
          <TabelPengajuan rows={terbaru.rows} handover />
        </Panel>
        <Panel ikon={Users} judul="Anggota Divisi">
          {anggota.rows.length === 0 ? (
            <p className="text-sm text-slate-400">Belum ada anggota.</p>
          ) : (
            <ul className="space-y-2.5 text-sm">
              {anggota.rows.map((a, i) => (
                <li key={i} className="flex items-center justify-between gap-2 text-slate-700">
                  <span className="flex items-center gap-2">
                    <UserRound size={14} className="text-slate-400" /> {a.nama_lengkap}
                  </span>
                  {a.cuti && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700 ring-1 ring-inset ring-sky-600/20">
                      <Plane size={12} /> Cuti minggu ini
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}

async function DashboardHrd({ user }) {
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
  const menunggu = await pool.query(`
    SELECT p.id, u.nama_lengkap, j.nama AS jenis, p.tanggal_mulai, p.tanggal_selesai, p.total_hari, p.status
    FROM pengajuan_cuti p JOIN users u ON u.id = p.user_id JOIN jenis_cuti j ON j.id = p.jenis_cuti_id
    WHERE p.status = 'approved_leader' OR (p.status = 'pending' AND u.role = 'ketua_divisi')
    ORDER BY p.tanggal_pengajuan, p.id LIMIT 5
  `);
  const terbaru = await pool.query(`
    SELECT p.id, u.nama_lengkap, j.nama AS jenis, p.tanggal_mulai, p.tanggal_selesai, p.total_hari, p.status
    FROM pengajuan_cuti p JOIN users u ON u.id = p.user_id JOIN jenis_cuti j ON j.id = p.jenis_cuti_id
    ORDER BY p.tanggal_pengajuan DESC, p.id DESC LIMIT 5
  `);

  return (
    <>
      <Hero user={user}>
        <div className="mt-4">
          <Link href="/verifikasi" className="inline-flex items-center gap-2 rounded-lg bg-[#FEFEFE] px-4 py-2 text-sm font-medium text-[#0450D5] shadow-sm transition hover:bg-[#CBDFFC]">
            <ClipboardCheck size={16} /> Buka Persetujuan Akhir
          </Link>
        </div>
      </Hero>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard judul="Pengajuan Bulan Ini" nilai={stat.rows[0].bulan_ini} ikon={CalendarDays} tone="indigo" />
        <StatCard judul="Menunggu Persetujuan Akhir" nilai={stat.rows[0].pending} ikon={Clock} tone="amber" />
      </div>

      <Panel ikon={Clock} judul="Menunggu Persetujuan Akhir" aksi={<Lihat href="/verifikasi" label="Proses" />} flush>
        <TabelPengajuan rows={menunggu.rows} />
      </Panel>

      <Panel ikon={FileText} judul="Pemantauan Pengajuan Terbaru" flush>
        <TabelPengajuan rows={terbaru.rows} />
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel ikon={Plane} judul="Karyawan Sedang Cuti Bulan Ini">
          <DaftarNama items={cuti.rows.map((r) => r.nama_lengkap)} kosong="Tidak ada yang cuti bulan ini." />
        </Panel>
        <Panel ikon={Building2} judul="Daftar Divisi">
          <DaftarNama
            items={divisi.rows.map((d) => `${d.nama} (ketua: ${d.ketua || "-"}, ${d.anggota} anggota)`)}
            kosong="Belum ada divisi."
          />
        </Panel>
      </div>
    </>
  );
}

export default async function DashboardPage() {
  const user = await requireUser();

  return (
    <main className={PAGE}>
      {user.role === "admin" && <DashboardAdmin user={user} />}
      {user.role === "user" && <DashboardKaryawan user={user} />}
      {user.role === "ketua_divisi" && <DashboardKetua user={user} />}
      {user.role === "hrd" && <DashboardHrd user={user} />}
    </main>
  );
}