import Link from "next/link";
import { Tags, Plus, Save, Pencil, Paperclip } from "lucide-react";
import pool from "@/lib/db";
import { requireUser } from "@/lib/session";
import { PAGE, Alert, Card, Field, PageHeader, btn, field, TABLE, TH, TD, TR } from "@/components/KomponenUmum";
import { simpanJenisCuti } from "./actions";

export const dynamic = "force-dynamic";

const cek = "h-4 w-4 rounded border-[#54B7FD] text-[#0450D5] focus:ring-[#2893FC]";

export default async function JenisCutiPage({ searchParams }) {
  await requireUser(["admin"]);
  const sp = await searchParams;

  const { rows } = await pool.query("SELECT * FROM jenis_cuti ORDER BY id");
  const edit = rows.find((j) => j.id === Number(sp.edit));

  return (
    <main className={PAGE}>
      <PageHeader ikon={Tags} judul="Manajemen Jenis Cuti" sub="Atur kuota, batas pengajuan, lampiran, dan pemotongan kuota" />
      <Alert error={sp.error} />

      <Card className="p-5">
        <form key={edit?.id ?? "baru"} action={simpanJenisCuti} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <h2 className="col-span-full flex items-center gap-2 font-semibold text-slate-800">
            {edit ? <Pencil size={18} className="text-[#0450D5] dark:text-[#54B7FD]" /> : <Plus size={18} className="text-[#0450D5] dark:text-[#54B7FD]" />}
            {edit ? `Edit Jenis Cuti #${edit.id}` : "Tambah Jenis Cuti"}
          </h2>
          <input type="hidden" name="id" value={edit?.id ?? ""} />
          <Field label="Nama jenis cuti">
            <input name="nama" placeholder="Nama jenis cuti" defaultValue={edit?.nama} required className={field} />
          </Field>
          <Field label="Kuota (hari)">
            <input name="kuota" type="number" step="0.5" min="0" placeholder="Kosong = tanpa batas" defaultValue={edit?.kuota ?? ""} className={field} />
          </Field>
          <span className="hidden lg:block" />
          <Field label="Minimal diajukan H-n sebelum mulai">
            <input name="min_hari_sebelum" type="number" min="0" defaultValue={edit?.min_hari_sebelum ?? 0} className={field} />
          </Field>
          <Field label="Maksimal diajukan n hari setelah mulai">
            <input name="maks_hari_sesudah" type="number" min="0" defaultValue={edit?.maks_hari_sesudah ?? 0} className={field} />
          </Field>
          <div className="flex flex-col justify-end gap-2 pb-1 text-sm font-medium text-slate-700">
            <label className="flex items-center gap-2">
              <input type="checkbox" name="wajib_lampiran" defaultChecked={edit?.wajib_lampiran} className={cek} /> Wajib lampiran
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="memotong_kuota" defaultChecked={edit?.memotong_kuota} className={cek} /> Memotong kuota tahunan
            </label>
          </div>
          <div className="col-span-full flex flex-wrap gap-2">
            <button type="submit" className={btn("primary")}>
              {edit ? <Save size={16} /> : <Plus size={16} />} {edit ? "Simpan Perubahan" : "Tambah"}
            </button>
            {edit && <Link href="/jenis-cuti" className={btn("secondary")}>Batal</Link>}
          </div>
        </form>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className={TABLE}>
            <thead>
              <tr>
                <th className={TH}>Jenis Cuti</th><th className={TH}>Kuota</th><th className={TH}>Lampiran</th>
                <th className={TH}>Potong Kuota</th><th className={TH}>Min. H-</th><th className={TH}>Maks. H+</th>
                <th className={TH}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((j) => (
                <tr key={j.id} className={TR}>
                  <td className={`${TD} font-medium text-slate-900`}>{j.nama}</td>
                  <td className={TD}>{j.kuota ?? "Tanpa batas"}</td>
                  <td className={TD}>
                    {j.wajib_lampiran ? (
                      <span className="inline-flex items-center gap-1 text-amber-700"><Paperclip size={14} /> Wajib</span>
                    ) : "Tidak"}
                  </td>
                  <td className={TD}>{j.memotong_kuota ? "Ya" : "Tidak"}</td>
                  <td className={TD}>{j.min_hari_sebelum}</td>
                  <td className={TD}>{j.maks_hari_sesudah}</td>
                  <td className={TD}>
                    <Link href={`/jenis-cuti?edit=${j.id}`} className={btn("ghost", "sm")}><Pencil size={14} /> Edit</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </main>
  );
}