import { CircleAlert, CircleCheck } from "lucide-react";

export const LABEL_ROLE = { admin: "Admin", user: "Karyawan", ketua_divisi: "Ketua Divisi", hrd: "HRD" };

const ROLE_STYLE = {
  admin: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
  hrd: "bg-sky-50 text-sky-700 ring-sky-600/20",
  ketua_divisi: "bg-slate-100 text-slate-700 ring-slate-500/20",
  user: "bg-slate-50 text-slate-600 ring-slate-500/20",
};

export const STATUS = {
  pending: ["Menunggu Persetujuan", "bg-amber-50 text-amber-700 ring-amber-600/20"],
  approved_leader: ["Disetujui Ketua Divisi", "bg-sky-50 text-sky-700 ring-sky-600/20"],
  approved: ["Disetujui", "bg-emerald-50 text-emerald-700 ring-emerald-600/20"],
  rejected: ["Ditolak", "bg-rose-50 text-rose-700 ring-rose-600/20"],
  cancelled: ["Dibatalkan", "bg-slate-100 text-slate-600 ring-slate-500/20"],
};
export const STATUS_LABEL = Object.fromEntries(Object.entries(STATUS).map(([k, v]) => [k, v[0]]));

export const tgl = (d) => new Date(d).toLocaleDateString("id-ID");

export const PAGE = "mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium shadow-sm transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50";
const SIZE = { md: "px-4 py-2 text-sm", sm: "px-2.5 py-1.5 text-xs" };
const VARIAN = {
  primary: "bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:ring-indigo-500",
  secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200 focus-visible:ring-slate-400",
  success: "bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-500",
  danger: "bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-500",
  warning: "bg-amber-500 text-white hover:bg-amber-600 focus-visible:ring-amber-500",
  ghost: "text-indigo-600 shadow-none hover:bg-indigo-50 focus-visible:ring-indigo-500",
  dangerGhost: "text-rose-600 shadow-none hover:bg-rose-50 focus-visible:ring-rose-500",
};
export const btn = (varian = "primary", ukuran = "md", extra = "") =>
  `${BASE} ${SIZE[ukuran]} ${VARIAN[varian]} ${extra}`;

export const field =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:bg-slate-100 disabled:text-slate-500 file:mr-3 file:rounded-md file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100";
export const filterField = `${field} sm:w-auto`;

export const TABLE = "w-full text-left text-sm";
export const TH = "bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500";
export const TD = "px-4 py-3 text-slate-700";
export const TR = "border-t border-slate-100 transition-colors hover:bg-indigo-50/40";

const HOVER = "transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md";
const PILL = "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset";

export function Card({ className = "", hover = false, children }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white shadow-sm ${hover ? HOVER : ""} ${className}`}>
      {children}
    </div>
  );
}

export function Panel({ ikon: Ikon, judul, aksi, className = "", flush = false, children }) {
  return (
    <Card className={`overflow-hidden ${className}`}>
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
        <h2 className="flex items-center gap-2 font-semibold text-slate-800">
          {Ikon && <Ikon size={18} className="text-indigo-600" />} {judul}
        </h2>
        {aksi}
      </div>
      <div className={flush ? "" : "p-5"}>{children}</div>
    </Card>
  );
}

export function PageHeader({ ikon: Ikon, judul, sub, children }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
          <Ikon size={22} />
        </span>
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">{judul}</h1>
          {sub && <p className="text-sm text-slate-500">{sub}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

const TONE = {
  indigo: "bg-indigo-50 text-indigo-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  rose: "bg-rose-50 text-rose-600",
  sky: "bg-sky-50 text-sky-600",
  slate: "bg-slate-100 text-slate-600",
};

export function StatCard({ judul, nilai, ikon: Ikon, tone = "indigo" }) {
  return (
    <Card hover className="flex items-center gap-4 p-4">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${TONE[tone]}`}>
        <Ikon size={22} />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-slate-500">{judul}</p>
        <p className="truncate text-xl font-bold text-slate-900">{nilai}</p>
      </div>
    </Card>
  );
}

export function Badge({ status }) {
  const [label, gaya] = STATUS[status];
  return (
    <span className={`${PILL} ${gaya}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" /> {label}
    </span>
  );
}

export function RoleBadge({ role }) {
  return <span className={`${PILL} ${ROLE_STYLE[role]}`}>{LABEL_ROLE[role]}</span>;
}

export function ActiveBadge({ aktif }) {
  return (
    <span
      className={`${PILL} ${
        aktif ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20" : "bg-slate-100 text-slate-600 ring-slate-500/20"
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" /> {aktif ? "Aktif" : "Tidak aktif"}
    </span>
  );
}

export function Alert({ error, info }) {
  if (!error && !info) return null;
  const gagal = Boolean(error);
  const Ikon = gagal ? CircleAlert : CircleCheck;
  return (
    <div
      role="alert"
      className={`flex items-start gap-2 rounded-lg border px-4 py-3 text-sm ${
        gagal ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"
      }`}
    >
      <Ikon size={18} className="mt-0.5" />
      <span>{error || info}</span>
    </div>
  );
}

export function Field({ label, className = "", children }) {
  return (
    <label className={`block space-y-1.5 text-sm font-medium text-slate-700 ${className}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}

export function Avatar({ id, ada, nama, size = "h-10 w-10", teks = "text-sm" }) {
  return ada ? (
    <img src={`/api/foto?id=${id}`} alt={`Foto ${nama}`} className={`${size} shrink-0 rounded-full object-cover ring-2 ring-white`} />
  ) : (
    <div className={`${size} ${teks} flex shrink-0 items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700`}>
      {nama[0]}
    </div>
  );
}

export function Progress({ sisa, total }) {
  const persen = total > 0 ? Math.max(0, Math.min(100, (sisa / total) * 100)) : 0;
  const warna = persen > 50 ? "bg-emerald-500" : persen > 20 ? "bg-amber-500" : "bg-rose-500";
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={Math.round(persen)} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-full rounded-full transition-all duration-500 ${warna}`} style={{ width: `${persen}%` }} />
    </div>
  );
}

export function Kosong({ children }) {
  return <p className="px-5 py-6 text-center text-sm text-slate-400">{children}</p>;
}