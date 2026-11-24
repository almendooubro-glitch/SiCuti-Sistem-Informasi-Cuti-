import { CircleAlert, CircleCheck } from "lucide-react";

export const LABEL_ROLE = { admin: "Admin", user: "Karyawan", ketua_divisi: "Ketua Divisi", hrd: "HRD" };

const ROLE_STYLE = {
  admin: "bg-[#CBDFFC] text-[#012677] ring-[#54B7FD]/40 dark:bg-[#0450D5]/25 dark:text-[#CBDFFC] dark:ring-[#54B7FD]/20",
  hrd: "bg-[#54B7FD]/35 text-[#012677] ring-[#2893FC]/40 dark:bg-[#2893FC]/20 dark:text-[#CBDFFC] dark:ring-[#54B7FD]/20",
  ketua_divisi: "bg-[#CBDFFC] text-[#022F8E] ring-[#54B7FD]/40 dark:bg-[#0450D5]/25 dark:text-[#CBDFFC] dark:ring-[#54B7FD]/20",
  user: "bg-[#54B7FD]/35 text-[#012677] ring-[#2893FC]/40 dark:bg-[#2893FC]/20 dark:text-[#CBDFFC] dark:ring-[#54B7FD]/20",
};

export const STATUS = {
  pending: ["Menunggu Persetujuan", "bg-amber-50 text-amber-800 ring-amber-600/30 dark:bg-amber-950/70 dark:text-amber-200 dark:ring-amber-400/30"],
  approved_leader: ["Disetujui Ketua Divisi", "bg-[#E8F0FD] text-[#0450D5] ring-[#54B7FD]/40 dark:bg-[#0450D5]/25 dark:text-[#CBDFFC] dark:ring-[#54B7FD]/30"],
  approved: ["Disetujui", "bg-emerald-50 text-emerald-700 ring-emerald-600/30 dark:bg-emerald-950/70 dark:text-emerald-200 dark:ring-emerald-400/30"],
  rejected: ["Ditolak", "bg-rose-50 text-rose-700 ring-rose-600/30 dark:bg-rose-950/70 dark:text-rose-200 dark:ring-rose-400/30"],
  cancelled: ["Dibatalkan", "bg-[#E8F0FD] text-[#022F8E] ring-[#CBDFFC] dark:bg-[#012677] dark:text-[#CBDFFC] dark:ring-[#54B7FD]/25"],
};
export const STATUS_LABEL = Object.fromEntries(Object.entries(STATUS).map(([k, v]) => [k, v[0]]));

export const tgl = (d) => new Date(d).toLocaleDateString("id-ID");

export const PAGE = "mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6 lg:space-y-8 lg:py-8";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:translate-y-0 active:scale-[0.98] disabled:transform-none disabled:cursor-not-allowed disabled:opacity-50";
const SIZE = { md: "px-4 py-2 text-sm", sm: "px-2.5 py-1.5 text-xs" };
const VARIAN = {
  primary: "bg-gradient-to-r from-[#022F8E] to-[#0450D5] text-[#FEFEFE] shadow-[#012677]/20 hover:from-[#0450D5] hover:to-[#0F67ED] focus-visible:ring-[#2893FC]",
  secondary: "border border-[#CBDFFC] bg-[#E8F0FD] text-[#022F8E] hover:border-[#54B7FD] hover:bg-[#CBDFFC] focus-visible:ring-[#2893FC] dark:border-[#54B7FD]/30 dark:bg-[#0450D5]/25 dark:text-[#CBDFFC] dark:hover:border-[#54B7FD] dark:hover:bg-[#0450D5]/45",
  success: "bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-500",
  danger: "bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-500",
  warning: "bg-amber-700 text-white hover:bg-amber-800 focus-visible:ring-amber-500",
  ghost: "border border-[#CBDFFC]/80 bg-[#FEFEFE] text-[#0450D5] shadow-none hover:border-[#54B7FD] hover:bg-[#E8F0FD] focus-visible:ring-[#2893FC] dark:border-[#54B7FD]/25 dark:bg-[#022F8E]/70 dark:text-[#54B7FD] dark:hover:border-[#2893FC] dark:hover:bg-[#0450D5]/35",
  dangerGhost: "border border-[#Fda4af]/60 bg-[#FEFEFE] text-[#BE123C] shadow-none hover:border-[#FB7185] hover:bg-[#FFF1F2] focus-visible:ring-[#2893FC] dark:border-[#FDA4AF]/25 dark:bg-[#4C0519]/70 dark:text-[#FDA4AF] dark:hover:border-[#FDA4AF]/60 dark:hover:bg-[#881337]",
};
export const btn = (varian = "primary", ukuran = "md", extra = "") =>
  `${BASE} ${SIZE[ukuran]} ${VARIAN[varian]} ${extra}`;

