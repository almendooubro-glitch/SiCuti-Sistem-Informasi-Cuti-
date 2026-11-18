import Link from "next/link";
import { redirect } from "next/navigation";
import pool from "@/lib/db";
import { requireUser } from "@/lib/session";
import { simpanProfil } from "./actions";

export const dynamic = "force-dynamic";

const LABEL_ROLE = { admin: "Admin", user: "Karyawan", ketua_divisi: "Ketua Divisi", hrd: "HRD" };
const STATUS = {
  pending: "Pending",
  approved_leader: "Disetujui Ketua Divisi",
  approved: "Disetujui",
  rejected: "Ditolak",
  cancelled: "Dibatalkan",
};
const WARNA = {
  pending: "text-yellow-400",
  approved_leader: "text-sky-400",
  approved: "text-green-400",
  rejected: "text-red-400",
  cancelled: "text-slate-400",
};
const input = "border border-slate-600 bg-slate-800 text-white rounded px-3 py-2 w-full";
const tgl = (d) => new Date(d).toLocaleDateString("id-ID");

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
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{lain ? `Profil ${p.nama_lengkap}` : "Profil Saya"}</h1>
        {admin && (
          <Link href={`/pengguna?edit=${p.id}`} className="text-sm text-blue-500 hover:underline">
            Ubah role, status aktif, dan kuota awal
          </Link>
        )}
      </div>

      {sp.error && <p className="text-red-400">{sp.error}</p>}
      {sp.info && <p className="text-green-400">{sp.info}</p>}

      <section className="flex flex-wrap items-center gap-4 border border-slate-700 rounded-lg p-4">
        {p.ada_foto ? (
          <img src={`/api/foto?id=${p.id}`} alt={`Foto ${p.nama_lengkap}`} className="h-24 w-24 rounded-full object-cover" />
        ) : (
          <div className="h-24 w-24 rounded-full bg-slate-600 flex items-center justify-center text-3xl font-bold">
            {p.nama_lengkap[0]}
          </div>
        )}
        <div className="space-y-1 text-sm">
          <p className="text-lg font-semibold">{p.nama_lengkap}</p>
          <p>{LABEL_ROLE[p.role]}{p.divisi && ` · Divisi ${p.divisi}`}</p>
          <p className="text-slate-400">Bergabung {tgl(p.tanggal_bergabung)} · {p.is_active ? "Aktif" : "Tidak aktif"}</p>
        </div>
      </section>

      {punyaKuota && (
        <section className="grid grid-cols-3 gap-4">
          {[
            ["Kuota Tahunan", Number(p.kuota_awal)],
            ["Terpakai (termasuk pending)", Number(p.terpakai)],
            ["Sisa", sisa],
          ].map(([judul, nilai]) => (
            <div key={judul} className="border border-slate-700 rounded-lg p-4">
              <p className="text-sm text-slate-400">{judul}</p>
              <p className="text-2xl font-bold mt-1">{nilai} hari</p>
            </div>
          ))}
        </section>
      )}

      <form action={simpanProfil} className="grid grid-cols-1 md:grid-cols-2 gap-3 border border-slate-700 rounded-lg p-4">
        <h2 className="col-span-full font-semibold">Edit Data</h2>
        <input type="hidden" name="id" value={p.id} />
        <label className="space-y-1 text-sm">Nama lengkap
          <input name="nama_lengkap" defaultValue={p.nama_lengkap} required className={input} />
        </label>
        <label className="space-y-1 text-sm">Username
          <input name="username" defaultValue={p.username} required className={input} />
        </label>
        <label className="space-y-1 text-sm">Email
          <input name="email" type="email" defaultValue={p.email} required className={input} />
        </label>
        <label className="space-y-1 text-sm">Telepon
          <input name="telepon" inputMode="tel" defaultValue={p.telepon ?? ""} className={input} />
        </label>
        <label className="col-span-full space-y-1 text-sm">Alamat
          <textarea name="alamat" rows={2} defaultValue={p.alamat ?? ""} className={input} />
        </label>
        <label className="space-y-1 text-sm">Password baru (opsional)
          <input name="password" type="password" autoComplete="new-password" className={input} />
        </label>
        <label className="space-y-1 text-sm">Foto profil (JPG, PNG, WEBP, maks. 900 KB)
          <input name="foto" type="file" accept=".jpg,.jpeg,.png,.webp" className={input} />
        </label>
        {p.ada_foto && (
          <label className="col-span-full flex items-center gap-2 text-sm">
            <input type="checkbox" name="hapus_foto" /> Hapus foto profil
          </label>
        )}
        <div className="col-span-full">
          <button type="submit" className="bg-blue-600 text-white rounded px-4 py-2">Simpan</button>
        </div>
      </form>

      <section className="space-y-3">
        <h2 className="font-semibold">Riwayat Pengajuan Cuti</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="py-2">Jenis</th><th>Periode</th><th>Hari</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {riwayat.map((r) => (
                <tr key={r.id} className="border-b border-slate-800">
                  <td className="py-2">{r.jenis}</td>
                  <td>{tgl(r.tanggal_mulai)} - {tgl(r.tanggal_selesai)}</td>
                  <td>{Number(r.total_hari)}</td>
                  <td className={WARNA[r.status]}>{STATUS[r.status]}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {riwayat.length === 0 && <p className="text-slate-400 py-4">Belum ada pengajuan cuti.</p>}
        </div>
      </section>
    </main>
  );
}