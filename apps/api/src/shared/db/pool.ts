import pg from 'pg';
import { env } from '../../config/env.js';

const { Pool } = pg;

let pool: pg.Pool | null = null;

export interface DatabaseConnectionStatus {
  connected: boolean;
  latency_ms?: number;
  error?: string;
}

export function getDbPool(): pg.Pool {
  if (!pool) {
    if (!env.DATABASE_URL) {
      throw new Error('DATABASE_URL belum dikonfigurasi pada environment.');
    }

    pool = new Pool({
      connectionString: env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on('error', (err) => {
      // Hanya kode aman yang dicatat; pesan driver tidak dipublikasikan.
      console.error(`[SIRIS API] PostgreSQL idle client error: ${toSafeDatabaseErrorCode(err)}`);
    });
  }

  return pool;
}

/**
 * Mengubah error driver menjadi kode aman. Pesan mentah driver tidak
 * dikembalikan karena dapat memuat host, pengguna, SQL, atau detail internal.
 */
function toSafeDatabaseErrorCode(err: unknown): string {
  const code = (err as { code?: unknown } | null)?.code;
  if (typeof code === 'string' && /^[A-Za-z0-9_]+$/.test(code)) {
    return code.toUpperCase();
  }
  return 'DATABASE_CONNECTION_FAILED';
}

export async function checkDatabaseConnection(): Promise<DatabaseConnectionStatus> {
  if (!env.DATABASE_URL) {
    return { connected: false, error: 'DATABASE_URL_NOT_CONFIGURED' };
  }

  const start = Date.now();
  try {
    const dbPool = getDbPool();
    const client = await dbPool.connect();
    try {
      await client.query('SELECT 1');
      return { connected: true, latency_ms: Date.now() - start };
    } finally {
      client.release();
    }
  } catch (err) {
    return { connected: false, error: toSafeDatabaseErrorCode(err) };
  }
}

export async function closeDbPool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
