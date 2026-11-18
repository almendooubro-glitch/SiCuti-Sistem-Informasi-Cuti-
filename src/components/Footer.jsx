import { CalendarCheck } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white px-4 py-4 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-1 text-center text-sm text-slate-500 sm:flex-row sm:text-left">
        <p className="flex flex-wrap items-center justify-center gap-2">
          <span className="flex items-center gap-1.5 font-semibold text-indigo-700">
            <CalendarCheck size={16} /> SiCuti
          </span>
          <span>Sistem Manajemen Cuti Karyawan</span>
        </p>
        <p>&copy; 2026 SiCuti. All rights reserved.</p>
      </div>
    </footer>
  );
}