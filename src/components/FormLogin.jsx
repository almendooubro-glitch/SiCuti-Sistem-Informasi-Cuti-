"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  LogIn,
  Loader2,
  ShieldCheck,
  BriefcaseBusiness,
  Users,
  User,
  UserRound,
  Eye,
  EyeOff,
} from "lucide-react";
import ToggleTema from "@/components/ToggleTema";
import { Alert, Card, Field, LABEL_ROLE, btn, field } from "@/components/ui";

const PASSWORD_DEMO = "password123";
const IKON = { admin: ShieldCheck, hrd: BriefcaseBusiness, ketua_divisi: Users, user: User };

export default function FormLogin({ akun }) {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [tampil, setTampil] = useState(false);
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
    <main className="relative flex flex-1 items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-sky-50 p-4 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      <div className="absolute right-4 top-4">
        <ToggleTema />
      </div>
      <div className="w-full max-w-md space-y-5">
        <div className="text-center">
          <img
            src="https://cdn.phototourl.com/anon/2026-11-19-cf7659f2-145b-4fda-b214-da8d53175397.png"
            alt="Logo SiCuti"
            className="mx-auto h-16 w-16 rounded-2xl object-cover shadow-lg shadow-indigo-600/30"
          />
          <h1 className="mt-4 text-2xl font-bold text-slate-900">SiCuti</h1>
          <p className="text-sm text-slate-500">Sistem Manajemen Cuti Karyawan</p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Email atau nama pengguna">
              <input
                type="text"
                placeholder="nama@sicuti.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                className={field}
              />
            </Field>
            <Field label="Kata sandi">
              <div className="relative">
                <input
                  type={tampil ? "text" : "password"}
                  placeholder="Masukkan kata sandi"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={`${field} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setTampil((v) => !v)}
                  aria-label={tampil ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                  aria-pressed={tampil}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-slate-400 transition hover:text-indigo-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  {tampil ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </Field>

            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              Ingat saya
            </label>

            <Alert error={pesan} />

            <button type="submit" disabled={loading} className={btn("primary", "md", "w-full")}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
              {loading ? "Memproses..." : "Masuk"}
            </button>
          </form>
        </Card>

        <Card className="space-y-3 p-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Akun Uji Cepat</h2>
            <p className="text-xs text-slate-500">
              Pilih akun untuk mengisi formulir. Kata sandi akun contoh: <code className="rounded bg-slate-100 px-1">{PASSWORD_DEMO}</code>
            </p>
          </div>
          <div className="grid max-h-72 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
            {akun.map((a) => {
              const Ikon = a.baru && a.role === "user" ? UserRound : IKON[a.role];
              return (
                <button
                  key={a.email}
                  type="button"
                  onClick={() => isiAkun(a.email)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-left text-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-indigo-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  <span className="flex items-center gap-1.5 font-medium text-slate-800">
                    <Ikon size={14} className="shrink-0 text-indigo-600" />
                    <span className="truncate">{a.nama_lengkap}</span>
                  </span>
                  <span className="block truncate text-slate-500">
                    {LABEL_ROLE[a.role]}
                    {a.divisi && ` · ${a.divisi}`}
                    {a.baru && a.role === "user" && " · < 1 tahun"}
                  </span>
                  <span className="block truncate text-slate-400">{a.email}</span>
                </button>
              );
            })}
          </div>
          {akun.length === 0 && <p className="text-sm text-slate-400">Belum ada akun.</p>}
        </Card>
      </div>
    </main>
  );
}