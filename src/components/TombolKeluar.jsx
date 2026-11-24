"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { btn } from "@/components/KomponenUmum";

export default function TombolLogout() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button onClick={handleLogout} className={btn("secondary", "md", "w-full")}>
      <LogOut size={16} /> Keluar
    </button>
  );
}