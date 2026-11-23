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
import { Alert, Card, LABEL_ROLE } from "@/components/ui";

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
      <div className="absolute right-4 top-4 z-20 rounded-xl border border-[#54B7FD]/40 bg-[#012677]/70 p-1 text-[#FEFEFE] backdrop-blur-md sm:right-6 sm:top-6 [&_button]:rounded-lg [&_button]:text-[#FEFEFE] [&_button]:hover:bg-[#0450D5]/50">
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

        <Card className="animate-[login-in_700ms_100ms_ease-out_both] border-[#2893FC]/35 bg-[#022F8E]/95 p-5 shadow-[0_24px_70px_rgba(1,38,119,0.42)] backdrop-blur-xl dark:border-[#54B7FD]/25 dark:bg-[#012677]/95 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block space-y-2 text-sm font-semibold text-[#CBDFFC]">
              <span>Email atau nama pengguna</span>
              <span className="relative block">
                <Mail
                  size={18}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#54B7FD] transition-colors"
                />
                <input
                  type="text"
                  placeholder="nama@sicuti.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  className="w-full rounded-xl border border-[#CBDFFC]/60 bg-[#012677]/70 py-3 pl-11 pr-3 text-sm text-[#FEFEFE] shadow-sm outline-none transition duration-200 placeholder:text-[#CBDFFC]/70 hover:border-[#54B7FD] focus:border-[#2893FC] focus:bg-[#012677]/85 focus:ring-4 focus:ring-[#2893FC]/25"
                />
              </span>
            </label>

            <label className="block space-y-2 text-sm font-semibold text-[#CBDFFC]">
              <span>Kata sandi</span>
              <span className="relative block">
                <LockKeyhole
                  size={18}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#54B7FD]"
                />
                <input
                  type={tampil ? "text" : "password"}
                  placeholder="Masukkan kata sandi"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-xl border border-[#CBDFFC]/60 bg-[#012677]/70 py-3 pl-11 pr-12 text-sm text-[#FEFEFE] shadow-sm outline-none transition duration-200 placeholder:text-[#CBDFFC]/70 hover:border-[#54B7FD] focus:border-[#2893FC] focus:bg-[#012677]/85 focus:ring-4 focus:ring-[#2893FC]/25"
                />
                <button
                  type="button"
                  onClick={() => setTampil((v) => !v)}
                  aria-label={tampil ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                  aria-pressed={tampil}
                  className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-[#54B7FD] transition hover:text-[#2893FC] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2893FC]"
                >
                  {tampil ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </label>

            <label className="flex items-center gap-2 text-sm text-[#CBDFFC] transition">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-[#CBDFFC] bg-[#012677] text-[#2893FC] focus:ring-[#2893FC]"
              />
              Ingat saya
            </label>

            <Alert error={pesan} />

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#022F8E] to-[#0450D5] px-4 py-3 text-sm font-semibold text-[#FEFEFE] shadow-lg shadow-[#012677]/35 transition-all duration-200 hover:-translate-y-0.5 hover:from-[#0450D5] hover:to-[#0F67ED] hover:shadow-[#2893FC]/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2893FC] focus-visible:ring-offset-2 focus-visible:ring-offset-[#022F8E] active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
              {loading ? "Memproses..." : "Masuk"}
            </button>
          </form>
        </Card>

        <Card className="animate-[login-in_700ms_200ms_ease-out_both] space-y-3 border-[#2893FC]/30 bg-[#012677]/95 p-4 shadow-[0_18px_55px_rgba(1,38,119,0.38)] backdrop-blur-xl dark:border-[#54B7FD]/20 dark:bg-[#012677]/95">
          <div>
            <h2 className="text-sm font-semibold text-[#FEFEFE]">Akun Uji Cepat</h2>
            <p className="text-xs text-[#CBDFFC]">
              Pilih akun untuk mengisi formulir. Kata sandi akun contoh: <code className="rounded-md bg-[#2893FC]/20 px-1.5 py-0.5 font-semibold text-[#FEFEFE]">{PASSWORD_DEMO}</code>
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
                  className="rounded-xl border border-[#54B7FD]/20 bg-[#022F8E]/80 px-3 py-2.5 text-left text-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-[#2893FC] hover:bg-[#0450D5]/75 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2893FC]"
                >
                  <span className="flex items-center gap-1.5 font-semibold text-[#FEFEFE]">
                    <Ikon size={14} className="shrink-0 text-[#54B7FD]" />
                    <span className="truncate">{a.nama_lengkap}</span>
                  </span>
                  <span className="mt-0.5 block truncate text-[#CBDFFC]">
                    {LABEL_ROLE[a.role]}
                    {a.divisi && ` · ${a.divisi}`}
                    {a.baru && a.role === "user" && " · < 1 tahun"}
                  </span>
                  <span className="mt-0.5 block truncate text-[#54B7FD]">{a.email}</span>
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