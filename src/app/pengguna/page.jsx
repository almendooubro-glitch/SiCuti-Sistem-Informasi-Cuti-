import Link from "next/link";
import { Users, Plus, Filter, RotateCcw, UserCog } from "lucide-react";
import pool from "@/lib/db";
import { requireUser } from "@/lib/session";
import TombolKonfirmasi from "@/components/TombolKonfirmasi";
import {
  PAGE, LABEL_ROLE, Alert, Card, Field, PageHeader, RoleBadge, ActiveBadge, Kosong,
  btn, field, filterField, tgl, TABLE, TH, TD, TR,
} from "@/components/ui";
import { simpanPengguna, hapusPengguna } from "./actions";

export const dynamic = "force-dynamic";

const ORDER = {
  nama: "u.nama_lengkap",
  bergabung: "u.tanggal_bergabung DESC",
  divisi: "d.nama NULLS LAST, u.nama_lengkap",
};

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
    `SELECT u.id, u.username, u.email, u.nama_lengkap, u.role, u.is_active, u.kuota_awal,
            u.tanggal_bergabung, d.nama AS divisi
     FROM users u
     LEFT JOIN divisi d ON d.id = u.divisi_id
     ${where.length ? "WHERE " + where.join(" AND ") : ""}
     ORDER BY ${ORDER[sp.urut] || ORDER.nama}`,
    params
  );
  const divisi = (await pool.query("SELECT id, nama FROM divisi ORDER BY nama")).rows;

  return (
    <main className={PAGE}>
      <PageHeader ikon={Users} judul="Manajemen Pengguna" sub="Tambah pengguna baru, lalu kelola datanya lewat tombol Kelola" />
      <Alert error={sp.error} />

      <Card className="p-5">
        <form action={simpanPengguna} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <h2 className="col-span-full flex items-center gap-2 font-semibold text-slate-800">
            <Plus size={18} className="text-indigo-600" /> Tambah Pengguna
          </h2>
          <Field label="Username">
            <input name="username" placeholder="Username" required className={field} />
          </Field>
          <Field label="Email">
            <input name="email" type="email" placeholder="Email" required className={field} />
          </Field>
          <Field label="Nama lengkap">
            <input name="nama_lengkap" placeholder="Nama lengkap" required className={field} />
          </Field>
          <Field label="Password">
            <input name="password" type="password" placeholder="Minimal 6 karakter" required className={field} />
          </Field>
          <Field label="Role">
            <select name="role" defaultValue="user" className={field}>
              {Object.entries(LABEL_ROLE).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </Field>
          <Field label="Kuota cuti awal (hari)">
            <input name="kuota_awal" type="number" step="0.5" min="0" defaultValue={12} required className={field} />
          </Field>
          <input type="hidden" name="is_active" value="on" />
          <div className="col-span-full">
            <button type="submit" className={btn("primary")}>
              <Plus size={16} /> Tambah
            </button>
          </div>
        </form>
      </Card>

      <Card className="p-4">
        <form className="flex flex-wrap items-end gap-3">
          <select name="role" defaultValue={sp.role ?? ""} className={filterField}>
            <option value="">Semua role</option>
            {Object.entries(LABEL_ROLE).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          <select name="divisi" defaultValue={sp.divisi ?? ""} className={filterField}>
            <option value="">Semua divisi</option>
            {divisi.map((d) => (
              <option key={d.id} value={d.id}>{d.nama}</option>
            ))}
          </select>
          <select name="status" defaultValue={sp.status ?? ""} className={filterField}>
            <option value="">Semua status</option>
            <option value="aktif">Aktif</option>
            <option value="nonaktif">Tidak aktif</option>
          </select>
          <select name="masa" defaultValue={sp.masa ?? ""} className={filterField}>
            <option value="">Semua masa kerja</option>
            <option value="baru">&lt; 1 tahun</option>
            <option value="lama">&ge; 1 tahun</option>
          </select>
          <select name="urut" defaultValue={sp.urut ?? "nama"} className={filterField}>
            <option value="nama">Urut: Nama</option>
            <option value="bergabung">Urut: Tanggal bergabung</option>
            <option value="divisi">Urut: Divisi</option>
          </select>
          <button type="submit" className={btn("secondary")}><Filter size={16} /> Terapkan</button>
          <Link href="/pengguna" className={btn("ghost")}><RotateCcw size={14} /> Reset</Link>
        </form>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className={TABLE}>
            <thead>
              <tr>
                <th className={TH}>Nama</th><th className={TH}>Username</th><th className={TH}>Email</th>
                <th className={TH}>Role</th><th className={TH}>Divisi</th><th className={TH}>Bergabung</th>
                <th className={TH}>Status</th><th className={TH}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id} className={TR}>
                  <td className={`${TD} font-medium text-slate-900`}>{u.nama_lengkap}</td>
                  <td className={TD}>{u.username}</td>
                  <td className={TD}>{u.email}</td>
                  <td className={TD}><RoleBadge role={u.role} /></td>
                  <td className={TD}>{u.divisi || "-"}</td>
                  <td className={`${TD} whitespace-nowrap`}>{tgl(u.tanggal_bergabung)}</td>
                  <td className={TD}><ActiveBadge aktif={u.is_active} /></td>
                  <td className={TD}>
                    <div className="flex flex-wrap items-center gap-1">
                      <Link href={`/profil?id=${u.id}`} className={btn("ghost", "sm")}><UserCog size={14} /> Kelola</Link>
                      {(u.role === "user" || u.role === "ketua_divisi") && (
                        <TombolKonfirmasi
                          action={hapusPengguna}
                          fields={{ id: u.id }}
                          label="Hapus"
                          pesan={`Hapus ${u.nama_lengkap}? Akun beserta seluruh riwayat pengajuan cutinya akan terhapus permanen.`}
                          pesan2="Konfirmasi sekali lagi: data tidak bisa dikembalikan. Lanjutkan?"
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && <Kosong>Tidak ada pengguna.</Kosong>}
      </Card>
    </main>
  );
}