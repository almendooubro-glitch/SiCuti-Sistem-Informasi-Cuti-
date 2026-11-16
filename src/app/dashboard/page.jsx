import { requireUser } from "@/lib/session";
import TombolLogout from "@/components/TombolLogout";

export const dynamic = "force-dynamic";

const LABEL_ROLE = {
  admin: "Admin",
  user: "Karyawan",
  ketua_divisi: "Ketua Divisi",
  hrd: "HRD",
};

export default async function DashboardPage() {
  const user = await requireUser();

  return (
    <main className="max-w-2xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p>
        Selamat datang, <strong>{user.nama_lengkap}</strong> (
        {LABEL_ROLE[user.role]})
      </p>
      <TombolLogout />
    </main>
  );
}