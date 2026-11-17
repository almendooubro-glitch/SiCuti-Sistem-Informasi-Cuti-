import Link from "next/link";
import pool from "@/lib/db";
import { requireUser } from "@/lib/session";
import TombolKonfirmasi from "@/components/TombolKonfirmasi";
import { simpanDivisi, hapusDivisi, tambahAnggota, hapusAnggota } from "./actions";

export const dynamic = "force-dynamic";

const LABEL_ROLE = { admin: "Admin", user: "Karyawan", ketua_divisi: "Ketua Divisi", hrd: "HRD" };
const ORDER = {
  nama_asc: "d.nama ASC",
  nama_desc: "d.nama DESC",
  anggota: "anggota DESC",
  dibuat: "d.dibuat_pada DESC",
};
const input = "border border-slate-600 bg-slate-800 text-white rounded px-3 py-2";

export default async function DivisiPage({ searchParams }) {
  await requireUser(["admin"]);
  const sp = await searchParams;
  const editId = Number(sp.edit) || 0;
  const detailId = Number(sp.detail) || 0;

  const { rows } = await pool.query(
    `SELECT d.id, d.nama, d.deskripsi, d.dibuat_pada, k.nama_lengkap AS ketua,
            (SELECT COUNT(*) FROM users WHERE divisi_id = d.id)::int AS anggota
     FROM divisi d LEFT JOIN users k ON k.id = d.ketua_id
     WHERE d.nama ILIKE $1 AND COALESCE(k.nama_lengkap, '') ILIKE $2
       AND (SELECT COUNT(*) FROM users WHERE divisi_id = d.id) >= $3
     ORDER BY ${ORDER[sp.urut] || ORDER.nama_asc}`,
    [`%${sp.nama || ""}%`, `%${sp.ketua || ""}%`, Number(sp.min) || 0]
  );

  const ketuaOpsi = (
    await pool.query(
      `SELECT id, nama_lengkap FROM users
       WHERE role = 'ketua_divisi' AND is_active
         AND id NOT IN (SELECT ketua_id FROM divisi WHERE ketua_id IS NOT NULL AND id <> $1)
       ORDER BY nama_lengkap`,
      [editId]
    )
  ).rows;
  const edit = editId
    ? (await pool.query("SELECT * FROM divisi WHERE id = $1", [editId])).rows[0]
    : null;

  let detail = null;
  let anggota = [];
  let kandidat = [];
  if (detailId) {
    detail = (await pool.query("SELECT id, nama FROM divisi WHERE id = $1", [detailId])).rows[0];
    anggota = (
      await pool.query(
        "SELECT id, nama_lengkap, role, is_active FROM users WHERE divisi_id = $1 ORDER BY role, nama_lengkap",
        [detailId]
      )
    ).rows;
    kandidat = (
      await pool.query(
        "SELECT id, nama_lengkap FROM users WHERE role = 'user' AND is_active AND divisi_id IS NULL ORDER BY nama_lengkap"
      )
    ).rows;
  }

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Manajemen Divisi</h1>
      {sp.error && <p className="text-red-400">{sp.error}</p>}

      <form key={edit?.id ?? "baru"} action={simpanDivisi} className="grid grid-cols-1 md:grid-cols-3 gap-3 border border-slate-700 rounded-lg p-4">
        <h2 className="col-span-full font-semibold">{edit ? `Edit Divisi #${edit.id}` : "Tambah Divisi"}</h2>
        <input type="hidden" name="id" value={edit?.id ?? ""} />
        <input name="nama" placeholder="Nama divisi" defaultValue={edit?.nama} required className={input} />
        <input name="deskripsi" placeholder="Deskripsi (opsional)" defaultValue={edit?.deskripsi ?? ""} className={input} />
        <select name="ketua_id" defaultValue={edit?.ketua_id ?? ""} required className={input}>
          <option value="">Pilih ketua divisi</option>
          {ketuaOpsi.map((k) => (
            <option key={k.id} value={k.id}>{k.nama_lengkap}</option>
          ))}
        </select>
        <div className="col-span-full flex gap-3">
          <button type="submit" className="bg-blue-600 text-white rounded px-4 py-2">
            {edit ? "Simpan Perubahan" : "Tambah"}
          </button>
          {edit && <Link href="/divisi" className="px-4 py-2 hover:underline">Batal</Link>}
        </div>
      </form>

      <form className="flex flex-wrap gap-2 items-center">
        <input name="nama" placeholder="Cari nama divisi" defaultValue={sp.nama ?? ""} className={input} />
        <input name="ketua" placeholder="Cari ketua" defaultValue={sp.ketua ?? ""} className={input} />
        <input name="min" type="number" min="0" placeholder="Min. anggota" defaultValue={sp.min ?? ""} className={`${input} w-32`} />
        <select name="urut" defaultValue={sp.urut ?? "nama_asc"} className={input}>
          <option value="nama_asc">Nama A–Z</option>
          <option value="nama_desc">Nama Z–A</option>
          <option value="anggota">Jumlah anggota</option>
          <option value="dibuat">Tanggal dibuat</option>
        </select>
        <button type="submit" className="bg-slate-600 text-white rounded px-4 py-2">Terapkan</button>
        <Link href="/divisi" className="hover:underline text-sm">Reset</Link>
      </form>

      <table className="w-full text-left text-sm border-collapse">
        <thead>
          <tr className="border-b border-slate-700">
            <th className="py-2">Divisi</th><th>Ketua</th><th>Anggota</th><th>Dibentuk</th><th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((d) => (
            <tr key={d.id} className="border-b border-slate-800">
              <td className="py-2">{d.nama}</td>
              <td>{d.ketua || "-"}</td>
              <td>{d.anggota}</td>
              <td>{new Date(d.dibuat_pada).toLocaleDateString("id-ID")}</td>
              <td>
                <div className="flex gap-3">
                  <Link href={`/divisi?detail=${d.id}`} className="text-blue-500 hover:underline">Detail</Link>
                  <Link href={`/divisi?edit=${d.id}`} className="text-blue-500 hover:underline">Edit</Link>
                  <TombolKonfirmasi
                    action={hapusDivisi}
                    fields={{ id: d.id }}
                    label="Hapus"
                    pesan={`Hapus divisi ${d.nama}? Anggotanya akan kehilangan divisi.`}
                    pesan2="Konfirmasi sekali lagi: divisi benar-benar dihapus?"
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <p className="text-slate-400">Belum ada divisi.</p>}

      {detail && (
        <section className="border border-slate-700 rounded-lg p-4 space-y-3">
          <h2 className="font-semibold">Anggota Divisi {detail.nama}</h2>
          <form action={tambahAnggota} className="flex gap-2">
            <input type="hidden" name="divisi_id" value={detail.id} />
            <select name="user_id" required className={input}>
              <option value="">Pilih karyawan tanpa divisi</option>
              {kandidat.map((k) => (
                <option key={k.id} value={k.id}>{k.nama_lengkap}</option>
              ))}
            </select>
            <button type="submit" className="bg-blue-600 text-white rounded px-4 py-2">Tambah Anggota</button>
          </form>
          <ul className="text-sm space-y-2">
            {anggota.map((a) => (
              <li key={a.id} className="flex items-center gap-3">
                <span>
                  {a.nama_lengkap} · {LABEL_ROLE[a.role]} · {a.is_active ? "Aktif" : "Tidak aktif"}
                </span>
                {a.role === "user" && (
                  <TombolKonfirmasi
                    action={hapusAnggota}
                    fields={{ user_id: a.id, divisi_id: detail.id }}
                    label="Keluarkan"
                    pesan={`Keluarkan ${a.nama_lengkap} dari divisi?`}
                  />
                )}
              </li>
            ))}
          </ul>
          {anggota.length === 0 && <p className="text-slate-400 text-sm">Belum ada anggota.</p>}
        </section>
      )}
    </main>
  );
}