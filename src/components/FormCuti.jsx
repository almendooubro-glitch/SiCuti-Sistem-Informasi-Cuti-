"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ajukanCuti } from "@/app/cuti/actions";
import { hitungHariKerja, hariIni, tambahHari } from "@/lib/hari";

const input = "border border-slate-600 bg-slate-800 text-white rounded px-3 py-2 w-full";

export default function FormCuti({ jenis, rekan, sisaKuota }) {
  const router = useRouter();
  const [jenisId, setJenisId] = useState(jenis[0]?.id ?? "");
  const [mulai, setMulai] = useState("");
  const [selesai, setSelesai] = useState("");
  const [setengah, setSetengah] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const j = jenis.find((x) => x.id === Number(jenisId));
  const minMulai = j
    ? j.maks_hari_sesudah > 0
      ? tambahHari(hariIni(), -j.maks_hari_sesudah)
      : tambahHari(hariIni(), j.min_hari_sebelum)
    : hariIni();

  const akhir = setengah ? mulai : selesai;
  const total = hitungHariKerja(mulai, akhir, setengah);
  const sisaSetelah = Number((Number(sisaKuota) - total).toFixed(1));

  function handleSubmit(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("tanggal_selesai", akhir);

    const f = fd.get("lampiran");
    if (f && f.size > 900 * 1024) {
      setError("Ukuran lampiran maksimal 900 KB");
      return;
    }
    setError("");

    startTransition(async () => {
      const res = await ajukanCuti(fd);
      if (res?.error) {
        setError(res.error);
      } else {
        router.push("/cuti");
        router.refresh();
      }
    });
  }

  function handleReset() {
    setMulai("");
    setSelesai("");
    setSetengah(false);
    setError("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      onReset={handleReset}
      className="grid grid-cols-1 md:grid-cols-2 gap-3 border border-slate-700 rounded-lg p-4"
    >
      <h2 className="col-span-full font-semibold">Form Pengajuan Cuti</h2>

      <label className="space-y-1 text-sm">
        Jenis cuti
        <select
          name="jenis_cuti_id"
          value={jenisId}
          onChange={(e) => {
            setJenisId(e.target.value);
            setMulai("");
            setSelesai("");
          }}
          className={input}
        >
          {jenis.map((x) => (
            <option key={x.id} value={x.id}>
              {x.nama}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2 text-sm md:mt-6">
        <input
          type="checkbox"
          name="setengah_hari"
          checked={setengah}
          onChange={(e) => setSetengah(e.target.checked)}
        />
        Cuti setengah hari (0,5 hari)
      </label>

      {j && (
        <p className="col-span-full text-xs text-slate-400">
          {j.min_hari_sebelum > 0 && `Diajukan minimal H-${j.min_hari_sebelum}. `}
          {j.maks_hari_sesudah > 0 &&
            `Boleh diajukan sampai ${j.maks_hari_sesudah} hari setelah tanggal mulai. `}
          Tanggal mulai paling awal:{" "}
          {new Date(minMulai + "T00:00:00").toLocaleDateString("id-ID")}.{" "}
          {j.wajib_lampiran && "Wajib melampirkan dokumen."}
        </p>
      )}

      <label className="space-y-1 text-sm">
        Tanggal mulai
        <input
          type="date"
          name="tanggal_mulai"
          min={minMulai}
          value={mulai}
          onChange={(e) => setMulai(e.target.value)}
          required
          className={input}
        />
      </label>
      <label className="space-y-1 text-sm">
        Tanggal selesai
        <input
          type="date"
          min={mulai || minMulai}
          value={akhir}
          onChange={(e) => setSelesai(e.target.value)}
          disabled={setengah}
          required
          className={input}
        />
      </label>

      <div className="col-span-full text-sm border border-slate-700 rounded p-3 space-y-1">
        <p>
          Total hari kerja: <strong>{total}</strong> hari (Sabtu dan Minggu tidak dihitung)
        </p>
        {mulai && akhir && total === 0 && (
          <p className="text-red-400">Tanggal tidak valid atau tidak memuat hari kerja.</p>
        )}
        {j?.memotong_kuota && (
          <p className={sisaSetelah < 0 ? "text-red-400" : ""}>
            Sisa kuota tahunan: {Number(sisaKuota)} hari → setelah pengajuan ini: {sisaSetelah} hari
          </p>
        )}
      </div>

      <label className="col-span-full space-y-1 text-sm">
        Alasan cuti
        <textarea name="alasan" required rows={2} className={input} />
      </label>

      <label className="space-y-1 text-sm">
        Rekan pengganti (handover)
        <select name="handover_user_id" defaultValue="" className={input}>
          <option value="">Tidak ada</option>
          {rekan.map((r) => (
            <option key={r.id} value={r.id}>
              {r.nama_lengkap}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-1 text-sm">
        Catatan tugas
        <textarea name="catatan_tugas" rows={1} className={input} />
      </label>
      <label className="space-y-1 text-sm">
        Alamat selama cuti
        <input name="alamat_selama_cuti" className={input} />
      </label>
      <label className="space-y-1 text-sm">
        Nomor darurat
        <input name="nomor_darurat" inputMode="tel" className={input} />
      </label>

      <label className="col-span-full space-y-1 text-sm">
        Surat dokter / lampiran (PDF, JPG, PNG, maks. 900 KB)
        <input
          type="file"
          name="lampiran"
          accept=".pdf,.jpg,.jpeg,.png"
          required={Boolean(j?.wajib_lampiran)}
          className={input}
        />
      </label>

      {error && <p className="col-span-full text-red-400 text-sm">{error}</p>}

      <div className="col-span-full flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="bg-blue-600 disabled:opacity-50 text-white rounded px-4 py-2"
        >
          {pending ? "Mengirim..." : "Submit"}
        </button>
        <button type="reset" className="bg-slate-600 text-white rounded px-4 py-2">
          Reset
        </button>
        <Link href="/cuti" className="px-4 py-2 hover:underline">
          Cancel
        </Link>
      </div>
    </form>
  );
}