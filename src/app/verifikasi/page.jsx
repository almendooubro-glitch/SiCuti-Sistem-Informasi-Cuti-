import Link from "next/link";
import pool from "@/lib/db";
import { requireUser } from "@/lib/session";
import { cekKapasitas } from "@/lib/kapasitas";
import ModalKeputusan from "@/components/ModalKeputusan";
import { putuskan, setujuiBanyak } from "./actions";

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
const input = "border border-slate-600 bg-slate-800 text-white rounded px-3 py-2";
const tgl = (d) => new Date(d).toLocaleDateString("id-ID");

export default async function VerifikasiPage({ searchParams }) {
  const user = await requireUser(["ketua_divisi", "hrd"]);
  const sp = await searchParams;
  const hrd = user.role === "hrd";

  const { rows: kartu } = await pool.query(
    `SELECT u.id AS user_id, u.divisi_id, (u.foto_data IS NOT NULL) AS ada_foto,
            to_char(p.tanggal_mulai,'YYYY-MM-DD') AS mulai_str,
            to_char(p.tanggal_selesai,'YYYY-MM-DD') AS selesai_str,
            p.id, p.tanggal_pengajuan, p.tanggal_mulai, p.tanggal_selesai, p.setengah_hari, p.total_hari,
            p.alasan, p.catatan_tugas, p.lampiran, (p.lampiran_data IS NOT NULL) AS ada_lampiran,
            u.nama_lengkap, u.role, d.nama AS divisi, j.nama AS jenis, j.memotong_kuota,
            h.nama_lengkap AS handover,
            u.kuota_awal - COALESCE((
              SELECT SUM(x.total_hari) FROM pengajuan_cuti x JOIN jenis_cuti jx ON jx.id = x.jenis_cuti_id
              WHERE x.user_id = u.id AND jx.memotong_kuota
                AND x.status IN ('pending','approved_leader','approved')), 0) AS sisa,
            a.nama_lengkap AS atasan, l.catatan AS catatan_atasan, l.dibuat_pada AS tgl_atasan
     FROM pengajuan_cuti p
     JOIN users u ON u.id = p.user_id
     JOIN jenis_cuti j ON j.id = p.jenis_cuti_id
     LEFT JOIN divisi d ON d.id = u.divisi_id
     LEFT JOIN users h ON h.id = p.handover_user_id
     LEFT JOIN approval_log l ON l.pengajuan_id = p.id AND l.level = 'leader' AND l.aksi = 'approved'
     LEFT JOIN users a ON a.id = l.approver_id
     WHERE ${
       hrd
         ? "(p.status = 'approved_leader' OR (p.status = 'pending' AND u.role = 'ketua_divisi'))"
         : "p.status = 'pending' AND u.role = 'user' AND u.divisi_id IN (SELECT id FROM divisi WHERE ketua_id = $1)"
     }
     ORDER BY p.tanggal_pengajuan, p.id`,
    hrd ? [] : [user.id]
  );

  const kapasitas = await Promise.all(
    kartu.map((k) =>
      hrd && k.divisi_id && k.jenis !== "Cuti Sakit"
        ? cekKapasitas(k.divisi_id, k.mulai_str, k.selesai_str, k.user_id)
        : null
    )
  );

  const params = hrd ? [] : [user.id];
  const where = [hrd ? "TRUE" : "u.divisi_id IN (SELECT id FROM divisi WHERE ketua_id = $1) AND u.id <> $1"];
  if (STATUS[sp.status]) {
    params.push(sp.status);
    where.push(`p.status = $${params.length}`);
  }
  const { rows: riwayat } = await pool.query(
    `SELECT p.id, u.nama_lengkap, j.nama AS jenis, p.tanggal_mulai, p.tanggal_selesai, p.total_hari, p.status
     FROM pengajuan_cuti p JOIN users u ON u.id = p.user_id JOIN jenis_cuti j ON j.id = p.jenis_cuti_id
     WHERE ${where.join(" AND ")} ORDER BY p.tanggal_pengajuan DESC, p.id DESC LIMIT 100`,
    params
  );

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{hrd ? "Persetujuan Final" : "Verifikasi Pengajuan"}</h1>
        <p className="text-sm text-slate-400">
          {hrd
            ? "Pengajuan yang sudah disetujui ketua divisi dan pengajuan langsung dari ketua divisi."
            : "Pengajuan cuti dari anggota divisi yang kamu pimpin."}
        </p>
      </div>

      {sp.error && <p className="text-red-400">{sp.error}</p>}
      {sp.info && <p className="text-green-400">{sp.info}</p>}

      {hrd && <form id="multi" action={setujuiBanyak} />}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Menunggu Keputusan ({kartu.length})</h2>
          {hrd && kartu.length > 0 && (
            <button type="submit" form="multi" className="bg-green-600 text-white rounded px-4 py-2 text-sm">
              Setujui yang dipilih
            </button>
          )}
        </div>

        {kartu.length === 0 && <p className="text-slate-400 text-sm">Tidak ada pengajuan yang menunggu.</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {kartu.map((k, i) => (
            <article key={k.id} className="border border-slate-700 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                {k.ada_foto ? (
                  <img src={`/api/foto?id=${k.user_id}`} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
                ) : (
                  <div className="h-10 w-10 shrink-0 rounded-full bg-slate-600 flex items-center justify-center font-bold">
                    {k.nama_lengkap[0]}
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-semibold">{k.nama_lengkap}</p>
                  <p className="text-xs text-slate-400">
                    {k.role === "ketua_divisi" ? "Ketua Divisi" : "Karyawan"} · {k.divisi || "Tanpa divisi"}
                  </p>
                </div>
                {hrd && <input type="checkbox" name="ids" value={k.id} form="multi" aria-label={`Pilih pengajuan ${k.id}`} />}
              </div>

              <dl className="text-sm space-y-1">
                <div><dt className="inline text-slate-400">Jenis: </dt><dd className="inline">{k.jenis}{k.setengah_hari && " (setengah hari)"}</dd></div>
                <div><dt className="inline text-slate-400">Periode: </dt><dd className="inline">{tgl(k.tanggal_mulai)} - {tgl(k.tanggal_selesai)} ({Number(k.total_hari)} hari)</dd></div>
                <div><dt className="inline text-slate-400">Diajukan: </dt><dd className="inline">{tgl(k.tanggal_pengajuan)}</dd></div>
                <div><dt className="inline text-slate-400">Alasan: </dt><dd className="inline">{k.alasan}</dd></div>
                <div><dt className="inline text-slate-400">Rekan pengganti: </dt><dd className="inline">{k.handover || "-"}</dd></div>
                <div><dt className="inline text-slate-400">Catatan tugas: </dt><dd className="inline">{k.catatan_tugas || "-"}</dd></div>
                {k.ada_lampiran && (
                  <div>
                    <dt className="inline text-slate-400">Lampiran: </dt>
                    <dd className="inline">
                      <a href={`/api/lampiran?id=${k.id}`} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">
                        {k.lampiran}
                      </a>
                    </dd>
                  </div>
                )}
              </dl>

              {hrd && (
                <div className="text-sm border-t border-slate-700 pt-2 space-y-1">
                  {kapasitas[i] && (
                    <p className={kapasitas[i].melebihi ? "text-amber-400" : "text-slate-400"}>
                      {kapasitas[i].melebihi ? "⚠ Melebihi kapasitas: " : "Kapasitas divisi: "}
                      hari terpadat {kapasitas[i].persen}% anggota cuti (batas {kapasitas[i].maks}%)
                    </p>
                  )}
                  {k.memotong_kuota && (
                    <p className={Number(k.sisa) < 0 ? "text-red-400" : ""}>
                      Sisa kuota (termasuk pengajuan ini): <strong>{Number(k.sisa)} hari</strong>
                    </p>
                  )}
                  {k.atasan ? (
                    <p>
                      Disetujui atasan: <strong>{k.atasan}</strong> · {tgl(k.tgl_atasan)}
                      <span className="block text-slate-400">Catatan: {k.catatan_atasan || "-"}</span>
                    </p>
                  ) : (
                    <p className="text-slate-400">Diajukan langsung oleh Ketua Divisi.</p>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <ModalKeputusan action={putuskan} id={k.id} aksi="approved" label="Approve" judul={`Setujui pengajuan ${k.nama_lengkap}?`} />
                <ModalKeputusan action={putuskan} id={k.id} aksi="rejected" label="Reject" judul={`Tolak pengajuan ${k.nama_lengkap}?`} />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Riwayat Pengajuan</h2>
        <form className="flex gap-2 items-center">
          <select name="status" defaultValue={sp.status ?? ""} className={input}>
            <option value="">Semua status</option>
            {Object.entries(STATUS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          <button type="submit" className="bg-slate-600 text-white rounded px-4 py-2">Terapkan</button>
          <Link href="/verifikasi" className="hover:underline text-sm">Reset</Link>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="py-2">Karyawan</th><th>Jenis</th><th>Periode</th><th>Hari</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {riwayat.map((r) => (
                <tr key={r.id} className="border-b border-slate-800">
                  <td className="py-2">{r.nama_lengkap}</td>
                  <td>{r.jenis}</td>
                  <td>{tgl(r.tanggal_mulai)} - {tgl(r.tanggal_selesai)}</td>
                  <td>{Number(r.total_hari)}</td>
                  <td className={WARNA[r.status]}>{STATUS[r.status]}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {riwayat.length === 0 && <p className="text-slate-400 py-4">Belum ada riwayat.</p>}
        </div>
      </section>
    </main>
  );
}