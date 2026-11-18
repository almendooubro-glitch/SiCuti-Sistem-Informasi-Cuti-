import Link from "next/link";
import { Building2, Plus, Save, Filter, RotateCcw, Pencil, Eye, UserPlus, Users } from "lucide-react";
import pool from "@/lib/db";
import { requireUser } from "@/lib/session";
import TombolKonfirmasi from "@/components/TombolKonfirmasi";
import {
  PAGE, Alert, Card, Field, PageHeader, Panel, RoleBadge, ActiveBadge, Kosong,
  btn, field, filterField, tgl, TABLE, TH, TD, TR,
} from "@/components/ui";
import { simpanDivisi, hapusDivisi, tambahAnggota, hapusAnggota } from "./actions";

export const dynamic = "force-dynamic";

const ORDER = {
  nama_asc: "d.nama ASC",
  nama_desc: "d.nama DESC",
  anggota: "anggota DESC",
  dibuat: "d.dibuat_pada DESC",
};

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
    <main className={PAGE}>
      <PageHeader ikon={Building2} judul="Manajemen Divisi" sub="Kelola divisi, ketua divisi, dan anggotanya" />
      <Alert error={sp.error} />

      <Card className="p-5">
        <form key={edit?.id ?? "baru"} action={simpanDivisi} className="grid gap-4 md:grid-cols-3">
          <h2 className="col-span-full flex items-center gap-2 font-semibold text-slate-800">
            {edit ? <Pencil size={18} className="text-indigo-600" /> : <Plus size={18} className="text-indigo-600" />}
            {edit ? `Edit Divisi #${edit.id}` : "Tambah Divisi"}
          </h2>
          <input type="hidden" name="id" value={edit?.id ?? ""} />
          <Field label="Nama divisi">
            <input name="nama" placeholder="Nama divisi" defaultValue={edit?.nama} required className={field} />
          </Field>
          <Field label="Deskripsi (opsional)">
            <input name="deskripsi" placeholder="Deskripsi singkat" defaultValue={edit?.deskripsi ?? ""} className={field} />
          </Field>
          <Field label="Ketua divisi">
            <select name="ketua_id" defaultValue={edit?.ketua_id ?? ""} required className={field}>
              <option value="">Pilih ketua divisi</option>
              {ketuaOpsi.map((k) => (
                <option key={k.id} value={k.id}>{k.nama_lengkap}</option>
              ))}
            </select>
          </Field>
          <div className="col-span-full flex flex-wrap gap-2">
            <button type="submit" className={btn("primary")}>
              {edit ? <Save size={16} /> : <Plus size={16} />} {edit ? "Simpan Perubahan" : "Tambah"}
            </button>
            {edit && <Link href="/divisi" className={btn("secondary")}>Batal</Link>}
          </div>
        </form>
      </Card>

      <Card className="p-4">
        <form className="flex flex-wrap items-end gap-3">
          <input name="nama" placeholder="Cari nama divisi" defaultValue={sp.nama ?? ""} className={filterField} />
          <input name="ketua" placeholder="Cari ketua" defaultValue={sp.ketua ?? ""} className={filterField} />
          <input name="min" type="number" min="0" placeholder="Min. anggota" defaultValue={sp.min ?? ""} className={`${field} sm:w-36`} />
          <select name="urut" defaultValue={sp.urut ?? "nama_asc"} className={filterField}>
            <option value="nama_asc">Nama A–Z</option>
            <option value="nama_desc">Nama Z–A</option>
            <option value="anggota">Jumlah anggota</option>
            <option value="dibuat">Tanggal dibuat</option>
          </select>
          <button type="submit" className={btn("secondary")}><Filter size={16} /> Terapkan</button>
          <Link href="/divisi" className={btn("ghost")}><RotateCcw size={14} /> Reset</Link>
        </form>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className={TABLE}>
            <thead>
              <tr>
                <th className={TH}>Divisi</th><th className={TH}>Ketua</th><th className={TH}>Anggota</th>
                <th className={TH}>Dibentuk</th><th className={TH}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => (
                <tr key={d.id} className={TR}>
                  <td className={`${TD} font-medium text-slate-900`}>{d.nama}</td>
                  <td className={TD}>{d.ketua || "-"}</td>
                  <td className={TD}>{d.anggota}</td>
                  <td className={`${TD} whitespace-nowrap`}>{tgl(d.dibuat_pada)}</td>
                  <td className={TD}>
                    <div className="flex flex-wrap items-center gap-1">
                      <Link href={`/divisi?detail=${d.id}`} className={btn("ghost", "sm")}><Eye size={14} /> Detail</Link>
                      <Link href={`/divisi?edit=${d.id}`} className={btn("ghost", "sm")}><Pencil size={14} /> Edit</Link>
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
        </div>
        {rows.length === 0 && <Kosong>Belum ada divisi.</Kosong>}
      </Card>

      {detail && (
        <Panel ikon={Users} judul={`Anggota Divisi ${detail.nama}`}>
          <div className="space-y-4">
            <form action={tambahAnggota} className="flex flex-wrap items-end gap-3">
              <input type="hidden" name="divisi_id" value={detail.id} />
              <select name="user_id" required className={filterField}>
                <option value="">Pilih karyawan tanpa divisi</option>
                {kandidat.map((k) => (
                  <option key={k.id} value={k.id}>{k.nama_lengkap}</option>
                ))}
              </select>
              <button type="submit" className={btn("primary")}><UserPlus size={16} /> Tambah Anggota</button>
            </form>
            <ul className="divide-y divide-slate-100 text-sm">
              {anggota.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                  <span className="flex flex-wrap items-center gap-2 font-medium text-slate-800">
                    {a.nama_lengkap} <RoleBadge role={a.role} /> <ActiveBadge aktif={a.is_active} />
                  </span>
                  {a.role === "user" && (
                    <TombolKonfirmasi
                      action={hapusAnggota}
                      fields={{ user_id: a.id, divisi_id: detail.id }}
                      label="Keluarkan"
                      ikon="keluar"
                      pesan={`Keluarkan ${a.nama_lengkap} dari divisi?`}
                    />
                  )}
                </li>
              ))}
            </ul>
            {anggota.length === 0 && <p className="text-sm text-slate-400">Belum ada anggota.</p>}
          </div>
        </Panel>
      )}
    </main>
  );
}