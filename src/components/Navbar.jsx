import Link from "next/link";
import TombolLogout from "@/components/TombolLogout";

const MENU = {
  admin: [
    ["Pengguna", "/pengguna"],
    ["Divisi", "/divisi"],
    ["Jenis Cuti", "/jenis-cuti"],
    ["Pengaturan", "/pengaturan"],
  ],
  user: [["Cuti Saya", "/cuti"]],
  ketua_divisi: [
    ["Cuti Saya", "/cuti"],
    ["Verifikasi", "/verifikasi"],
  ],
  hrd: [
    ["Persetujuan Final", "/verifikasi"],
    ["Pengaturan", "/pengaturan"],
  ],
};

export default function Navbar({ user }) {
  return (
    <nav className="flex items-center justify-between gap-4 px-6 py-3 border-b border-slate-700">
      <div className="flex items-center gap-6">
        <span className="font-bold">SiCuti</span>
        <Link href="/dashboard" className="hover:underline">
          Dashboard
        </Link>
        {(MENU[user.role] || []).map(([label, href]) => (
          <Link key={href} href={href} className="hover:underline">
            {label}
          </Link>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <Link href="/profil" className="text-sm hover:underline">
          {user.nama_lengkap}
        </Link>
        <TombolLogout />
      </div>
    </nav>
  );
}