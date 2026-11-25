import { afterEach, describe, expect, it, vi } from 'vitest';

const HAS_DATABASE_URL = typeof process.env.DATABASE_URL === 'string' && process.env.DATABASE_URL.trim() !== '';

function invalidDatabaseUrl(kind: 'port' | 'database' | 'password'): string {
  const base = process.env.DATABASE_URL?.trim() ?? '';
  const url = new URL(base);
  if (kind === 'port') url.port = '1';
  if (kind === 'database') url.pathname = '/siris_uji_invalid_missing_db_43';
  if (kind === 'password') url.password = 'invalid-password-srs43';
  return url.toString();
}

async function loadPoolWithUrl(databaseUrl: string): Promise<typeof import('../../../apps/api/src/shared/db/pool.js')> {
  vi.resetModules();
  vi.stubEnv('DATABASE_URL', databaseUrl);
  vi.stubEnv('NODE_ENV', 'test');
  return import('../../../apps/api/src/shared/db/pool.js');
}

afterEach(async () => {
  try {
    const mod = await import('../../../apps/api/src/shared/db/pool.js');
    await mod.closeDbPool();
  } catch {
    // ignore cleanup errors in gated tests
  }
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('Integrasi koneksi PostgreSQL SRS-43', () => {
  it.skipIf(!HAS_DATABASE_URL)(
    'database tersedia: checkDatabaseConnection mengembalikan connected=true dengan latency',
    async () => {
      const { checkDatabaseConnection, closeDbPool } = await loadPoolWithUrl(process.env.DATABASE_URL!);

      const result = await checkDatabaseConnection();

      expect(result.connected).toBe(true);
      if (result.connected) {
        expect(typeof result.latency_ms).toBe('number');
        expect(result.latency_ms).toBeGreaterThanOrEqual(0);
      }
      await closeDbPool();
    },
  );

  it.skipIf(!HAS_DATABASE_URL)(
    'database tidak tersedia (port tidak dapat dijangkau): gagal dengan kode aman tanpa hang',
    async () => {
      const { checkDatabaseConnection, closeDbPool } = await loadPoolWithUrl(invalidDatabaseUrl('port'));

      const result = await checkDatabaseConnection();

      expect(result.connected).toBe(false);
      if (!result.connected) {
        expect(typeof result.error).toBe('string');
        expect(result.error).toMatch(/^[A-Z0-9_]+$/);
      }
      expect(JSON.stringify(result)).not.toContain('postgresql://');
      expect(JSON.stringify(result)).not.toContain('invalid-password');
      await closeDbPool();
    },
    15_000,
  );

  it.skipIf(!HAS_DATABASE_URL)(
    'konfigurasi database tidak valid (database tidak ada): gagal dengan kode aman',
    async () => {
      const { checkDatabaseConnection, closeDbPool } = await loadPoolWithUrl(invalidDatabaseUrl('database'));

      const result = await checkDatabaseConnection();

      expect(result.connected).toBe(false);
      if (!result.connected) {
        expect(typeof result.error).toBe('string');
        expect(result.error?.length).toBeGreaterThan(0);
      }
      expect(JSON.stringify(result)).not.toContain('postgresql://');
      await closeDbPool();
    },
    15_000,
  );

  it.skipIf(!HAS_DATABASE_URL)(
    'konfigurasi kredensial tidak valid: gagal dengan kode aman dan pool dibersihkan',
    async () => {
      const { checkDatabaseConnection, closeDbPool } = await loadPoolWithUrl(invalidDatabaseUrl('password'));

      const result = await checkDatabaseConnection();

      expect(result.connected).toBe(false);
      if (!result.connected) {
        expect(typeof result.error).toBe('string');
      }
      expect(JSON.stringify(result)).not.toContain('invalid-password-srs43');
      expect(JSON.stringify(result)).not.toContain('postgresql://');
      await closeDbPool();
    },
    15_000,
  );

  it.skipIf(!HAS_DATABASE_URL)(
    'penutupan pool setelah pemeriksaan nyata tidak menggantung',
    async () => {
      const { checkDatabaseConnection, closeDbPool } = await loadPoolWithUrl(process.env.DATABASE_URL!);
      await checkDatabaseConnection();
      await expect(closeDbPool()).resolves.toBeUndefined();
    },
  );

  it('tanpa DATABASE_URL: dilaporkan sebagai NOT RUN/BLOCKED (bukan bukti koneksi)', async () => {
    if (HAS_DATABASE_URL) {
      // Bila env tersedia, test ini tidak relevan; lulus sebagai no-op yang eksplisit.
      expect(HAS_DATABASE_URL).toBe(true);
      return;
    }
    const { checkDatabaseConnection, closeDbPool } = await loadPoolWithUrl('');

    const result = await checkDatabaseConnection();

    expect(result.connected).toBe(false);
    if (!result.connected) {
      expect(result.error).toBe('DATABASE_URL_NOT_CONFIGURED');
    }
    await closeDbPool();
  });
});
