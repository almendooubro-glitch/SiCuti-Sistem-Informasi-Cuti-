import Link from "next/link";
import { Users, Plus, Filter, RotateCcw, UserCog, SlidersHorizontal } from "lucide-react";
import pool from "@/lib/db";
import { requireUser } from "@/lib/session";
import TombolKonfirmasi from "@/components/TombolKonfirmasi";
import {
  PAGE, LABEL_ROLE, Alert, Card, Field, PageHeader, RoleBadge, ActiveBadge, Kosong,
  btn, field, filterField, tgl, TABLE, TH, TD, TR,
} from "@/components/KomponenUmum";
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
      <PageHeader
        ikon={Users}
        judul="Manajemen Pengguna"
        sub="Tambah akun Admin atau pengguna lain, lalu kelola datanya lewat tombol Kelola"
      />
      <Alert error={sp.error} info={sp.info} />

      <Card className="p-5">
        <form action={simpanPengguna} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <h2 className="col-span-full flex items-center gap-2 font-semibold text-slate-800">
            <Plus size={18} className="text-[#0450D5] dark:text-[#54B7FD]" /> Tambah Akun
          </h2>
          <Field label="Nama pengguna">
            <input name="username" placeholder="Nama pengguna" required className={field} />
          </Field>
          <Field label="Alamat email">
            <input name="email" type="email" placeholder="Alamat email" required className={field} />
          </Field>
          <Field label="Nama lengkap">
            <input name="nama_lengkap" placeholder="Nama lengkap" required className={field} />
          </Field>
          <Field label="Kata sandi">
            <input name="password" type="password" placeholder="Minimal 6 karakter" required className={field} />
          </Field>
          <div>
            <Field label="Hak akses">
              <select name="role" defaultValue="user" required className={field}>
                {Object.entries(LABEL_ROLE).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </Field>
            <p className="mt-1 text-xs text-slate-500">
              Admin mengelola pengguna, divisi, jenis cuti, dan pengaturan. HRD memproses persetujuan akhir;
              Ketua Divisi memverifikasi pengajuan anggota; Karyawan mengajukan cuti sendiri.
            </p>
          </div>
          <Field label="Kuota cuti awal (hari)">
            <input name="kuota_awal" type="number" step="0.5" min="0" defaultValue={12} required className={field} />
          </Field>
          <input type="hidden" name="is_active" value="on" />
          <div className="col-span-full">
            <button type="submit" className={btn("primary")}>
              <Plus size={16} /> Buat Akun
            </button>
          </div>
        </form>
      </Card>

      <Card className="p-4 sm:p-5">
        <div className="mb-4 flex items-start gap-3 border-b border-[#CBDFFC]/80 pb-4 dark:border-[#54B7FD]/20">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#CBDFFC] text-[#0450D5] ring-1 ring-[#54B7FD]/40 dark:bg-[#0450D5]/25 dark:text-[#54B7FD] dark:ring-[#54B7FD]/20">
            <SlidersHorizontal size={20} strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-[#012677] dark:text-[#FEFEFE]">
              Filter dan Pencarian Pengguna
            </h2>
            <p className="mt-1 text-sm leading-5 text-[#022F8E]/75 dark:text-[#CBDFFC]/90">
              Temukan dan kelola data pengguna dengan menyaring berdasarkan peran, divisi, status, dan masa kerja.
            </p>
          </div>
        </div>
        <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:flex xl:flex-wrap xl:items-end">
          <select name="role" defaultValue={sp.role ?? ""} className={filterField}>
            <option value="">Semua peran</option>
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
          <Link href="/pengguna" className={btn("ghost")}><RotateCcw size={14} /> Bersihkan Filter</Link>
        </form>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className={TABLE}>
            <thead>
              <tr>
                <th className={TH}>Nama</th><th className={TH}>Nama pengguna</th><th className={TH}>Email</th>
                <th className={TH}>Peran</th><th className={TH}>Divisi</th><th className={TH}>Bergabung</th>
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