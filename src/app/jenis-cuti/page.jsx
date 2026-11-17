import Link from "next/link";
import pool from "@/lib/db";
import { requireUser } from "@/lib/session";
import { simpanJenisCuti } from "./actions";

export const dynamic = "force-dynamic";

const input = "border border-slate-600 bg-slate-800 text-white rounded px-3 py-2";

export default async function JenisCutiPage({ searchParams }) {
  await requireUser(["admin"]);
  const sp = await searchParams;

  const { rows } = await pool.query("SELECT * FROM jenis_cuti ORDER BY id");
  const edit = rows.find((j) => j.id === Number(sp.edit));

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Manajemen Jenis Cuti</h1>
      {sp.error && <p className="text-red-400">{sp.error}</p>}

      <form key={edit?.id ?? "baru"} action={simpanJenisCuti} className="grid grid-cols-2 md:grid-cols-3 gap-3 border border-slate-700 rounded-lg p-4">
        <h2 className="col-span-full font-semibold">
          {edit ? `Edit Jenis Cuti #${edit.id}` : "Tambah Jenis Cuti"}
        </h2>
        <input type="hidden" name="id" value={edit?.id ?? ""} />
        <input name="nama" placeholder="Nama jenis cuti" defaultValue={edit?.nama} required className={input} />
        <input name="kuota" type="number" step="0.5" min="0" placeholder="Kuota hari (kosong = tanpa batas)" defaultValue={edit?.kuota ?? ""} className={input} />
        <input name="min_hari_sebelum" type="number" min="0" defaultValue={edit?.min_hari_sebelum ?? 0} title="Minimal diajukan berapa hari sebelum mulai" className={input} />
        <input name="maks_hari_sesudah" type="number" min="0" defaultValue={edit?.maks_hari_sesudah ?? 0} title="Maksimal diajukan berapa hari setelah mulai" className={input} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="wajib_lampiran" defaultChecked={edit?.wajib_lampiran} /> Wajib lampiran
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="memotong_kuota" defaultChecked={edit?.memotong_kuota} /> Memotong kuota tahunan
        </label>
        <p className="col-span-full text-xs text-slate-400">
          Kolom 3 = minimal hari sebelum mulai (H-n), kolom 4 = maksimal hari setelah mulai.
        </p>
        <div className="col-span-full flex gap-3">
          <button type="submit" className="bg-blue-600 text-white rounded px-4 py-2">
            {edit ? "Simpan Perubahan" : "Tambah"}
          </button>
          {edit && <Link href="/jenis-cuti" className="px-4 py-2 hover:underline">Batal</Link>}
        </div>
      </form>

      <table className="w-full text-left text-sm border-collapse">
        <thead>
          <tr className="border-b border-slate-700">
            <th className="py-2">Jenis Cuti</th><th>Kuota</th><th>Lampiran</th>
            <th>Potong Kuota</th><th>Min. H-</th><th>Maks. H+</th><th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((j) => (
            <tr key={j.id} className="border-b border-slate-800">
              <td className="py-2">{j.nama}</td>
              <td>{j.kuota ?? "Tanpa batas"}</td>
              <td>{j.wajib_lampiran ? "Wajib" : "Tidak"}</td>
              <td>{j.memotong_kuota ? "Ya" : "Tidak"}</td>
              <td>{j.min_hari_sebelum}</td>
              <td>{j.maks_hari_sesudah}</td>
              <td>
                <Link href={`/jenis-cuti?edit=${j.id}`} className="text-blue-500 hover:underline">Edit</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}