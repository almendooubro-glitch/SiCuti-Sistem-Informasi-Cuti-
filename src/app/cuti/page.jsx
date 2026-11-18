import Link from "next/link";
import pool from "@/lib/db";
import { requireUser } from "@/lib/session";
import FormCuti from "@/components/FormCuti";
import { batalkanCuti } from "./actions";

export const dynamic = "force-dynamic";

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
const ORDER = {
  ajuan: "p.tanggal_pengajuan DESC, p.id DESC",
  mulai: "p.tanggal_mulai DESC",
  hari: "p.total_hari DESC",
};
const input = "border border-slate-600 bg-slate-800 text-white rounded px-3 py-2";
const tgl = (d) => new Date(d).toLocaleDateString("id-ID");

export default async function CutiPage({ searchParams }) {
  const user = await requireUser(["user", "ketua_divisi"]);
  const sp = await searchParams;

  const kuota = (
    await pool.query(
      `SELECT u.kuota_awal - COALESCE((
         SELECT SUM(p.total_hari) FROM pengajuan_cuti p JOIN jenis_cuti j ON j.id = p.jenis_cuti_id
         WHERE p.user_id = u.id AND j.memotong_kuota
           AND p.status IN ('pending','approved_leader','approved')), 0) AS sisa
       FROM users u WHERE u.id = $1`,
      [user.id]
    )
  ).rows[0];

  const where = ["p.user_id = $1"];
  const params = [user.id];
  if (STATUS[sp.status]) {
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
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Cuti Saya</h1>
          <p className="text-sm text-slate-400">
            Sisa kuota cuti tahunan: <strong className="text-white">{Number(kuota.sisa)} hari</strong>
          </p>
        </div>
        {!sp.baru && (
          <Link href="/cuti?baru=1" className="bg-blue-600 text-white rounded px-4 py-2">
            Ajukan Cuti
          </Link>
        )}
      </div>

      {sp.error && <p className="text-red-400">{sp.error}</p>}

      {sp.baru && (
        <FormCuti
          jenis={jenis}
          rekan={rekan}
          sisaKuota={Number(kuota.sisa)}
          libur={libur}
          blackout={blackout}
        />
      )}

      {sebagaiPengganti.length > 0 && (
        <section className="border border-sky-700 rounded-lg p-4 space-y-2">
          <h2 className="font-semibold">Kamu ditunjuk sebagai rekan pengganti</h2>
          <ul className="text-sm space-y-1">
            {sebagaiPengganti.map((s) => (
              <li key={s.id}>
                <strong>{s.nama_lengkap}</strong> ({s.jenis}) · {tgl(s.tanggal_mulai)} - {tgl(s.tanggal_selesai)}
                {s.catatan_tugas && <span className="text-slate-400"> · Tugas: {s.catatan_tugas}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <form className="flex flex-wrap gap-2 items-center">
        <select name="status" defaultValue={sp.status ?? ""} className={input}>
          <option value="">Semua status</option>
          {Object.entries(STATUS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <select name="urut" defaultValue={sp.urut ?? "ajuan"} className={input}>
          <option value="ajuan">Urut: Tanggal pengajuan</option>
          <option value="mulai">Urut: Tanggal mulai</option>
          <option value="hari">Urut: Lama cuti</option>
        </select>
        <button type="submit" className="bg-slate-600 text-white rounded px-4 py-2">Terapkan</button>
        <Link href="/cuti" className="hover:underline text-sm">Reset</Link>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="py-2">Diajukan</th><th>Jenis</th><th>Periode</th><th>Hari</th><th>Status</th><th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-b border-slate-800">
                <td className="py-2">{tgl(p.tanggal_pengajuan)}</td>
                <td>{p.jenis}</td>
                <td>{tgl(p.tanggal_mulai)} - {tgl(p.tanggal_selesai)}</td>
                <td>{Number(p.total_hari)}</td>
                <td className={WARNA[p.status]}>{STATUS[p.status]}</td>
                <td>
                  <Link href={`/cuti?detail=${p.id}`} className="text-blue-500 hover:underline">Detail</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="text-slate-400 py-4">Belum ada pengajuan cuti.</p>}
      </div>

      {d && (
        <section className="border border-slate-700 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Detail Pengajuan #{d.id}</h2>
            <Link href="/cuti" className="text-sm hover:underline">Tutup</Link>
          </div>

          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div><dt className="text-slate-400">Jenis cuti</dt><dd>{d.jenis}{d.setengah_hari && " (setengah hari)"}</dd></div>
            <div><dt className="text-slate-400">Status</dt><dd className={WARNA[d.status]}>{STATUS[d.status]}</dd></div>
            <div><dt className="text-slate-400">Periode</dt><dd>{tgl(d.tanggal_mulai)} - {tgl(d.tanggal_selesai)} ({Number(d.total_hari)} hari)</dd></div>
            <div><dt className="text-slate-400">Tanggal pengajuan</dt><dd>{tgl(d.tanggal_pengajuan)}</dd></div>
            <div className="md:col-span-2"><dt className="text-slate-400">Alasan</dt><dd>{d.alasan}</dd></div>
            <div><dt className="text-slate-400">Rekan pengganti</dt><dd>{d.handover || "-"}</dd></div>
            <div><dt className="text-slate-400">Catatan tugas (handover)</dt><dd>{d.catatan_tugas || "-"}</dd></div>
            <div><dt className="text-slate-400">Alamat selama cuti</dt><dd>{d.alamat_selama_cuti || "-"}</dd></div>
            <div><dt className="text-slate-400">Nomor darurat</dt><dd>{d.nomor_darurat || "-"}</dd></div>
            <div>
              <dt className="text-slate-400">Lampiran</dt>
              <dd>
                {d.ada_lampiran ? (
                  <a href={`/api/lampiran?id=${d.id}`} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">
                    {d.lampiran}
                  </a>
                ) : "-"}
              </dd>
            </div>
          </dl>

          <div>
            <h3 className="font-semibold text-sm mb-2">Timeline Approval</h3>
            <ol className="border-l border-slate-600 pl-4 space-y-3 text-sm">
              <li>Diajukan · {tgl(d.tanggal_pengajuan)}</li>
              {log.map((l, i) => (
                <li key={i} className={l.aksi === "rejected" ? "text-red-400" : ""}>
                  <strong>{l.level === "leader" ? "Ketua Divisi" : "HRD"}</strong>{" "}
                  {l.aksi === "approved" ? "menyetujui" : "menolak"} · {l.nama_lengkap} · {tgl(l.dibuat_pada)}
                  {l.catatan && <p className="text-slate-400">Catatan: {l.catatan}</p>}
                </li>
              ))}
              {d.status === "pending" && <li className="text-slate-400">Menunggu verifikasi</li>}
              {d.status === "cancelled" && <li className="text-slate-400">Dibatalkan · alasan: {d.alasan_pembatalan}</li>}
            </ol>
          </div>

          {d.status === "pending" && (
            <details>
              <summary className="cursor-pointer text-red-500 hover:underline text-sm">Batalkan pengajuan</summary>
              <form action={batalkanCuti} className="mt-3 space-y-2">
                <input type="hidden" name="id" value={d.id} />
                <textarea name="alasan" required rows={2} placeholder="Alasan pembatalan (wajib)" className={`${input} w-full`} />
                <button type="submit" className="bg-red-600 text-white rounded px-4 py-2">Batalkan Pengajuan</button>
              </form>
            </details>
          )}
        </section>
      )}
    </main>
  );
}