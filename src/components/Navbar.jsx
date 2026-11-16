import Link from "next/link";
import TombolLogout from "@/components/TombolLogout";

export default function Navbar({ user }) {
  return (
    <nav className="flex items-center justify-between gap-4 px-6 py-3 border-b border-slate-700">
      <div className="flex items-center gap-6">
        <span className="font-bold">SiCuti</span>
        <Link href="/dashboard" className="hover:underline">
          Dashboard
        </Link>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm">{user.nama_lengkap}</span>
        <TombolLogout />
      </div>
    </nav>
  );
}