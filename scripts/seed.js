const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const users = [
  ["admin", "admin@sicuti.com", "Admin SiCuti", "admin"],
  ["karyawan", "karyawan@sicuti.com", "Budi Karyawan", "user"],
  ["ketua", "ketua@sicuti.com", "Siti Ketua Divisi", "ketua_divisi"],
  ["hrd", "hrd@sicuti.com", "Rina HRD", "hrd"],
];

async function main() {
  const hash = await bcrypt.hash("password123", 10);
  for (const [username, email, nama, role] of users) {
    await pool.query(
      `INSERT INTO users (username, email, password, nama_lengkap, role)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO NOTHING`,
      [username, email, hash, nama, role]
    );
  }
  console.log("Seed selesai");
  await pool.end();
}

main();