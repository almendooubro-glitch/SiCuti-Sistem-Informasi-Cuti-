This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Sinkronisasi Hari Libur

SiCuti mengambil hari libur dari kalender publik Google **Holidays in Indonesia** menggunakan endpoint `GET https://www.googleapis.com/calendar/v3/calendars/{calendarId}/events` ([dokumentasi Events API](https://developers.google.com/workspace/calendar/api/v3/reference/events/list)).

1. [Aktifkan Google Calendar API](https://console.cloud.google.com/apis/library/calendar-json.googleapis.com) dan [buat API key](https://console.cloud.google.com/apis/credentials) yang dibatasi untuk Google Calendar API.
2. Tambahkan `GOOGLE_CALENDAR_API_KEY=API_KEY_ANDA` ke `.env.local` dan variabel lingkungan deployment. Simpan API key di server, jangan gunakan awalan `NEXT_PUBLIC_`.
3. Untuk database lama, jalankan `database/schema.sql` sekali agar kolom sumber sinkronisasi ditambahkan.
4. Masuk sebagai admin atau HRD, buka **Pengaturan Cuti**, lalu pilih **Sinkronkan Google Calendar**.

Sinkronisasi membaca seluruh halaman acara pada kalender `en.indonesian#holiday@group.v.calendar.google.com`, termasuk hari libur dan cuti bersama. Observansi yang bukan hari libur nasional tidak dimasukkan. Tanggal hasil sinkronisasi disimpan di `hari_libur` dan otomatis digunakan dalam perhitungan hari kerja pengajuan serta kapasitas divisi. Data yang dimasukkan manual tidak ditimpa, sedangkan data Google diperbarui dan dihapus jika sudah tidak ada di kalender. Kalender Google bukan sumber resmi pemerintah; admin tetap dapat menambahkan hari libur secara manual.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
