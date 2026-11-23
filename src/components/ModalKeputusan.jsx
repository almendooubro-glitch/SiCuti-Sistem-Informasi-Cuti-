"use client";

import { useRef } from "react";
import { Check, X } from "lucide-react";
import { btn, field } from "@/components/ui";

export default function ModalKeputusan({ action, id, aksi, label, judul }) {
  const ref = useRef(null);
  const tolak = aksi === "rejected";
  const varian = tolak ? "danger" : "success";

  return (
    <>
      <button type="button" onClick={() => ref.current.showModal()} className={btn(varian)}>
        {tolak ? <X size={16} /> : <Check size={16} />} {label}
      </button>

      <dialog
        ref={ref}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-[#CBDFFC] bg-[#FEFEFE] p-0 text-[#012677] shadow-2xl dark:border-[#54B7FD]/25 dark:bg-[#022F8E] dark:text-[#FEFEFE]"
      >
        <form action={action} className="space-y-4 p-6">
          <h3 className="text-lg font-semibold text-[#012677] dark:text-[#FEFEFE]">{judul}</h3>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="aksi" value={aksi} />
          <textarea
            name="catatan"
            rows={3}
            required={tolak}
            placeholder={tolak ? "Alasan penolakan (wajib)" : "Catatan (opsional)"}
            className={field}
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => ref.current.close()} className={btn("secondary")}>
              Batal
            </button>
            <button type="submit" className={btn(varian)}>
              <Check size={16} /> Konfirmasi
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}