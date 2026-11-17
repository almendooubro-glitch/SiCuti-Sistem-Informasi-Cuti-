export function parseTanggal(s) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function hariIni() {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Makassar" });
}

export function selisihHari(dari, ke) {
  return Math.round((parseTanggal(ke) - parseTanggal(dari)) / 86400000);
}

export function hitungHariKerja(mulai, selesai, setengah = false) {
  if (!mulai || !selesai) return 0;
  const a = parseTanggal(mulai);
  const b = parseTanggal(selesai);
  if (b < a) return 0;

  let n = 0;
  for (const d = new Date(a); d <= b; d.setDate(d.getDate() + 1)) {
    if (d.getDay() !== 0 && d.getDay() !== 6) n++;
  }
  if (setengah) return a.getTime() === b.getTime() && n === 1 ? 0.5 : 0;
  return n;
}