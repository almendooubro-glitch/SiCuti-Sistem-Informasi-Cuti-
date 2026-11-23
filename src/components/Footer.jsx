import { CalendarCheck, Sparkles } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-[#CBDFFC] bg-[#FEFEFE] px-4 py-6 sm:px-6 dark:border-[#54B7FD]/15 dark:bg-[#012677]">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#022F8E] via-[#2893FC] to-[#54B7FD]"
      />
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F0FD] text-[#0450D5] ring-1 ring-[#CBDFFC] dark:bg-[#0450D5]/25 dark:text-[#54B7FD] dark:ring-[#54B7FD]/20">
            <CalendarCheck size={20} />
          </span>
          <div>
            <p className="font-bold text-[#012677] dark:text-[#FEFEFE]">SiCuti</p>
            <p className="text-xs text-[#022F8E]/70 dark:text-[#CBDFFC]">Sistem Manajemen Cuti Karyawan</p>
          </div>
        </div>
        <div className="flex flex-col items-center gap-2 text-xs text-[#022F8E]/70 sm:items-end dark:text-[#CBDFFC]">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#CBDFFC] px-3 py-1 font-medium text-[#0450D5] dark:bg-[#0450D5]/25 dark:text-[#54B7FD]">
            <Sparkles size={14} /> Pengelolaan cuti yang lebih mudah
          </span>
          <p>&copy; 2026 SiCuti. Hak cipta dilindungi.</p>
        </div>
      </div>
    </footer>
  );
}