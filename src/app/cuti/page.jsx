import Link from "next/link";
import { CalendarDays, Plus, Bell, Filter, RotateCcw, Eye, X, History, Ban, Paperclip } from "lucide-react";
import pool from "@/lib/db";
import { requireUser } from "@/lib/session";
import FormCuti from "@/components/FormCuti";
import {
  PAGE, STATUS_LABEL, Alert, Badge, Card, Kosong, PageHeader, Panel,
  btn, field, filterField, tgl, TABLE, TH, TD, TR,
} from "@/components/ui";
import { batalkanCuti } from "./actions";

export const dynamic = "force-dynamic";

const ORDER = {
  ajuan: "p.tanggal_pengajuan DESC, p.id DESC",
  mulai: "p.tanggal_mulai DESC",
  hari: "p.total_hari DESC",
};

export default async function CutiPage({ searchParams }) {
  const user = await requireUser(["user", "ketua_divisi"]);
  const sp = await searchParams;

  const kuota = (
    await pool.query(
      `SELECT u.kuota_awal - COALESCE((
         SELECT SUM(p.total_hari) FROM pengajuan_cuti p JOIN jenis_cuti j ON j.id = p.jenis_cuti_id
         WHERE p.user_id = u.id AND j.memotong_kuota
           AND EXTRACT(YEAR FROM p.tanggal_mulai) = EXTRACT(YEAR FROM CURRENT_DATE)
           AND p.status IN ('pending','approved_leader','approved')), 0) AS sisa
       FROM users u WHERE u.id = $1`,
      [user.id]
    )
  ).rows[0];

  const where = ["p.user_id = $1"];
  const params = [user.id];
  if (STATUS_LABEL[sp.status]) {
    params.push(sp.status);
    where.push(`p.status = $${params.length}`);
  }
  const { rows } = await pool.query(
    `SELECT p.id, p.tanggal_pengajuan, p.tanggal_mulai, p.tanggal_selesai, p.total_hari, p.status, j.nama AS jenis
     FROM pengajuan_cuti p JOIN jenis_cuti j ON j.id = p.jenis_cuti_id
     WHERE ${where.join(" AND ")} ORDER BY ${ORDER[sp.urut] || ORDER.ajuan}`,
    params
  );

  const sebagaiPengganti = (
    await pool.query(
      `SELECT p.id, u.nama_lengkap, j.nama AS jenis, p.tanggal_mulai, p.tanggal_selesai, p.catatan_tugas
       FROM pengajuan_cuti p
       JOIN users u ON u.id = p.user_id JOIN jenis_cuti j ON j.id = p.jenis_cuti_id
       WHERE p.handover_user_id = $1 AND p.status IN ('pending','approved_leader','approved')
         AND p.tanggal_selesai >= CURRENT_DATE
       ORDER BY p.tanggal_mulai`,
      [user.id]
    )
  ).rows;

  let jenis = [];
  let rekan = [];
  let libur = [];
  let blackout = [];
  if (sp.baru) {
    jenis = (
      await pool.query(
        "SELECT id, nama, wajib_lampiran, memotong_kuota, min_hari_sebelum, maks_hari_sesudah FROM jenis_cuti ORDER BY id"
      )
    ).rows;
    rekan = (
      await pool.query(
        `SELECT id, nama_lengkap FROM users
         WHERE divisi_id = (SELECT divisi_id FROM users WHERE id = $1)
           AND id <> $1 AND is_active AND role IN ('user','ketua_divisi')
         ORDER BY nama_lengkap`,
        [user.id]
      )
    ).rows;
    libur = (
      await pool.query(
        "SELECT to_char(tanggal,'YYYY-MM-DD') AS t FROM hari_libur WHERE tanggal >= CURRENT_DATE - INTERVAL '1 month'"
      )
    ).rows.map((r) => r.t);
    blackout = (
      await pool.query(
        `SELECT to_char(tanggal_mulai,'YYYY-MM-DD') AS mulai, to_char(tanggal_selesai,'YYYY-MM-DD') AS selesai, keterangan
         FROM blackout WHERE tanggal_selesai >= CURRENT_DATE ORDER BY tanggal_mulai`
      )
    ).rows;
  }

  const detailId = Number(sp.detail) || 0;
  const d = detailId
    ? (
        await pool.query(
          `SELECT p.id, p.tanggal_pengajuan, p.tanggal_mulai, p.tanggal_selesai, p.setengah_hari, p.total_hari,
                  p.alasan, p.catatan_tugas, p.alamat_selama_cuti, p.nomor_darurat, p.lampiran,
                  (p.lampiran_data IS NOT NULL) AS ada_lampiran, p.status, p.alasan_pembatalan,
                  j.nama AS jenis, h.nama_lengkap AS handover
           FROM pengajuan_cuti p JOIN jenis_cuti j ON j.id = p.jenis_cuti_id
           LEFT JOIN users h ON h.id = p.handover_user_id
           WHERE p.id = $1 AND p.user_id = $2`,
          [detailId, user.id]
        )
      ).rows[0]
    : null;
  const log = d
    ? (
        await pool.query(
          `SELECT l.level, l.aksi, l.catatan, l.dibuat_pada, a.nama_lengkap
           FROM approval_log l JOIN users a ON a.id = l.approver_id
           WHERE l.pengajuan_id = $1 ORDER BY l.id`,
          [d.id]
        )
      ).rows
    : [];

  return (
    <main className={PAGE}>
      <PageHeader
        ikon={CalendarDays}
        judul="Cuti Saya"
        sub={`Sisa kuota cuti tahunan: ${Number(kuota.sisa)} hari`}
      >
        {!sp.baru && (
          <Link href="/cuti?baru=1" className={btn("primary")}>
            <Plus size={16} /> Ajukan Cuti
          </Link>
        )}
      </PageHeader>

      <Alert error={sp.error} />

      {sp.baru && (
        <FormCuti jenis={jenis} rekan={rekan} sisaKuota={Number(kuota.sisa)} libur={libur} blackout={blackout} />
      )}

      {sebagaiPengganti.length > 0 && (
        <Card className="border-sky-200 bg-sky-50/50 p-5">
          <h2 className="flex items-center gap-2 font-semibold text-sky-800">
            <Bell size={18} /> Kamu ditunjuk sebagai rekan pengganti
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            {sebagaiPengganti.map((s) => (
              <li key={s.id}>
                <strong>{s.nama_lengkap}</strong> ({s.jenis}) · {tgl(s.tanggal_mulai)} - {tgl(s.tanggal_selesai)}
                {s.catatan_tugas && <span className="text-slate-500"> · Tugas: {s.catatan_tugas}</span>}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="p-4">
        <form className="flex flex-wrap items-end gap-3">
          <select name="status" defaultValue={sp.status ?? ""} className={filterField}>
            <option value="">Semua status</option>
            {Object.entries(STATUS_LABEL).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          <select name="urut" defaultValue={sp.urut ?? "ajuan"} className={filterField}>
            <option value="ajuan">Urut: Tanggal pengajuan</option>
            <option value="mulai">Urut: Tanggal mulai</option>
            <option value="hari">Urut: Lama cuti</option>
          </select>
          <button type="submit" className={btn("secondary")}><Filter size={16} /> Terapkan</button>
          <Link href="/cuti" className={btn("ghost")}><RotateCcw size={14} /> Bersihkan Filter</Link>
        </form>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className={TABLE}>
            <thead>
              <tr>
                <th className={TH}>Diajukan</th><th className={TH}>Jenis</th><th className={TH}>Periode</th>
                <th className={TH}>Hari</th><th className={TH}>Status</th><th className={TH}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className={TR}>
                  <td className={`${TD} whitespace-nowrap`}>{tgl(p.tanggal_pengajuan)}</td>
                  <td className={`${TD} font-medium text-slate-900`}>{p.jenis}</td>
                  <td className={`${TD} whitespace-nowrap`}>{tgl(p.tanggal_mulai)} - {tgl(p.tanggal_selesai)}</td>
                  <td className={TD}>{Number(p.total_hari)}</td>
                  <td className={TD}><Badge status={p.status} /></td>
                  <td className={TD}>
                    <Link href={`/cuti?detail=${p.id}`} className={btn("ghost", "sm")}><Eye size={14} /> Detail</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && <Kosong>Belum ada pengajuan cuti.</Kosong>}
      </Card>

      {d && (
        <Panel
          ikon={Eye}
          judul={`Detail Pengajuan #${d.id}`}
          aksi={<Link href="/cuti" className={btn("secondary", "sm")}><X size={14} /> Tutup</Link>}
        >
          <div className="space-y-6">
            <dl className="grid gap-x-6 gap-y-4 text-sm md:grid-cols-2">
              <div><dt className="text-slate-500">Jenis cuti</dt><dd className="font-medium text-slate-900">{d.jenis}{d.setengah_hari && " (setengah hari)"}</dd></div>
              <div><dt className="text-slate-500">Status</dt><dd className="mt-0.5"><Badge status={d.status} /></dd></div>
              <div><dt className="text-slate-500">Periode</dt><dd className="font-medium text-slate-900">{tgl(d.tanggal_mulai)} - {tgl(d.tanggal_selesai)} ({Number(d.total_hari)} hari)</dd></div>
              <div><dt className="text-slate-500">Tanggal pengajuan</dt><dd className="font-medium text-slate-900">{tgl(d.tanggal_pengajuan)}</dd></div>
              <div className="md:col-span-2"><dt className="text-slate-500">Alasan</dt><dd className="text-slate-900">{d.alasan}</dd></div>
              <div><dt className="text-slate-500">Rekan pengganti</dt><dd className="text-slate-900">{d.handover || "-"}</dd></div>
              <div><dt className="text-slate-500">Catatan serah tugas</dt><dd className="text-slate-900">{d.catatan_tugas || "-"}</dd></div>
              <div><dt className="text-slate-500">Alamat selama cuti</dt><dd className="text-slate-900">{d.alamat_selama_cuti || "-"}</dd></div>
              <div><dt className="text-slate-500">Nomor darurat</dt><dd className="text-slate-900">{d.nomor_darurat || "-"}</dd></div>
              <div>
                <dt className="text-slate-500">Lampiran</dt>
                <dd>
                  {d.ada_lampiran ? (
                    <a href={`/api/lampiran?id=${d.id}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-indigo-600 hover:underline">
                      <Paperclip size={14} /> {d.lampiran}
                    </a>
                  ) : "-"}
                </dd>
              </div>
            </dl>

            <div>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
                <History size={16} className="text-indigo-600" /> Riwayat Persetujuan
              </h3>
              <ol className="space-y-4 border-l border-slate-200 pl-5 text-sm">
                <li className="relative text-slate-700">
                  <span className="absolute -left-[26px] top-1 h-3 w-3 rounded-full bg-indigo-500 ring-4 ring-white" />
                  Diajukan · {tgl(d.tanggal_pengajuan)}
                </li>
                {log.map((l, i) => (
                  <li key={i} className={`relative ${l.aksi === "rejected" ? "text-rose-700" : "text-slate-700"}`}>
                    <span
                      className={`absolute -left-[26px] top-1 h-3 w-3 rounded-full ring-4 ring-white ${
                        l.aksi === "rejected" ? "bg-rose-500" : "bg-emerald-500"
                      }`}
                    />
                    <strong>{l.level === "leader" ? "Ketua Divisi" : "HRD"}</strong>{" "}
                    {l.aksi === "approved" ? "menyetujui" : "menolak"} · {l.nama_lengkap} · {tgl(l.dibuat_pada)}
                    {l.catatan && <p className="text-slate-500">Catatan: {l.catatan}</p>}
                  </li>
                ))}
                {d.status === "pending" && (
                  <li className="relative text-amber-700">
                    <span className="absolute -left-[26px] top-1 h-3 w-3 rounded-full bg-amber-400 ring-4 ring-white" />
                    Menunggu verifikasi
                  </li>
                )}
                {d.status === "cancelled" && (
                  <li className="relative text-slate-500">
                    <span className="absolute -left-[26px] top-1 h-3 w-3 rounded-full bg-slate-400 ring-4 ring-white" />
                    Dibatalkan · alasan: {d.alasan_pembatalan}
                  </li>
                )}
              </ol>
            </div>

            {d.status === "pending" && (
              <details className="rounded-lg border border-rose-100 bg-rose-50/40 p-4">
                <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium text-rose-700">
                  <Ban size={14} /> Batalkan pengajuan
                </summary>
                <form action={batalkanCuti} className="mt-3 space-y-3">
                  <input type="hidden" name="id" value={d.id} />
                  <textarea name="alasan" required rows={2} placeholder="Alasan pembatalan (wajib)" className={field} />
                  <button type="submit" className={btn("danger")}><Ban size={16} /> Batalkan Pengajuan</button>
                </form>
              </details>
            )}
          </div>
        </Panel>
      )}
    </main>
  );
}