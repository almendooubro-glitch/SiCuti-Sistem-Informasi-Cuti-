import { Settings, Gauge, CalendarOff, CalendarX, Save, Plus, RefreshCw } from "lucide-react";
import pool from "@/lib/db";
import { requireUser } from "@/lib/session";
import TombolKonfirmasi from "@/components/TombolKonfirmasi";
import { PAGE, Alert, Field, PageHeader, Panel, btn, field, filterField } from "@/components/ui";
import { simpanKapasitas, tambahLibur, hapusLibur, sinkronkanHariLiburGoogle, tambahBlackout, hapusBlackout } from "./actions";

export const dynamic = "force-dynamic";

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
    <main className={`${PAGE} max-w-4xl`}>
      <PageHeader ikon={Settings} judul="Pengaturan Cuti" sub="Kapasitas tim, hari libur, dan periode larangan cuti" />
      <Alert error={sp.error} info={sp.info} />

      <Panel ikon={Gauge} judul="Kapasitas Tim">
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            Maksimal persentase anggota satu divisi yang boleh cuti bersamaan (Cuti Sakit tidak dibatasi).
          </p>
          <form action={simpanKapasitas} className="flex flex-wrap items-end gap-3">
            <Field label="Batas kapasitas (%)">
              <input name="persen" type="number" min="1" max="100" defaultValue={persen} required className={`${field} sm:w-32`} />
            </Field>
            <button type="submit" className={btn("primary")}><Save size={16} /> Simpan</button>
          </form>
        </div>
      </Panel>

      <Panel ikon={CalendarOff} judul="Hari Libur dan Cuti Bersama">
        <div className="space-y-4">
          <form action={tambahLibur} className="flex flex-wrap items-end gap-3">
            <Field label="Tanggal">
              <input name="tanggal" type="date" required className={filterField} />
            </Field>
            <Field label="Keterangan">
              <input name="keterangan" placeholder="Keterangan" required className={filterField} />
            </Field>
            <Field label="Jenis">
              <select name="jenis" className={filterField}>
                <option value="nasional">Libur nasional</option>
                <option value="cuti_bersama">Cuti bersama</option>
              </select>
            </Field>
            <button type="submit" className={btn("primary")}><Plus size={16} /> Tambah</button>
          </form>
          <form action={sinkronkanHariLiburGoogle} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-3">
            <p className="text-sm text-slate-600">
              Ambil libur nasional dan cuti bersama dari Google Calendar Indonesia.
            </p>
            <button type="submit" className={btn("secondary")}><RefreshCw size={16} /> Sinkronkan Google Calendar</button>
          </form>
          <ul className="divide-y divide-slate-100 text-sm">
            {libur.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <span className="text-slate-700">
                  {tgl(l.tanggal)} · <span className="font-medium text-slate-900">{l.keterangan}</span> ·{" "}
                  <span className="text-slate-500">{l.jenis === "nasional" ? "Libur nasional" : "Cuti bersama"}</span>
                </span>
                <TombolKonfirmasi action={hapusLibur} fields={{ id: l.id }} label="Hapus" pesan={`Hapus ${l.keterangan}?`} />
              </li>
            ))}
          </ul>
          {libur.length === 0 && <p className="text-sm text-slate-400">Belum ada hari libur.</p>}
        </div>
      </Panel>

      <Panel ikon={CalendarX} judul="Periode Larangan Cuti">
        <div className="space-y-4">
          <p className="text-sm text-slate-500">Pada periode ini cuti (selain Cuti Sakit) tidak bisa diajukan.</p>
          <form action={tambahBlackout} className="flex flex-wrap items-end gap-3">
            <Field label="Tanggal mulai">
              <input name="tanggal_mulai" type="date" required className={filterField} />
            </Field>
            <Field label="Tanggal selesai">
              <input name="tanggal_selesai" type="date" required className={filterField} />
            </Field>
            <Field label="Keterangan">
              <input name="keterangan" placeholder="Keterangan" required className={filterField} />
            </Field>
            <button type="submit" className={btn("primary")}><Plus size={16} /> Tambah</button>
          </form>
          <ul className="divide-y divide-slate-100 text-sm">
            {blackout.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <span className="text-slate-700">
                  <span className="font-medium text-slate-900">{b.keterangan}</span> · {tgl(b.mulai)} s.d. {tgl(b.selesai)}
                </span>
                <TombolKonfirmasi action={hapusBlackout} fields={{ id: b.id }} label="Hapus" pesan={`Hapus periode larangan cuti ${b.keterangan}?`} />
              </li>
            ))}
          </ul>
          {blackout.length === 0 && <p className="text-sm text-slate-400">Belum ada periode larangan cuti.</p>}
        </div>
      </Panel>
    </main>
  );
}