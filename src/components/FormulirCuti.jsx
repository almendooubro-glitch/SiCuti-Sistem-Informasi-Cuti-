"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {FilePlus2, Send, Loader2, RotateCcw, X, Info, TriangleAlert,} from "lucide-react";
import { ajukanCuti } from "@/app/cuti/actions";
import { hitungHariKerja, hariIni } from "@/lib/hari";
import { Alert, Card, Field, btn, field } from "@/components/KomponenUmum";

export default function FormCuti({ jenis, rekan, sisaKuota, libur, blackout }) {
  const router = useRouter();

  const [jenisId, setJenisId] = useState(jenis[0]?.id ?? "");
  const [mulai, setMulai] = useState("");
  const [selesai, setSelesai] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const j = jenis.find((x) => x.id === Number(jenisId));
  const setengah = j?.nama === "Cuti Setengah Hari";

  const hari = hariIni();
  const batas = new Date(hari + "T00:00:00");
  batas.setDate(batas.getDate() - (j?.maks_hari_sesudah ?? 0));

  const tanggalMin = [
    batas.getFullYear(),
    String(batas.getMonth() + 1).padStart(2, "0"),
    String(batas.getDate()).padStart(2, "0"),
  ].join("-");

  const akhir = setengah ? mulai : selesai;
  const total = hitungHariKerja(mulai, akhir, setengah, libur);
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
    setError("");
  }

  return (
    <Card className="p-5">
      <form
        onSubmit={handleSubmit}
        onReset={handleReset}
        className="grid gap-4 md:grid-cols-2"
      >
        <h2 className="col-span-full flex items-center gap-2 text-lg font-semibold text-slate-800">
          <FilePlus2 size={20} className="text-[#0450D5] dark:text-[#54B7FD]" />
          Form Pengajuan Cuti
        </h2>

        <Field label="Jenis cuti">
          <select
            name="jenis_cuti_id"
            value={jenisId}
            onChange={(e) => setJenisId(e.target.value)}
            className={field}
          >
            {jenis.map((x) => (
              <option key={x.id} value={x.id}>
                {x.nama}
              </option>
            ))}
          </select>
        </Field>

        {j &&
          (j.min_hari_sebelum > 0 ||
            j.maks_hari_sesudah > 0 ||
            j.wajib_lampiran) && (
            <p className="col-span-full flex items-start gap-2 rounded-lg border border-[#54B7FD]/50 bg-[#E8F0FD] px-4 py-3 text-sm text-[#022F8E] dark:border-[#54B7FD]/25 dark:bg-[#0450D5]/20 dark:text-[#CBDFFC]">
              <Info size={16} className="mt-0.5" />
              <span>
                {j.min_hari_sebelum > 0 &&
                  `Diajukan minimal H-${j.min_hari_sebelum}. `}
                {j.maks_hari_sesudah > 0 &&
                  `Boleh diajukan sampai ${j.maks_hari_sesudah} hari setelah tanggal mulai. `}
                {j.wajib_lampiran && "Wajib melampirkan dokumen."}
              </span>
            </p>
          )}

        {blackout.length > 0 && (
          <p className="col-span-full flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <TriangleAlert size={16} className="mt-0.5" />
            <span>
              Periode larangan cuti (selain cuti sakit):{" "}
              {blackout
                .map(
                  (b) =>
                    `${b.keterangan} (${b.mulai} s.d. ${b.selesai})`
                )
                .join("; ")}
            </span>
          </p>
        )}

        <Field
          label="Tanggal pengajuan (otomatis hari ini)"
          className="col-span-full"
        >
          <input
            value={new Date(hariIni() + "T00:00:00").toLocaleDateString(
              "id-ID",
              {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              }
            )}
            readOnly
            disabled
            className={field}
          />
        </Field>

        <Field label="Tanggal mulai">
          <input
            type="date"
            name="tanggal_mulai"
            min={tanggalMin}
            value={mulai}
            onChange={(e) => setMulai(e.target.value)}
            required
            className={field}
          />
        </Field>

        <Field label="Tanggal selesai">
          <input
            type="date"
            min={mulai || tanggalMin}
            value={akhir}
            onChange={(e) => setSelesai(e.target.value)}
            disabled={setengah}
            required
            className={field}
          />
        </Field>

        <div className="col-span-full space-y-1 rounded-lg border border-[#CBDFFC] bg-[#E8F0FD]/80 p-4 text-sm text-[#012677] dark:border-[#54B7FD]/20 dark:bg-[#0450D5]/15 dark:text-[#CBDFFC]">
          <p>
            Total hari kerja:{" "}
            <strong className="text-[#0450D5] dark:text-[#54B7FD]">{total}</strong> hari (Sabtu,
            Minggu, dan hari libur tidak dihitung)
          </p>
          {mulai && akhir && total === 0 && (
            <p className="text-rose-600">
              Tanggal tidak valid atau tidak memuat hari kerja.
            </p>
          )}

          {j?.memotong_kuota && (
            <p
              className={
                sisaSetelah < 0 ? "font-medium text-rose-600" : ""
              }
            >
              Sisa kuota tahunan: {Number(sisaKuota)} hari → setelah pengajuan
              ini: {sisaSetelah} hari
            </p>
          )}
        </div>

        <Field label="Alasan cuti" className="col-span-full">
          <textarea name="alasan" required rows={2} className={field} />
        </Field>

        <Field label="Rekan pengganti">
          <select name="handover_user_id" defaultValue="" className={field}>
            <option value="">Tidak ada</option>
            {rekan.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nama_lengkap}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Catatan serah tugas">
          <textarea name="catatan_tugas" rows={1} className={field} />
        </Field>

        <Field label="Alamat selama cuti">
          <input name="alamat_selama_cuti" className={field} />
        </Field>

        <Field label="Nomor darurat">
          <input name="nomor_darurat" inputMode="tel" className={field} />
        </Field>

        <Field
          label="Surat dokter / lampiran (PDF, JPG, PNG, maks. 900 KB)"
          className="col-span-full"
        >
          <input
            type="file"
            name="lampiran"
            accept=".pdf,.jpg,.jpeg,.png"
            required={Boolean(j?.wajib_lampiran)}
            className={field}
          />
        </Field>

        {error && (
          <div className="col-span-full">
            <Alert error={error} />
          </div>
        )}

        <div className="col-span-full flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={pending}
            className={btn("primary")}
          >
            {pending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
            {pending ? "Mengirim..." : "Kirim Pengajuan"}
          </button>

          <button type="reset" className={btn("secondary")}>
            <RotateCcw size={16} /> Bersihkan Formulir
          </button>

          <Link href="/cuti" className={btn("ghost")}>
            <X size={16} /> Batal
          </Link>
        </div>
      </form>
    </Card>
  );
}