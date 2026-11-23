"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarCheck,
  LayoutDashboard,
  Users,
  Building2,
  Tags,
  Settings,
  CalendarDays,
  ClipboardCheck,
  CircleUser,
  Menu,
  X,
} from "lucide-react";
import TombolLogout from "@/components/TombolLogout";
import ToggleTema from "@/components/ToggleTema";
import { Avatar, RoleBadge } from "@/components/ui";

const MENU = {
  admin: [
    ["Pengguna", "/pengguna", Users],
    ["Divisi", "/divisi", Building2],
    ["Jenis Cuti", "/jenis-cuti", Tags],
    ["Pengaturan", "/pengaturan", Settings],
  ],
  user: [["Cuti Saya", "/cuti", CalendarDays]],
  ketua_divisi: [
    ["Cuti Saya", "/cuti", CalendarDays],
    ["Verifikasi", "/verifikasi", ClipboardCheck],
  ],
  hrd: [
    ["Persetujuan Akhir", "/verifikasi", ClipboardCheck],
    ["Pengaturan", "/pengaturan", Settings],
  ],
};

export default function AppShell({ user, adaFoto, footer, children }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menu = [["Beranda", "/dashboard", LayoutDashboard], ...(MENU[user.role] || [])];
  const akun = [["Profil Saya", "/profil", CircleUser]];
  const aktif = (href) => pathname === href || pathname.startsWith(`${href}/`);

  const item = ([label, href, Ikon]) => {
    const on = aktif(href);
    return (
      <Link
        key={href}
        href={href}
        onClick={() => setOpen(false)}
        aria-current={on ? "page" : undefined}
        className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2893FC] ${
          on
            ? "bg-gradient-to-r from-[#0450D5] to-[#0F67ED] font-semibold text-[#FEFEFE] shadow-sm shadow-[#012677]/20 ring-1 ring-[#54B7FD]/35"
            : "text-[#CBDFFC] hover:translate-x-0.5 hover:bg-[#0450D5]/35 hover:text-[#FEFEFE]"
        }`}
      >
        {on && <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r bg-[#54B7FD]" />}
        <Ikon size={18} className={on ? "text-[#FEFEFE]" : "text-[#54B7FD] group-hover:text-[#FEFEFE]"} />
        {label}
      </Link>
    );
  };

  return (
    <div className="flex min-h-screen">
      {open && (
        <div className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col border-r border-[#54B7FD]/20 bg-[#012677] text-[#FEFEFE] transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-[#54B7FD]/20 px-4 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#2893FC] to-[#54B7FD] text-[#012677] shadow-md shadow-[#012677]/30">
              <CalendarCheck size={20} />
            </span>
            <div className="leading-tight">
              <p className="font-bold text-[#FEFEFE]">SiCuti</p>
              <p className="text-xs text-[#CBDFFC]">Manajemen Cuti</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Tutup menu"
            className="rounded-lg p-1.5 text-[#CBDFFC] hover:bg-[#0450D5]/50 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
          <div className="space-y-1">
            <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-[#54B7FD]">Menu</p>
            {menu.map(item)}
          </div>
          <div className="space-y-1">
            <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-[#54B7FD]">Akun</p>
            {akun.map(item)}
          </div>
        </nav>

        <div className="space-y-3 border-t border-[#54B7FD]/20 p-4">
          <div className="flex items-center gap-3">
            <Avatar id={user.id} ada={adaFoto} nama={user.nama_lengkap} />
            <div className="min-w-0 space-y-1">
              <p className="truncate text-sm font-semibold text-[#FEFEFE]">{user.nama_lengkap}</p>
              <RoleBadge role={user.role} />
            </div>
          </div>
          <ToggleTema penuh />
          <TombolLogout />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-[#CBDFFC] bg-[#FEFEFE]/95 px-4 py-3 text-[#012677] backdrop-blur lg:hidden dark:border-[#54B7FD]/20 dark:bg-[#012677]/95 dark:text-[#FEFEFE]">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Buka menu"
            className="rounded-lg p-2 text-[#022F8E] transition hover:bg-[#E8F0FD] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2893FC] dark:text-[#CBDFFC] dark:hover:bg-[#0450D5]/30"
          >
            <Menu size={22} />
          </button>
          <span className="flex items-center gap-2 font-bold text-[#0450D5] dark:text-[#54B7FD]">
            <CalendarCheck size={20} /> SiCuti
          </span>
          <div className="ml-auto">
            <ToggleTema />
          </div>
        </header>

        <div className="flex-1">{children}</div>
        {footer}
      </div>
    </div>
  );
}