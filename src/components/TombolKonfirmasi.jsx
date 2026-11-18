"use client";

import { Trash2, UserMinus } from "lucide-react";
import { btn } from "@/components/ui";

export default function TombolKonfirmasi({ action, fields, label, pesan, pesan2, ikon }) {
  const Ikon = ikon === "keluar" ? UserMinus : Trash2;

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(pesan) || (pesan2 && !confirm(pesan2))) e.preventDefault();
      }}
    >
      {Object.entries(fields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <button type="submit" className={btn("dangerGhost", "sm")}>
        <Ikon size={14} /> {label}
      </button>
    </form>
  );
}