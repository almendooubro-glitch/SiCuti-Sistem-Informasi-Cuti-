"use client";

import { useRef } from "react";
import { Check, X } from "lucide-react";

export default function ModalKeputusan({ action, id, aksi, label, judul }) {
  const ref = useRef(null);
  const tolak = aksi === "rejected";

  return (
    <>
      <button
        type="button"
        onClick={() => ref.current.showModal()}
        className={`${tolak ? "bg-red-600" : "bg-green-600"} text-white rounded px-4 py-2 text-sm`}
      >
        {tolak ? <X size={16} /> : <Check size={16} />} {label}
      </button>

      <dialog ref={ref} className="m-auto w-full max-w-md rounded-lg bg-slate-800 p-5 text-white backdrop:bg-black/60">
        <form action={action} className="space-y-3">
          <h3 className="font-semibold">{judul}</h3>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="aksi" value={aksi} />
          <textarea
            name="catatan"
            rows={3}
            required={tolak}
            placeholder={tolak ? "Alasan penolakan (wajib)" : "Catatan (opsional)"}
            className="w-full rounded border border-slate-600 bg-slate-700 px-3 py-2"
          />
          <div className="flex gap-3">
            <button type="submit" className={`${tolak ? "bg-red-600" : "bg-green-600"} text-white rounded px-4 py-2`}>
              <Check size={16} /> Konfirmasi
            </button>
            <button type="button" onClick={() => ref.current.close()} className="px-4 py-2 hover:underline">
              Batal
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}