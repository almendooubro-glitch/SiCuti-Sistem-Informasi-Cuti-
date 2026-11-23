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
  Mail,
  LockKeyhole,
} from "lucide-react";
import ToggleTema from "@/components/ToggleTema";
import { Alert, Card, LABEL_ROLE, btn } from "@/components/ui";

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
    <main
      className="relative flex min-h-[calc(100vh-88px)] flex-1 items-center justify-center overflow-hidden bg-cover bg-center bg-no-repeat px-4 py-6 sm:px-6 sm:py-8"
      style={{
        backgroundImage:
          'url("https://cdn.phototourl.com/anon/2026-11-22-ea66e6cf-a649-4550-9621-47978ef94d62.jpg")',
      }}
    >
      <div className="absolute inset-0 bg-slate-950/[0.38] backdrop-blur-[1px] transition-colors duration-500 dark:bg-slate-950/[0.68]" />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/10 via-transparent to-slate-950/[0.45]" />
      <div className="absolute right-4 top-4 z-20 rounded-xl border border-white/25 bg-slate-950/20 p-1 backdrop-blur-md sm:right-6 sm:top-6 dark:border-white/10 dark:bg-slate-950/35">
        <ToggleTema />
      </div>

      <div className="relative z-10 w-full max-w-[440px] space-y-4">
        <header className="animate-[login-in_700ms_ease-out_both] text-center">
          <img
            src="https://cdn.phototourl.com/anon/2026-11-19-cf7659f2-145b-4fda-b214-da8d53175397.png"
            alt="Logo SiCuti"
            className="mx-auto h-14 w-14 rounded-2xl object-cover ring-1 ring-white/35 shadow-[0_12px_35px_rgba(15,23,42,0.35)] sm:h-16 sm:w-16"
          />
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-white drop-shadow-sm sm:text-[28px]">SiCuti</h1>
          <p className="mt-1 text-sm font-medium text-white/75">Sistem Manajemen Cuti Karyawan</p>
        </header>

        <Card className="animate-[login-in_700ms_100ms_ease-out_both] border-white/25 bg-white/[0.82] p-5 shadow-[0_24px_70px_rgba(15,23,42,0.28)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/[0.72] sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block space-y-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
              <span>Email atau nama pengguna</span>
              <span className="relative block">
                <Mail
                  size={18}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors dark:text-slate-400"
                />
                <input
                  type="text"
                  placeholder="nama@sicuti.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-300/80 bg-white/[0.65] py-3 pl-11 pr-3 text-sm text-slate-900 shadow-sm outline-none transition duration-200 placeholder:text-slate-400 hover:border-slate-400 focus:border-indigo-500 focus:bg-white/90 focus:ring-4 focus:ring-indigo-500/15 dark:border-white/10 dark:bg-white/[0.07] dark:text-white dark:placeholder:text-slate-400 dark:hover:border-white/20 dark:focus:border-indigo-400 dark:focus:bg-white/10"
                />
              </span>
            </label>

            <label className="block space-y-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
              <span>Kata sandi</span>
              <span className="relative block">
                <LockKeyhole
                  size={18}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-400"
                />
                <input
                  type={tampil ? "text" : "password"}
                  placeholder="Masukkan kata sandi"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-300/80 bg-white/[0.65] py-3 pl-11 pr-12 text-sm text-slate-900 shadow-sm outline-none transition duration-200 placeholder:text-slate-400 hover:border-slate-400 focus:border-indigo-500 focus:bg-white/90 focus:ring-4 focus:ring-indigo-500/15 dark:border-white/10 dark:bg-white/[0.07] dark:text-white dark:placeholder:text-slate-400 dark:hover:border-white/20 dark:focus:border-indigo-400 dark:focus:bg-white/10"
                />
                <button
                  type="button"
                  onClick={() => setTampil((v) => !v)}
                  aria-label={tampil ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                  aria-pressed={tampil}
                  className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-slate-400 transition hover:text-indigo-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-slate-400 dark:hover:text-indigo-300"
                >
                  {tampil ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </label>

            <label className="flex items-center gap-2 text-sm text-slate-600 transition dark:text-slate-300">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800"
              />
              Ingat saya
            </label>

            <Alert error={pesan} />

            <button
              type="submit"
              disabled={loading}
              className={btn("primary", "md", "w-full rounded-xl py-3 shadow-lg shadow-indigo-600/20")}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
              {loading ? "Memproses..." : "Masuk"}
            </button>
          </form>
        </Card>

        <Card className="animate-[login-in_700ms_200ms_ease-out_both] space-y-3 border-white/25 bg-white/[0.78] p-4 shadow-[0_18px_55px_rgba(15,23,42,0.24)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/[0.68]">
          <div>
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Akun Uji Cepat</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pilih akun untuk mengisi formulir. Kata sandi akun contoh: <code className="rounded-md bg-slate-900/[0.07] px-1.5 py-0.5 font-semibold dark:bg-white/10">{PASSWORD_DEMO}</code>
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
                  className="rounded-xl border border-slate-200/75 bg-white/45 px-3 py-2.5 text-left text-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-indigo-50/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-white/10 dark:bg-white/5 dark:hover:border-indigo-400/50 dark:hover:bg-indigo-400/10"
                >
                  <span className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-100">
                    <Ikon size={14} className="shrink-0 text-indigo-600 dark:text-indigo-300" />
                    <span className="truncate">{a.nama_lengkap}</span>
                  </span>
                  <span className="mt-0.5 block truncate text-slate-500 dark:text-slate-400">
                    {LABEL_ROLE[a.role]}
                    {a.divisi && ` · ${a.divisi}`}
                    {a.baru && a.role === "user" && " · < 1 tahun"}
                  </span>
                  <span className="mt-0.5 block truncate text-slate-400 dark:text-slate-500">{a.email}</span>
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