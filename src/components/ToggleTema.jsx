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
    ? "inline-flex w-full items-center justify-center rounded-xl border border-[#CBDFFC]/60 bg-[#FEFEFE]/10 px-4 py-2 text-sm font-semibold text-[#FEFEFE] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#54B7FD] hover:bg-[#0450D5] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2893FC] active:translate-y-0"
    : "rounded-xl border border-[#CBDFFC]/80 bg-[#FEFEFE]/90 p-2.5 text-[#022F8E] shadow-md shadow-[#012677]/20 backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-[#2893FC] hover:bg-[#0F67ED] hover:text-[#FEFEFE] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2893FC] focus-visible:ring-offset-2 focus-visible:ring-offset-[#012677]/40 active:translate-y-0 dark:border-[#54B7FD]/35 dark:bg-[#012677]/90 dark:text-[#54B7FD] dark:shadow-[#012677]/40 dark:hover:border-[#2893FC] dark:hover:bg-[#0450D5] dark:hover:text-[#FEFEFE]";

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