import { Settings, Gauge, CalendarOff, CalendarX, Save, Plus } from "lucide-react";
import pool from "@/lib/db";
import { requireUser } from "@/lib/session";
import TombolKonfirmasi from "@/components/TombolKonfirmasi";
import { simpanKapasitas, tambahLibur, hapusLibur, tambahBlackout, hapusBlackout } from "./actions";

export const dynamic = "force-dynamic";

const input = "border border-slate-600 bg-slate-800 text-white rounded px-3 py-2";
const tgl = (s) =>
  new Date(s + "T00:00:00").toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

export default async function PengaturanPage({ searchParams }) {
  await requireUser(["admin", "hrd"]);
  const sp = await searchParams;

  const persen =
    (await pool.query("SELECT nilai FROM pengaturan WHERE kunci = 'kapasitas_maks_persen'")).rows[0]?.nilai ?? "100";
  const libur = (
    await pool.query(
      `SELECT id, to_char(tanggal,'YYYY-MM-DD') AS tanggal, keterangan, jenis FROM hari_libur
       WHERE tanggal >= CURRENT_DATE - INTERVAL '1 month' ORDER BY tanggal`
    )
  ).rows;
  const blackout = (
    await pool.query(
      `SELECT id, to_char(tanggal_mulai,'YYYY-MM-DD') AS mulai, to_char(tanggal_selesai,'YYYY-MM-DD') AS selesai, keterangan
       FROM blackout ORDER BY tanggal_mulai`
    )
  ).rows;

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold"><Settings size={24} /> Pengaturan Cuti</h1>
      {sp.error && <p className="text-red-400">{sp.error}</p>}
      {sp.info && <p className="text-green-400">{sp.info}</p>}

      <section className="space-y-3">
        <h2 className="font-semibold"><Gauge size={16} /> Kapasitas Tim</h2>
        <p className="text-sm text-slate-400">
          Maksimal persentase anggota satu divisi yang boleh cuti bersamaan (Cuti Sakit tidak dibatasi).
        </p>
        <form action={simpanKapasitas} className="flex gap-2 items-center">
          <input name="persen" type="number" min="1" max="100" defaultValue={persen} required className={`${input} w-28`} />
          <span>%</span>
          <button type="submit" className="bg-blue-600 text-white rounded px-4 py-2"><Save size={16} /> Simpan</button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold"><CalendarOff size={16} /> Hari Libur dan Cuti Bersama</h2>
        <form action={tambahLibur} className="flex flex-wrap gap-2">
          <input name="tanggal" type="date" required className={input} />
          <input name="keterangan" placeholder="Keterangan" required className={input} />
          <select name="jenis" className={input}>
            <option value="nasional">Libur nasional</option>
            <option value="cuti_bersama">Cuti bersama</option>
          </select>
          <button type="submit" className="bg-blue-600 text-white rounded px-4 py-2"><Plus size={16} /> Tambah</button>
        </form>
        <ul className="text-sm space-y-2">
          {libur.map((l) => (
            <li key={l.id} className="flex items-center gap-3">
              <span>
                {tgl(l.tanggal)} · {l.keterangan} ·{" "}
                <span className="text-slate-400">{l.jenis === "nasional" ? "Libur nasional" : "Cuti bersama"}</span>
              </span>
              <TombolKonfirmasi action={hapusLibur} fields={{ id: l.id }} label="Hapus" pesan={`Hapus ${l.keterangan}?`} />
            </li>
          ))}
        </ul>
        {libur.length === 0 && <p className="text-slate-400 text-sm">Belum ada hari libur.</p>}
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold"><CalendarX size={16} /> Periode Blackout</h2>
        <p className="text-sm text-slate-400">Pada periode ini cuti (selain Cuti Sakit) tidak bisa diajukan.</p>
        <form action={tambahBlackout} className="flex flex-wrap gap-2">
          <input name="tanggal_mulai" type="date" required className={input} />
          <input name="tanggal_selesai" type="date" required className={input} />
          <input name="keterangan" placeholder="Keterangan" required className={input} />
          <button type="submit" className="bg-blue-600 text-white rounded px-4 py-2"><Plus size={16} /> Tambah</button>
        </form>
        <ul className="text-sm space-y-2">
          {blackout.map((b) => (
            <li key={b.id} className="flex items-center gap-3">
              <span>
                {b.keterangan} · {tgl(b.mulai)} s.d. {tgl(b.selesai)}
              </span>
              <TombolKonfirmasi action={hapusBlackout} fields={{ id: b.id }} label="Hapus" pesan={`Hapus blackout ${b.keterangan}?`} />
            </li>
          ))}
        </ul>
        {blackout.length === 0 && <p className="text-slate-400 text-sm">Belum ada periode blackout.</p>}
      </section>
    </main>
  );
}