"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [pesan, setPesan] = useState("");
  const [loading, setLoading] = useState(false);

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
    <main className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-slate-800 rounded-xl p-6 space-y-4"
      >
        <h1 className="text-2xl font-bold text-white text-center">SiCuti</h1>
        <p className="text-sm text-slate-400 text-center">
          Sistem Manajemen Cuti Karyawan
        </p>

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
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          Remember Me
        </label>

        {pesan && <p className="text-sm text-red-400">{pesan}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded px-4 py-2"
        >
          {loading ? "Memproses..." : "Login"}
        </button>
      </form>
    </main>
  );
}