import Link from "next/link";
import {
  ClipboardCheck, CheckCheck, Clock, History, Paperclip, Filter, RotateCcw, TriangleAlert, UserCheck,
} from "lucide-react";
import pool from "@/lib/db";
import { requireUser } from "@/lib/session";
import { cekKapasitas } from "@/lib/kapasitas";
import ModalKeputusan from "@/components/ModalKeputusan";
import {
  PAGE, STATUS_LABEL, Alert, Avatar, Badge, Card, Kosong, PageHeader, Panel,
  btn, filterField, tgl, TABLE, TH, TD, TR,
} from "@/components/ui";
import { putuskan, setujuiBanyak } from "./actions";

export const dynamic = "force-dynamic";

export default async function VerifikasiPage({ searchParams }) {
  const user = await requireUser(["ketua_divisi", "hrd"]);
  const sp = await searchParams;
  const hrd = user.role === "hrd";

  const { rows: kartu } = await pool.query(
    `SELECT u.divisi_id, to_char(p.tanggal_mulai,'YYYY-MM-DD') AS mulai_str,
            to_char(p.tanggal_selesai,'YYYY-MM-DD') AS selesai_str,
            p.id, p.tanggal_pengajuan, p.tanggal_mulai, p.tanggal_selesai, p.setengah_hari, p.total_hari,
            p.alasan, p.catatan_tugas, p.lampiran, (p.lampiran_data IS NOT NULL) AS ada_lampiran,
            u.id AS user_id, (u.foto_data IS NOT NULL) AS ada_foto,
            u.nama_lengkap, u.role, d.nama AS divisi, j.nama AS jenis, j.memotong_kuota,
            h.nama_lengkap AS handover,
            u.kuota_awal - COALESCE((
              SELECT SUM(x.total_hari) FROM pengajuan_cuti x JOIN jenis_cuti jx ON jx.id = x.jenis_cuti_id
              WHERE x.user_id = u.id AND jx.memotong_kuota
                AND EXTRACT(YEAR FROM x.tanggal_mulai) = EXTRACT(YEAR FROM p.tanggal_mulai)
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
  if (STATUS_LABEL[sp.status]) {
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
    <main className={PAGE}>
      <PageHeader
        ikon={ClipboardCheck}
        judul={hrd ? "Persetujuan Akhir" : "Verifikasi Pengajuan"}
        sub={
          hrd
            ? "Pengajuan yang sudah disetujui ketua divisi dan pengajuan langsung dari ketua divisi."
            : "Pengajuan cuti dari anggota divisi yang kamu pimpin."
        }
      />

      <Alert error={sp.error} info={sp.info} />

      {hrd && <form id="multi" action={setujuiBanyak} />}

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-semibold text-slate-800">
            <Clock size={18} className="text-amber-500" /> Menunggu Keputusan ({kartu.length})
          </h2>
          {hrd && kartu.length > 0 && (
            <button type="submit" form="multi" className={btn("success")}>
              <CheckCheck size={16} /> Setujui yang dipilih
            </button>
          )}
        </div>

        {kartu.length === 0 && (
          <Card><Kosong>Tidak ada pengajuan yang menunggu.</Kosong></Card>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          {kartu.map((k, i) => (
            <Card key={k.id} hover className="space-y-4 p-5">
              <div className="flex items-center gap-3">
                <Avatar id={k.user_id} ada={k.ada_foto} nama={k.nama_lengkap} size="h-11 w-11" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900">{k.nama_lengkap}</p>
                  <p className="text-xs text-slate-500">
                    {k.role === "ketua_divisi" ? "Ketua Divisi" : "Karyawan"} · {k.divisi || "Tanpa divisi"}
                  </p>
                </div>
                {hrd && (
                  <input
                    type="checkbox"
                    name="ids"
                    value={k.id}
                    form="multi"
                    aria-label={`Pilih pengajuan ${k.id}`}
                    className="h-5 w-5 rounded border-[#54B7FD] text-[#0450D5] focus:ring-[#2893FC]"
                  />
                )}
              </div>

              <dl className="space-y-1.5 text-sm">
                <div><dt className="inline text-slate-500">Jenis: </dt><dd className="inline font-medium text-slate-900">{k.jenis}{k.setengah_hari && " (setengah hari)"}</dd></div>
                <div><dt className="inline text-slate-500">Periode: </dt><dd className="inline text-slate-900">{tgl(k.tanggal_mulai)} - {tgl(k.tanggal_selesai)} ({Number(k.total_hari)} hari)</dd></div>
                <div><dt className="inline text-slate-500">Diajukan: </dt><dd className="inline text-slate-900">{tgl(k.tanggal_pengajuan)}</dd></div>
                <div><dt className="inline text-slate-500">Alasan: </dt><dd className="inline text-slate-900">{k.alasan}</dd></div>
                <div><dt className="inline text-slate-500">Rekan pengganti: </dt><dd className="inline text-slate-900">{k.handover || "-"}</dd></div>
                <div><dt className="inline text-slate-500">Catatan tugas: </dt><dd className="inline text-slate-900">{k.catatan_tugas || "-"}</dd></div>
                {k.ada_lampiran && (
                  <div>
                    <dt className="inline text-slate-500">Lampiran: </dt>
                    <dd className="inline">
                      <a href={`/api/lampiran?id=${k.id}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-[#0450D5] hover:underline dark:text-[#54B7FD]">
                        <Paperclip size={14} /> {k.lampiran}
                      </a>
                    </dd>
                  </div>
                )}
              </dl>

              {hrd && (
                <div className="space-y-2 border-t border-slate-100 pt-3 text-sm">
                  {kapasitas[i] && (
                    <p
                      className={`flex items-start gap-2 rounded-lg px-3 py-2 ${
                        kapasitas[i].melebihi
                          ? "border border-amber-200 bg-amber-50 text-amber-800"
                          : "bg-slate-50 text-slate-600"
                      }`}
                    >
                      {kapasitas[i].melebihi && <TriangleAlert size={16} className="mt-0.5" />}
                      <span>
                        {kapasitas[i].melebihi ? "Melebihi kapasitas: " : "Kapasitas divisi: "}
                        hari terpadat {kapasitas[i].persen}% anggota cuti (batas {kapasitas[i].maks}%)
                      </span>
                    </p>
                  )}
                  {k.memotong_kuota && (
                    <p className={Number(k.sisa) < 0 ? "font-medium text-rose-600" : "text-slate-700"}>
                      Sisa kuota (termasuk pengajuan ini): <strong>{Number(k.sisa)} hari</strong>
                    </p>
                  )}
                  {k.atasan ? (
                    <p className="flex items-start gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sky-800">
                      <UserCheck size={16} className="mt-0.5" />
                      <span>
                        Disetujui atasan: <strong>{k.atasan}</strong> · {tgl(k.tgl_atasan)}
                        <span className="block text-sky-700/80">Catatan: {k.catatan_atasan || "-"}</span>
                      </span>
                    </p>
                  ) : (
                    <p className="text-slate-500">Diajukan langsung oleh Ketua Divisi.</p>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <ModalKeputusan action={putuskan} id={k.id} aksi="approved" label="Setujui" judul={`Setujui pengajuan ${k.nama_lengkap}?`} />
                <ModalKeputusan action={putuskan} id={k.id} aksi="rejected" label="Tolak" judul={`Tolak pengajuan ${k.nama_lengkap}?`} />
              </div>
            </Card>
          ))}
        </div>
      </section>

      <Panel ikon={History} judul="Riwayat Pengajuan" flush>
        <form className="flex flex-wrap items-end gap-3 border-b border-slate-100 p-4">
          <select name="status" defaultValue={sp.status ?? ""} className={filterField}>
            <option value="">Semua status</option>
            {Object.entries(STATUS_LABEL).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          <button type="submit" className={btn("secondary")}><Filter size={16} /> Terapkan</button>
          <Link href="/verifikasi" className={btn("ghost")}><RotateCcw size={14} /> Bersihkan Filter</Link>
        </form>

        <div className="overflow-x-auto">
          <table className={TABLE}>
            <thead>
              <tr>
                <th className={TH}>Karyawan</th><th className={TH}>Jenis</th><th className={TH}>Periode</th>
                <th className={TH}>Hari</th><th className={TH}>Status</th>
              </tr>
            </thead>
            <tbody>
              {riwayat.map((r) => (
                <tr key={r.id} className={TR}>
                  <td className={`${TD} font-medium text-slate-900`}>{r.nama_lengkap}</td>
                  <td className={TD}>{r.jenis}</td>
                  <td className={`${TD} whitespace-nowrap`}>{tgl(r.tanggal_mulai)} - {tgl(r.tanggal_selesai)}</td>
                  <td className={TD}>{Number(r.total_hari)}</td>
                  <td className={TD}><Badge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {riwayat.length === 0 && <Kosong>Belum ada riwayat.</Kosong>}
      </Panel>
    </main>
  );
}