export const field =
  "w-full rounded-xl border border-[#CBDFFC] bg-[#FEFEFE] px-3 py-2.5 text-sm text-[#012677] shadow-sm transition duration-200 placeholder:text-[#022F8E] placeholder:opacity-75 hover:border-[#54B7FD] focus:border-[#2893FC] focus:outline-none focus:ring-4 focus:ring-[#2893FC]/15 disabled:bg-[#E8F0FD] disabled:text-[#022F8E]/55 file:mr-3 file:rounded-lg file:border-0 file:bg-[#E8F0FD] file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-[#0450D5] hover:file:bg-[#CBDFFC] dark:border-[#54B7FD]/25 dark:bg-[#022F8E]/60 dark:text-[#FEFEFE] dark:placeholder:text-[#CBDFFC] dark:placeholder:opacity-90";
export const filterField = `${field} sm:w-auto`;

export const TABLE = "w-full text-left text-sm";
export const TH = "bg-[#E8F0FD] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#022F8E] dark:bg-[#012677] dark:text-[#CBDFFC]";
export const TD = "px-4 py-3 text-[#012677] dark:text-[#E8F0FD]";
export const TR = "border-t border-[#CBDFFC]/70 transition-colors hover:bg-[#E8F0FD] dark:border-[#54B7FD]/15 dark:hover:bg-[#022F8E]/70";

const HOVER =
  "transition-all duration-200 ease-out hover:-translate-y-1 hover:border-[#54B7FD] hover:shadow-lg hover:shadow-[#012677]/10";
const PILL = "inline-flex max-w-full items-center justify-start gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold leading-4 ring-1 ring-inset";
const PILL_COMPACT = "inline-flex max-w-full flex-wrap items-center justify-start gap-1 whitespace-normal rounded-full px-2 py-1 text-[10px] font-semibold leading-4 ring-1 ring-inset";

export function Card({ className = "", hover = false, children }) {
  return (
    <div className={`rounded-2xl border border-[#CBDFFC] bg-[#FEFEFE] shadow-sm shadow-[#012677]/5 dark:border-[#54B7FD]/20 dark:bg-[#022F8E]/75 ${hover ? HOVER : ""} ${className}`}>
      {children}
    </div>
  );
}

