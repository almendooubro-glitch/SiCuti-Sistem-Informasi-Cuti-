import Link from "next/link";
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
} from "lucide-react";
import TombolLogout from "@/components/TombolLogout";

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
    ["Persetujuan Final", "/verifikasi", ClipboardCheck],
    ["Pengaturan", "/pengaturan", Settings],
  ],
};

export default function Navbar({ user }) {
  return (
    <nav className="flex flex-wrap items-center justify-between gap-4 px-6 py-3 border-b border-slate-700">
      <div className="flex flex-wrap items-center gap-6">
        <span className="font-bold">
          <CalendarCheck size={18} /> SiCuti
        </span>
        <Link href="/dashboard" className="hover:underline">
          <LayoutDashboard size={16} /> Dashboard
        </Link>
        {(MENU[user.role] || []).map(([label, href, Ikon]) => (
          <Link key={href} href={href} className="hover:underline">
            <Ikon size={16} /> {label}
          </Link>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <Link href="/profil" className="text-sm hover:underline">
          <CircleUser size={16} /> {user.nama_lengkap}
        </Link>
        <TombolLogout />
      </div>
    </nav>
  );
}