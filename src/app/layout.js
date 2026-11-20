import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import AppShell from "@/components/AppShell";
import Footer from "@/components/Footer";
import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "SiCuti",
  description: "Sistem Manajemen Cuti Karyawan",
};

export default async function RootLayout({ children }) {
  const user = await getCurrentUser();
  const adaFoto = user
    ? (await pool.query("SELECT (foto_data IS NOT NULL) AS ada FROM users WHERE id = $1", [user.id])).rows[0]?.ada
    : false;

  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <Script
          id="tema-awal"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `try {
              if (localStorage.getItem("sicuti-tema") === "dark") {
                document.documentElement.classList.add("dark");
              }
            } catch (error) {
              console.error("Gagal memuat preferensi tema:", error);
            }`,
          }}
        />
      </head>
      <body className="min-h-full bg-slate-50 text-slate-900">
        {user ? (
          <AppShell user={user} adaFoto={Boolean(adaFoto)} footer={<Footer />}>
            {children}
          </AppShell>
        ) : (
          <div className="flex min-h-screen flex-col">
            <div className="flex flex-1 flex-col">{children}</div>
            <Footer />
          </div>
        )}
      </body>
    </html>
  );
}