"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { btn } from "@/components/ui";

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
    ? btn("secondary", "md", "w-full")
    : "rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500";

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