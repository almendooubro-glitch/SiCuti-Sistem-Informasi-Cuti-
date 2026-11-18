export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-700 px-6 py-4 text-center text-sm text-slate-400">
      <p>
        <strong className="text-slate-200">SiCuti</strong> · Sistem Manajemen Cuti Karyawan
      </p>
      <p>&copy; {new Date().getFullYear()} SiCuti. All rights reserved.</p>
    </footer>
  );
}