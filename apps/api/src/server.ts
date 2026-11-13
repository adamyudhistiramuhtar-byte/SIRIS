import http from 'node:http';
import { app } from './app.js';
import { env } from './config/env.js';
import { closeDbPool } from './shared/db/pool.js';

const server = http.createServer(app);

server.listen(env.PORT, () => {
  console.log(`[SIRIS API] Server berjalan pada http://localhost:${env.PORT}`);
  console.log(`[SIRIS API] Environment: ${env.NODE_ENV} | Timezone: ${env.APP_TIMEZONE}`);
  console.log(`[SIRIS API] Health endpoint: http://localhost:${env.PORT}/health`);
  console.log(`[SIRIS API] API v1 base: http://localhost:${env.PORT}${env.API_PREFIX}`);
});

// Graceful shutdown
async function gracefulShutdown(signal: string): Promise<void> {
  console.log(`\n[SIRIS API] Menerima sinyal ${signal}. Memulai graceful shutdown...`);

  server.close(async () => {
    console.log('[SIRIS API] Server HTTP telah ditutup.');
    try {
      await closeDbPool();
      console.log('[SIRIS API] Koneksi database ditutup.');
    } catch (err) {
      // Log aman: hanya nama error, tanpa pesan mentah driver, SQL, atau stack.
      console.error(
        `[SIRIS API] Gagal menutup database pool: ${err instanceof Error ? err.name : 'UnknownError'}`,
      );
    }
    process.exit(0);
  });

  // Timeout paksa jika shutdown tertahan lebih dari 10 detik
  setTimeout(() => {
    console.error('[SIRIS API] Batas waktu graceful shutdown terlampaui. Memaksa keluar.');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
