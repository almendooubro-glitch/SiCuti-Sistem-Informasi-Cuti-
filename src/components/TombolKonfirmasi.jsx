"use client";

export default function TombolKonfirmasi({ action, fields, label, pesan, pesan2 }) {
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
      <button type="submit" className="text-red-500 hover:underline">
        {label}
      </button>
    </form>
  );
}