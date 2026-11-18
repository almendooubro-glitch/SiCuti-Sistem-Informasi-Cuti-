import Link from "next/link";
import { redirect } from "next/navigation";
import { CircleUser, Settings, Save, Pencil, History } from "lucide-react";
import pool from "@/lib/db";
import { requireUser } from "@/lib/session";
import {
  PAGE, Alert, Avatar, Badge, Card, Field, Kosong, PageHeader, Panel, Progress, RoleBadge, ActiveBadge,
  btn, field, tgl, TABLE, TH, TD, TR,
} from "@/components/ui";
import { simpanProfil } from "./actions";

export const dynamic = "force-dynamic";

export default async function ProfilPage({ searchParams }) {
  const me = await requireUser();
  const sp = await searchParams;
  const admin = me.role === "admin";
  const id = admin && Number(sp.id) ? Number(sp.id) : me.id;

  const { rows } = await pool.query(
    `SELECT u.id, u.username, u.email, u.nama_lengkap, u.role, u.telepon, u.alamat,
            u.kuota_awal, u.is_active, u.tanggal_bergabung, (u.foto_data IS NOT NULL) AS ada_foto,
            d.nama AS divisi,
            COALESCE((
              SELECT SUM(x.total_hari) FROM pengajuan_cuti x JOIN jenis_cuti j ON j.id = x.jenis_cuti_id
              WHERE x.user_id = u.id AND j.memotong_kuota
                AND EXTRACT(YEAR FROM x.tanggal_mulai) = EXTRACT(YEAR FROM CURRENT_DATE)
                AND x.status IN ('pending','approved_leader','approved')), 0) AS terpakai
     FROM users u LEFT JOIN divisi d ON d.id = u.divisi_id
     WHERE u.id = $1`,
    [id]
  );
  const p = rows[0];
  if (!p) redirect("/profil");

  const riwayat = (
    await pool.query(
      `SELECT x.id, j.nama AS jenis, x.tanggal_mulai, x.tanggal_selesai, x.total_hari, x.status
       FROM pengajuan_cuti x JOIN jenis_cuti j ON j.id = x.jenis_cuti_id
       WHERE x.user_id = $1 ORDER BY x.tanggal_pengajuan DESC, x.id DESC LIMIT 20`,
      [id]
    )
  ).rows;

  const punyaKuota = p.role === "user" || p.role === "ketua_divisi";
  const sisa = Number(p.kuota_awal) - Number(p.terpakai);
  const lain = id !== me.id;

  return (
    <main className={`${PAGE} max-w-4xl`}>
      <PageHeader ikon={CircleUser} judul={lain ? `Profil ${p.nama_lengkap}` : "Profil Saya"} sub="Data diri, kuota cuti, dan riwayat pengajuan">
        {admin && (
          <Link href={`/pengguna?edit=${p.id}`} className={btn("ghost")}>
            <Settings size={14} /> Ubah role, status aktif, dan kuota awal
          </Link>
        )}
      </PageHeader>

      <Alert error={sp.error} info={sp.info} />

      <Card className="flex flex-wrap items-center gap-5 p-5">
        <Avatar id={p.id} ada={p.ada_foto} nama={p.nama_lengkap} size="h-24 w-24" teks="text-3xl" />
        <div className="space-y-2">
          <p className="text-xl font-semibold text-slate-900">{p.nama_lengkap}</p>
          <div className="flex flex-wrap items-center gap-2">
            <RoleBadge role={p.role} />
            <ActiveBadge aktif={p.is_active} />
            {p.divisi && <span className="text-sm text-slate-600">Divisi {p.divisi}</span>}
          </div>
          <p className="text-sm text-slate-500">{p.email} · Bergabung {tgl(p.tanggal_bergabung)}</p>
        </div>
      </Card>

      {punyaKuota && (
        <Panel ikon={History} judul="Kuota Cuti Tahunan">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ["Kuota Tahunan", Number(p.kuota_awal)],
              ["Terpakai (termasuk pending)", Number(p.terpakai)],
              ["Sisa", sisa],
            ].map(([judul, nilai]) => (
              <div key={judul}>
                <p className="text-sm text-slate-500">{judul}</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{nilai} hari</p>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <Progress sisa={sisa} total={Number(p.kuota_awal)} />
          </div>
        </Panel>
      )}

      <Card className="p-5">
        <form action={simpanProfil} className="grid gap-4 md:grid-cols-2">
          <h2 className="col-span-full flex items-center gap-2 font-semibold text-slate-800">
            <Pencil size={18} className="text-indigo-600" /> Edit Data
          </h2>
          <input type="hidden" name="id" value={p.id} />
          <Field label="Nama lengkap">
            <input name="nama_lengkap" defaultValue={p.nama_lengkap} required className={field} />
          </Field>
          <Field label="Username">
            <input name="username" defaultValue={p.username} required className={field} />
          </Field>
          <Field label="Email">
            <input name="email" type="email" defaultValue={p.email} required className={field} />
          </Field>
          <Field label="Telepon">
            <input name="telepon" inputMode="tel" defaultValue={p.telepon ?? ""} className={field} />
          </Field>
          <Field label="Alamat" className="col-span-full">
            <textarea name="alamat" rows={2} defaultValue={p.alamat ?? ""} className={field} />
          </Field>
          <Field label="Password baru (opsional)">
            <input name="password" type="password" autoComplete="new-password" className={field} />
          </Field>
          <Field label="Foto profil (JPG, PNG, WEBP, maks. 900 KB)">
            <input name="foto" type="file" accept=".jpg,.jpeg,.png,.webp" className={field} />
          </Field>
          {p.ada_foto && (
            <label className="col-span-full flex items-center gap-2 text-sm font-medium text-slate-700">
              <input type="checkbox" name="hapus_foto" className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500" />
              Hapus foto profil
            </label>
          )}
          <div className="col-span-full">
            <button type="submit" className={btn("primary")}><Save size={16} /> Simpan</button>
          </div>
        </form>
      </Card>

      <Panel ikon={History} judul="Riwayat Pengajuan Cuti" flush>
        <div className="overflow-x-auto">
          <table className={TABLE}>
            <thead>
              <tr>
                <th className={TH}>Jenis</th><th className={TH}>Periode</th><th className={TH}>Hari</th><th className={TH}>Status</th>
              </tr>
            </thead>
            <tbody>
              {riwayat.map((r) => (
                <tr key={r.id} className={TR}>
                  <td className={`${TD} font-medium text-slate-900`}>{r.jenis}</td>
                  <td className={`${TD} whitespace-nowrap`}>{tgl(r.tanggal_mulai)} - {tgl(r.tanggal_selesai)}</td>
                  <td className={TD}>{Number(r.total_hari)}</td>
                  <td className={TD}><Badge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {riwayat.length === 0 && <Kosong>Belum ada pengajuan cuti.</Kosong>}
      </Panel>
    </main>
  );
}