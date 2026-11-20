const FEED_URL =
  "https://calendar.google.com/calendar/ical/en.indonesian%23holiday%40group.v.calendar.google.com/public/basic.ics";

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

function tanggalIcs(value, nama) {
  const match = /^(\d{4})(\d{2})(\d{2})$/.exec(value || "");
  if (!match) {
    throw new Error(`Properti ${nama} pada feed Google Calendar tidak valid`);
  }
  return tanggalAcara(`${match[1]}-${match[2]}-${match[3]}`);
}

function bukaTeksIcs(value) {
  return value.replace(/\\([nN,;\\])/g, (_, character) => {
    if (character.toLowerCase() === "n") return "\n";
    return character;
  });
}

function bacaAcaraIcs(ical) {
  if (!ical.startsWith("BEGIN:VCALENDAR") || !ical.trimEnd().endsWith("END:VCALENDAR")) {
    throw new Error("Feed Google Calendar tidak lengkap");
  }

  const baris = ical.replace(/\r?\n[ \t]/g, "").split(/\r?\n/);
  const events = [];
  let event = null;

  for (const line of baris) {
    if (line === "BEGIN:VEVENT") {
      event = {};
      continue;
    }
    if (line === "END:VEVENT") {
      if (event) events.push(event);
      event = null;
      continue;
    }
    if (!event) continue;

    const pemisah = line.indexOf(":");
    if (pemisah < 0) continue;
    const nama = line.slice(0, pemisah).split(";")[0].toUpperCase();
    if (["DESCRIPTION", "DTEND", "DTSTART", "STATUS", "SUMMARY"].includes(nama)) {
      event[nama] = bukaTeksIcs(line.slice(pemisah + 1));
    }
  }

  return events;
}

function hariLiburAcara(event) {
  const keterangan = String(event.SUMMARY || "").trim();
  const cutiBersama = /\b(cuti bersama|joint holiday)\b/i.test(keterangan);
  if (
    event.STATUS?.toUpperCase() === "CANCELLED" ||
    (!cutiBersama && !/\bpublic holiday\b/i.test(event.DESCRIPTION || ""))
  ) {
    return [];
  }

  const mulai = tanggalIcs(event.DTSTART, "DTSTART");
  const akhir = tanggalIcs(event.DTEND, "DTEND");
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
  const response = await fetch(FEED_URL, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(
      `Feed Google Calendar gagal (${response.status}): ${response.statusText}`
    );
  }

  const events = bacaAcaraIcs(await response.text());
  const hariLibur = new Map();
  for (const event of events) {
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
