"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarCheck,
  LogIn,
  Loader2,
  ShieldCheck,
  BriefcaseBusiness,
  Users,
  User,
  UserRound,
} from "lucide-react";

const PASSWORD_DEMO = "password123";
const AKUN = [
  { label: "Admin", email: "admin@sicuti.com", ikon: ShieldCheck },
  { label: "HRD", email: "hrd@sicuti.com", ikon: BriefcaseBusiness },
  { label: "Ketua Divisi TI", email: "ketua@sicuti.com", ikon: Users },
  { label: "Ketua Divisi Keuangan", email: "ketua2@sicuti.com", ikon: Users },
  { label: "Karyawan", email: "karyawan@sicuti.com", ikon: User },
  { label: "Karyawan < 1 tahun", email: "gita@sicuti.com", ikon: UserRound },
];

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [pesan, setPesan] = useState("");
  const [loading, setLoading] = useState(false);

  function isiAkun(email) {
    setIdentifier(email);
    setPassword(PASSWORD_DEMO);
    setPesan("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setPesan("");

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password, remember }),
    });
    const data = await res.json();

    if (!res.ok) {
      setPesan(data.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="flex-1 flex items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-sm space-y-4">
        <form onSubmit={handleSubmit} className="bg-slate-800 rounded-xl p-6 space-y-4">
          <h1 className="text-2xl font-bold text-white text-center">
            <CalendarCheck size={26} /> SiCuti
          </h1>
          <p className="text-sm text-slate-400 text-center">Sistem Manajemen Cuti Karyawan</p>

          <input
            type="text"
            placeholder="Email atau username"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            className="w-full rounded px-3 py-2 bg-slate-700 text-white"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded px-3 py-2 bg-slate-700 text-white"
          />

          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            Remember Me
          </label>

          {pesan && <p className="text-sm text-red-400">{pesan}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded px-4 py-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}{" "}
            {loading ? "Memproses..." : "Login"}
          </button>
        </form>

        <section className="bg-slate-800 rounded-xl p-4 space-y-3">
          <h2 className="text-sm font-semibold text-white">Akun Uji Cepat</h2>
          <p className="text-xs text-slate-400">
            Klik salah satu akun untuk mengisi form. Password semua akun: <code>{PASSWORD_DEMO}</code>
          </p>
          <div className="grid grid-cols-2 gap-2">
            {AKUN.map((a) => (
              <button
                key={a.email}
                type="button"
                onClick={() => isiAkun(a.email)}
                className="rounded border border-slate-600 px-3 py-2 text-left text-xs text-slate-200 hover:bg-slate-700"
              >
                <a.ikon size={14} /> {a.label}
                <span className="block text-slate-400">{a.email}</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}