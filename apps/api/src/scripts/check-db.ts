import { checkDatabaseConnection, closeDbPool } from '../shared/db/pool.js';

/**
 * Pemeriksaan koneksi PostgreSQL untuk runtime lokal/CI.
 * Keluar dengan kode 1 bila DATABASE_URL belum diisi atau koneksi gagal,
 * sehingga status BLOCKED tidak pernah dilaporkan sebagai PASS.
 * Kegagalan memakai identitas stabil `DATABASE_CHECK_FAILED`; nama, pesan,
 * atau connection string driver tidak dicatat.
 */
async function main(): Promise<void> {
  const result = await checkDatabaseConnection();

  if (result.connected) {
    console.log(`[SIRIS API] Koneksi PostgreSQL berhasil (${result.latency_ms}ms).`);
  } else {
    console.error(`[SIRIS API] DATABASE_CHECK_FAILED: Koneksi PostgreSQL gagal (${result.error ?? 'UNKNOWN'}).`);
  }

  await closeDbPool();
  process.exit(result.connected ? 0 : 1);
}

main().catch(async () => {
  console.error('[SIRIS API] DATABASE_CHECK_FAILED: Pemeriksaan database tidak dapat dijalankan.');
  await closeDbPool();
  process.exit(1);
});
