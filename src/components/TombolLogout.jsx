"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function TombolLogout() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="bg-red-600 hover:bg-red-700 text-white rounded px-4 py-2"
    >
      <LogOut size={16} /> Logout
    </button>
  );
}