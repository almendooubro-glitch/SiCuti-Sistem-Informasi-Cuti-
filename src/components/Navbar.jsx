import Link from "next/link";
import TombolLogout from "@/components/TombolLogout";

const MENU = {
  admin: [
    ["Pengguna", "/pengguna"],
    // ["Divisi", "/divisi"],        ← aktifkan di Langkah 4
    // ["Jenis Cuti", "/jenis-cuti"], ← aktifkan di Langkah 5
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
        <span className="text-sm">{user.nama_lengkap}</span>
        <TombolLogout />
      </div>
    </nav>
  );
}