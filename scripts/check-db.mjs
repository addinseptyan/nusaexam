import "dotenv/config";
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
try {
  await prisma.$queryRaw`SELECT 1`;
  console.log('Koneksi PostgreSQL berhasil.');
} catch (error) {
  console.error('Koneksi PostgreSQL gagal. Periksa DATABASE_URL, akun, database, dan layanan PostgreSQL.');
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
