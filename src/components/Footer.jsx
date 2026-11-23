import { CalendarCheck, Sparkles } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-[#54B7FD]/20 bg-[#012677] px-4 py-6 text-[#FEFEFE] sm:px-6 dark:border-[#54B7FD]/15 dark:bg-[#012677]">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#022F8E] via-[#2893FC] to-[#54B7FD]"
      />
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#2893FC] to-[#54B7FD] text-[#012677] ring-1 ring-[#54B7FD]/30 dark:bg-[#0450D5]/25 dark:text-[#54B7FD] dark:ring-[#54B7FD]/20">
            <CalendarCheck size={20} />
          </span>
          <div>
            <p className="font-bold text-[#FEFEFE]">SiCuti</p>
            <p className="text-xs text-[#CBDFFC]">Sistem Manajemen Cuti Karyawan</p>
          </div>
        </div>
        <div className="flex flex-col items-center gap-2 text-xs text-[#CBDFFC] sm:items-end">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0450D5]/35 px-3 py-1 font-medium text-[#54B7FD] dark:bg-[#0450D5]/25 dark:text-[#54B7FD]">
            <Sparkles size={14} /> Pengelolaan cuti yang lebih mudah
          </span>
          <p>&copy; 2026 SiCuti. Hak cipta dilindungi.</p>
        </div>
      </div>
    </footer>
  );
}