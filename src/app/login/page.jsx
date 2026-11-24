import pool from "@/lib/db";
import FormLogin from "@/components/FormulirMasuk";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const { rows } = await pool.query(`
    SELECT u.email, u.nama_lengkap, u.role, d.nama AS divisi,
           (u.tanggal_bergabung > CURRENT_DATE - INTERVAL '1 year') AS baru
    FROM users u
    LEFT JOIN divisi d ON d.id = u.divisi_id
    WHERE u.is_active AND (
      u.role IN ('admin', 'hrd')
      OR (u.role = 'ketua_divisi' AND EXISTS (SELECT 1 FROM divisi WHERE ketua_id = u.id))
      OR u.role = 'user'
    )
    ORDER BY CASE u.role WHEN 'admin' THEN 1 WHEN 'hrd' THEN 2 WHEN 'ketua_divisi' THEN 3 ELSE 4 END,
             d.nama, u.nama_lengkap
  `);

  return <FormLogin akun={rows} />;
}