import Link from "next/link";
import pool from "@/lib/db";
import { requireUser } from "@/lib/session";
import TombolKonfirmasi from "@/components/TombolKonfirmasi";
import { simpanPengguna, hapusPengguna } from "./actions";

export const dynamic = "force-dynamic";

const LABEL_ROLE = { admin: "Admin", user: "Karyawan", ketua_divisi: "Ketua Divisi", hrd: "HRD" };
const ORDER = {
  nama: "u.nama_lengkap",
  bergabung: "u.tanggal_bergabung DESC",
  divisi: "d.nama NULLS LAST, u.nama_lengkap",
};
const input = "border border-slate-600 bg-slate-800 text-white rounded px-3 py-2";

export default async function PenggunaPage({ searchParams }) {
  await requireUser(["admin"]);
  const sp = await searchParams;

  const where = [];
  const params = [];
  if (sp.role) {
    params.push(sp.role);
    where.push(`u.role = $${params.length}`);
  }
  if (Number.isInteger(Number(sp.divisi)) && sp.divisi) {
    params.push(Number(sp.divisi));
    where.push(`u.divisi_id = $${params.length}`);
  }
  if (sp.status === "aktif") where.push("u.is_active");
  if (sp.status === "nonaktif") where.push("NOT u.is_active");
  if (sp.masa === "baru") where.push("u.tanggal_bergabung > CURRENT_DATE - INTERVAL '1 year'");
  if (sp.masa === "lama") where.push("u.tanggal_bergabung <= CURRENT_DATE - INTERVAL '1 year'");

  const { rows } = await pool.query(
    `SELECT u.*, d.nama AS divisi FROM users u
     LEFT JOIN divisi d ON d.id = u.divisi_id
     ${where.length ? "WHERE " + where.join(" AND ") : ""}
     ORDER BY ${ORDER[sp.urut] || ORDER.nama}`,
    params
  );
  const divisi = (await pool.query("SELECT id, nama FROM divisi ORDER BY nama")).rows;
  const edit = sp.edit ? rows.find((u) => u.id === Number(sp.edit)) ||
    (await pool.query("SELECT * FROM users WHERE id = $1", [Number(sp.edit) || 0])).rows[0] : null;

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Manajemen Pengguna</h1>
      {sp.error && <p className="text-red-400">{sp.error}</p>}

      <form key={edit?.id ?? "baru"} action={simpanPengguna} className="grid grid-cols-2 md:grid-cols-4 gap-3 border border-slate-700 rounded-lg p-4">
        <h2 className="col-span-full font-semibold">
          {edit ? `Edit Pengguna #${edit.id}` : "Tambah Pengguna"}
        </h2>
        <input type="hidden" name="id" value={edit?.id ?? ""} />
        <input name="username" placeholder="Username" defaultValue={edit?.username} required className={input} />
        <input name="email" type="email" placeholder="Email" defaultValue={edit?.email} required className={input} />
        <input name="nama_lengkap" placeholder="Nama lengkap" defaultValue={edit?.nama_lengkap} required className={input} />
        <input name="password" type="password" placeholder={edit ? "Password baru (opsional)" : "Password"} required={!edit} className={input} />
        <select name="role" defaultValue={edit?.role ?? "user"} className={input}>
          {Object.entries(LABEL_ROLE).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <input name="kuota_awal" type="number" step="0.5" min="0" defaultValue={edit?.kuota_awal ?? 12} required className={input} />
        {edit && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="is_active" defaultChecked={edit.is_active} /> Aktif
          </label>
        )}
        {!edit && <input type="hidden" name="is_active" value="on" />}
        <div className="col-span-full flex gap-3">
          <button type="submit" className="bg-blue-600 text-white rounded px-4 py-2">
            {edit ? "Simpan Perubahan" : "Tambah"}
          </button>
          {edit && <Link href="/pengguna" className="px-4 py-2 hover:underline">Batal</Link>}
        </div>
      </form>

      <form className="flex flex-wrap gap-2 items-center">
        <select name="role" defaultValue={sp.role ?? ""} className={input}>
          <option value="">Semua role</option>
          {Object.entries(LABEL_ROLE).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <select name="divisi" defaultValue={sp.divisi ?? ""} className={input}>
          <option value="">Semua divisi</option>
          {divisi.map((d) => (
            <option key={d.id} value={d.id}>{d.nama}</option>
          ))}
        </select>
        <select name="status" defaultValue={sp.status ?? ""} className={input}>
          <option value="">Semua status</option>
          <option value="aktif">Aktif</option>
          <option value="nonaktif">Tidak aktif</option>
        </select>
        <select name="masa" defaultValue={sp.masa ?? ""} className={input}>
          <option value="">Semua masa kerja</option>
          <option value="baru">&lt; 1 tahun</option>
          <option value="lama">&ge; 1 tahun</option>
        </select>
        <select name="urut" defaultValue={sp.urut ?? "nama"} className={input}>
          <option value="nama">Urut: Nama</option>
          <option value="bergabung">Urut: Tanggal bergabung</option>
          <option value="divisi">Urut: Divisi</option>
        </select>
        <button type="submit" className="bg-slate-600 text-white rounded px-4 py-2">Terapkan</button>
        <Link href="/pengguna" className="hover:underline text-sm">Reset</Link>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="py-2">Nama</th><th>Username</th><th>Email</th><th>Role</th>
              <th>Divisi</th><th>Bergabung</th><th>Status</th><th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id} className="border-b border-slate-800">
                <td className="py-2">{u.nama_lengkap}</td>
                <td>{u.username}</td>
                <td>{u.email}</td>
                <td>{LABEL_ROLE[u.role]}</td>
                <td>{u.divisi || "-"}</td>
                <td>{new Date(u.tanggal_bergabung).toLocaleDateString("id-ID")}</td>
                <td>{u.is_active ? "Aktif" : "Tidak aktif"}</td>
                <td>
                  <div className="flex gap-3">
                    <Link href={`/pengguna?edit=${u.id}`} className="text-blue-500 hover:underline">Edit</Link>
                    {(u.role === "user" || u.role === "ketua_divisi") && (
                      <TombolKonfirmasi
                        action={hapusPengguna}
                        fields={{ id: u.id }}
                        label="Hapus"
                        pesan={`Yakin hapus ${u.nama_lengkap}?`}
                      />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="text-slate-400 py-4">Tidak ada pengguna.</p>}
      </div>
    </main>
  );
}