export function Panel({ ikon: Ikon, judul, aksi, className = "", flush = false, children }) {
  return (
    <Card className={`overflow-hidden ${className}`}>
      <div className="flex items-center justify-between gap-3 border-b border-[#CBDFFC] bg-[#E8F0FD]/80 px-4 py-3.5 sm:px-5 dark:border-[#54B7FD]/15 dark:bg-[#012677]/80">
        <h2 className="flex items-center gap-2 font-semibold text-[#012677] dark:text-[#FEFEFE]">
          {Ikon && (
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#CBDFFC] text-[#0450D5] dark:bg-[#0450D5]/25 dark:text-[#54B7FD]">
              <Ikon size={16} />
            </span>
          )}
          {judul}
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
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#CBDFFC] to-[#54B7FD]/50 text-[#022F8E] shadow-sm ring-1 ring-[#54B7FD]/35 dark:from-[#0450D5]/35 dark:to-[#2893FC]/20 dark:text-[#54B7FD] dark:ring-[#54B7FD]/20">
          <Ikon size={22} />
        </span>
        <div>
          <h1 className="text-xl font-bold text-[#012677] sm:text-2xl dark:text-[#FEFEFE]">{judul}</h1>
          {sub && <p className="text-sm text-[#022F8E]/70 dark:text-[#CBDFFC]">{sub}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

const TONE = {
  indigo: "bg-[#E8F0FD] text-[#0450D5] ring-[#CBDFFC] dark:bg-[#0450D5]/25 dark:text-[#54B7FD] dark:ring-[#54B7FD]/20",
  emerald: "bg-[#DCEAFF] text-[#0450D5] ring-[#54B7FD]/30 dark:bg-[#0450D5]/25 dark:text-[#54B7FD] dark:ring-[#54B7FD]/20",
  amber: "bg-[#E8F0FD] text-[#022F8E] ring-[#CBDFFC] dark:bg-[#2893FC]/20 dark:text-[#CBDFFC] dark:ring-[#54B7FD]/20",
  rose: "bg-[#CBDFFC]/70 text-[#022F8E] ring-[#54B7FD]/30 dark:bg-[#022F8E] dark:text-[#CBDFFC] dark:ring-[#54B7FD]/20",
  sky: "bg-[#54B7FD]/25 text-[#0450D5] ring-[#54B7FD]/35 dark:bg-[#2893FC]/20 dark:text-[#54B7FD] dark:ring-[#54B7FD]/20",
  slate: "bg-[#E8F0FD] text-[#022F8E] ring-[#CBDFFC] dark:bg-[#012677] dark:text-[#CBDFFC] dark:ring-[#54B7FD]/20",
};

export function StatCard({ judul, nilai, ikon: Ikon, tone = "indigo", className = "" }) {
  return (
    <Card hover className={`group relative flex h-full min-h-32 items-center gap-3 overflow-hidden border-[#CBDFFC] p-4 sm:gap-4 sm:p-5 xl:gap-3 xl:p-4 ${className}`}>
      <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ring-1 transition-transform duration-200 group-hover:scale-[1.04] ${TONE[tone]}`}>
        <Ikon size={24} strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="whitespace-normal [overflow-wrap:normal] [word-break:normal] [text-wrap:balance] text-xs font-semibold uppercase leading-5 tracking-[0.06em] text-[#022F8E]/70 dark:text-[#CBDFFC]/90">
          {judul}
        </p>
        <p className="mt-2 break-words text-3xl font-bold leading-none tracking-tight text-[#012677] dark:text-[#54B7FD]">
          {nilai}
        </p>
      </div>
    </Card>
  );
}

export function Badge({ status, compact = false }) {
  const [label, gaya] = STATUS[status];
  return (
    <span className={`${compact ? PILL_COMPACT : PILL} ${gaya}`}>
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
        aktif
          ? "bg-emerald-50 text-emerald-700 ring-emerald-600/30 dark:bg-emerald-950/70 dark:text-emerald-200 dark:ring-emerald-400/30"
          : "bg-[#E8F0FD] text-[#022F8E] ring-[#CBDFFC] dark:bg-[#012677] dark:text-[#CBDFFC] dark:ring-[#54B7FD]/25"
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
      className={`flex items-start gap-3 rounded-xl border px-4 py-3.5 text-sm shadow-sm ${
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
    <label className={`block space-y-2 text-sm font-semibold text-slate-700 ${className}`}>
      <span className="block">{label}</span>
      {children}
    </label>
  );
}

export function Avatar({ id, ada, nama, size = "h-10 w-10", teks = "text-sm" }) {
  return ada ? (
    <img src={`/api/foto?id=${id}`} alt={`Foto ${nama}`} className={`${size} shrink-0 rounded-full object-cover ring-2 ring-white`} />
  ) : (
    <div className={`${size} ${teks} flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#CBDFFC] to-[#54B7FD]/50 font-semibold text-[#022F8E] ring-2 ring-[#FEFEFE] shadow-sm dark:from-[#0450D5]/35 dark:to-[#2893FC]/20 dark:text-[#54B7FD] dark:ring-[#012677]`}>
      {nama[0]}
    </div>
  );
}

export function Progress({ sisa, total }) {
  const persen = total > 0 ? Math.max(0, Math.min(100, (sisa / total) * 100)) : 0;
  const warna = persen > 50 ? "bg-emerald-500" : persen > 20 ? "bg-amber-500" : "bg-rose-500";
  return (
    <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100 p-0.5" role="progressbar" aria-valuenow={Math.round(persen)} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-full rounded-full transition-all duration-700 ease-out ${warna}`} style={{ width: `${persen}%` }} />
    </div>
  );
}

export function Kosong({ children }) {
  return <p className="px-5 py-6 text-center text-sm text-slate-400">{children}</p>;
}