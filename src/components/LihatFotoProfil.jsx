"use client";

import { useRef } from "react";
import { Eye, X } from "lucide-react";
import Image from "next/image";

export default function LihatFotoProfil({ id, nama, size = "h-10 w-10" }) {
  const dialogRef = useRef(null);
  const src = `/api/foto?id=${id}`;

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        aria-label={`Lihat foto profil ${nama}`}
        title="Lihat foto profil"
        className={`group relative block ${size} shrink-0 overflow-hidden rounded-full ring-2 ring-white focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2893FC]`}
      >
        <Image src={src} alt={`Foto ${nama}`} fill unoptimized sizes="96px" className="object-cover" />
        <span className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-[#0450D5] text-white ring-2 ring-[#FEFEFE] transition group-hover:scale-110 dark:bg-[#54B7FD] dark:text-[#012677]">
          <Eye size={12} />
        </span>
      </button>
      <dialog
        ref={dialogRef}
        aria-label={`Foto profil ${nama}`}
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
        className="fixed inset-0 m-auto max-h-[90vh] max-w-[90vw] overflow-visible border-0 bg-transparent p-0 text-inherit backdrop:bg-slate-950/80"
      >
        <div className="relative flex h-[85vh] w-[85vw] max-h-[90vh] max-w-[90vw] items-center justify-center">
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label="Tutup foto"
            className="absolute -right-3 -top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-800 shadow-lg transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2893FC] dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
          >
            <X size={20} />
          </button>
          <Image
            src={src}
            alt={`Foto profil ${nama}`}
            fill
            unoptimized
            sizes="85vw"
            className="object-contain"
          />
        </div>
      </dialog>
    </>
  );
}
