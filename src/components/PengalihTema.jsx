"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

function ikutiTema(callback) {
  const pengamat = new MutationObserver(callback);
  pengamat.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => pengamat.disconnect();
}

function ambilTema() {
  return document.documentElement.classList.contains("dark");
}

function ambilTemaAwal() {
  return false;
}

export default function ToggleTema({ penuh = false }) {
  const gelap = useSyncExternalStore(ikutiTema, ambilTema, ambilTemaAwal);

  function ganti() {
    const temaGelap = !ambilTema();
    document.documentElement.classList.toggle("dark", temaGelap);
    try {
      localStorage.setItem("sicuti-tema", temaGelap ? "dark" : "light");
    } catch (error) {
      console.error("Gagal menyimpan preferensi tema:", error);
    }
  }

  const gaya = penuh
    ? "inline-flex w-full items-center justify-center rounded-xl border border-[#54B7FD]/50 bg-[#CBDFFC] px-4 py-2 text-sm font-semibold text-[#012677] shadow-sm transition-all duration-200 hover:border-[#2893FC] hover:bg-[#54B7FD] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2893FC] active:scale-[0.98] dark:border-[#54B7FD]/30 dark:bg-[#022F8E] dark:text-[#FEFEFE] dark:hover:border-[#54B7FD] dark:hover:bg-[#0450D5]"
    : "flex h-10 w-10 items-center justify-center rounded-xl bg-[#CBDFFC] p-2.5 text-[#022F8E] transition-colors duration-200 hover:bg-[#54B7FD] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2893FC] active:scale-95 dark:bg-[#022F8E] dark:text-[#FEFEFE] dark:hover:bg-[#0450D5]";

  return (
    <button
      type="button"
      onClick={ganti}
      title={gelap ? "Aktifkan mode siang" : "Aktifkan mode malam"}
      aria-label={gelap ? "Aktifkan mode siang" : "Aktifkan mode malam"}
      aria-pressed={gelap}
      className={gaya}
    >
      <span className="dark:hidden">
        <Moon size={18} className={penuh ? "mr-2" : ""} />
        {penuh && "Mode Malam"}
      </span>
      <span className="hidden dark:inline">
        <Sun size={18} className={penuh ? "mr-2" : ""} />
        {penuh && "Mode Siang"}
      </span>
    </button>
  );
}