const CALENDAR_ID =
  process.env.GOOGLE_HOLIDAY_CALENDAR_ID ||
  "en.indonesian#holiday@group.v.calendar.google.com";
const API_URL = "https://www.googleapis.com/calendar/v3/calendars";

function tanggalBerikutnya(tanggal) {
  const date = new Date(`${tanggal}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

function tanggalAcara(tanggal) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) {
    throw new Error(`Tanggal acara Google Calendar tidak valid: ${tanggal}`);
  }
  const parsed = new Date(`${tanggal}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== tanggal) {
    throw new Error(`Tanggal acara Google Calendar tidak valid: ${tanggal}`);
  }
  return tanggal;
}

function hariLiburAcara(event) {
  const keterangan = String(event.summary || "").trim();
  const deskripsi = String(event.description || "");
  const cutiBersama = /\b(cuti bersama|joint holiday)\b/i.test(keterangan);

  if (!cutiBersama && !/\bpublic holiday\b/i.test(deskripsi)) return [];
  if (!event.start?.date || !event.end?.date) {
    throw new Error(`Tanggal acara "${keterangan}" tidak tersedia sebagai acara sepanjang hari`);
  }

  const mulai = tanggalAcara(event.start.date);
  const akhir = tanggalAcara(event.end.date);
  if (akhir <= mulai) {
    throw new Error(`Rentang tanggal acara "${keterangan}" tidak valid`);
  }

  const hasil = [];
  for (let tanggal = mulai; tanggal < akhir; tanggal = tanggalBerikutnya(tanggal)) {
    hasil.push({
      tanggal,
      keterangan: keterangan.slice(0, 150) || "Hari Libur",
      jenis: cutiBersama ? "cuti_bersama" : "nasional",
    });
  }
  return hasil;
}

export async function ambilHariLiburIndonesia() {
  const apiKey = process.env.GOOGLE_CALENDAR_API_KEY;
  if (!apiKey) {
    throw new Error("Konfigurasi GOOGLE_CALENDAR_API_KEY belum tersedia");
  }

  const events = [];
  let pageToken;

  do {
    const url = new URL(
      `${API_URL}/${encodeURIComponent(CALENDAR_ID)}/events`
    );
    url.searchParams.set("key", apiKey);
    url.searchParams.set("maxResults", "2500");
    url.searchParams.set("singleEvents", "true");
    url.searchParams.set("orderBy", "startTime");
    url.searchParams.set(
      "fields",
      "items(description,end(date),start(date),status,summary),nextPageToken"
    );
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const response = await fetch(url, { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(
        `Google Calendar API gagal (${response.status}): ${
          data.error?.message || response.statusText
        }`
      );
    }
    if (!Array.isArray(data.items)) {
      throw new Error("Respons Google Calendar API tidak berisi daftar acara");
    }

    events.push(...data.items);
    pageToken = data.nextPageToken;
  } while (pageToken);

  const hariLibur = new Map();
  for (const event of events) {
    if (event.status === "cancelled") continue;
    for (const hari of hariLiburAcara(event)) {
      const tersimpan = hariLibur.get(hari.tanggal);
      if (!tersimpan || hari.jenis === "cuti_bersama") {
        hariLibur.set(hari.tanggal, hari);
      }
    }
  }

  return [...hariLibur.values()].sort((a, b) =>
    a.tanggal.localeCompare(b.tanggal)
  );
}
