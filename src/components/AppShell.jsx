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
        className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
          on
            ? "bg-gradient-to-r from-indigo-50 to-sky-50 font-semibold text-indigo-800 ring-1 ring-indigo-100 dark:from-indigo-950 dark:to-sky-950 dark:ring-indigo-900"
            : "text-slate-600 hover:translate-x-0.5 hover:bg-slate-100 hover:text-slate-900"
        }`}
      >
        {on && <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r bg-indigo-600" />}
        <Ikon size={18} className={on ? "text-indigo-600" : "text-slate-400 group-hover:text-indigo-600"} />
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
        className={`fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-sky-600 text-white shadow-md shadow-indigo-600/20">
              <CalendarCheck size={20} />
            </span>
            <div className="leading-tight">
              <p className="font-bold text-slate-900">SiCuti</p>
              <p className="text-xs text-slate-500">Manajemen Cuti</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Tutup menu"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
          <div className="space-y-1">
            <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Menu</p>
            {menu.map(item)}
          </div>
          <div className="space-y-1">
            <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Akun</p>
            {akun.map(item)}
          </div>
        </nav>

        <div className="space-y-3 border-t border-slate-100 p-4">
          <div className="flex items-center gap-3">
            <Avatar id={user.id} ada={adaFoto} nama={user.nama_lengkap} />
            <div className="min-w-0 space-y-1">
              <p className="truncate text-sm font-semibold text-slate-800">{user.nama_lengkap}</p>
              <RoleBadge role={user.role} />
            </div>
          </div>
          <ToggleTema penuh />
          <TombolLogout />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Buka menu"
            className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <Menu size={22} />
          </button>
          <span className="flex items-center gap-2 font-bold text-indigo-700">
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