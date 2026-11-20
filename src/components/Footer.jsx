import { CalendarCheck, Sparkles } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-slate-200 bg-white px-4 py-6 sm:px-6">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500"
      />
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100">
            <CalendarCheck size={20} />
          </span>
          <div>
            <p className="font-bold text-slate-900">SiCuti</p>
            <p className="text-xs text-slate-500">Sistem Manajemen Cuti Karyawan</p>
          </div>
        </div>
        <div className="flex flex-col items-center gap-2 text-xs text-slate-500 sm:items-end">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1 font-medium text-sky-700">
            <Sparkles size={14} /> Pengelolaan cuti yang lebih mudah
          </span>
          <p>&copy; 2026 SiCuti. Hak cipta dilindungi.</p>
        </div>
      </div>
    </footer>
  );
}