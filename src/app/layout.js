import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/AppShell";
import Footer from "@/components/Footer";
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

  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-slate-50 text-slate-900">
        {user ? (
          <AppShell user={user} footer={<Footer />}>
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