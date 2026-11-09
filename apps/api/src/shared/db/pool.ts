import pg from 'pg';
import { env } from '../../config/env.js';

const { Pool } = pg;

let pool: pg.Pool | null = null;

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
      console.error('Unexpected error on idle PostgreSQL client:', err);
    });
  }

  return pool;
}

export async function checkDatabaseConnection(): Promise<{ connected: boolean; latency_ms?: number; error?: string }> {
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
    return {
      connected: false,
      error: err instanceof Error ? err.message : 'UNKNOWN_DATABASE_ERROR',
    };
  }
}

export async function closeDbPool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

