import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  env: {
    DATABASE_URL: 'postgresql://siris_app:contoh-password@127.0.0.1:55432/siris_uji',
  },
  Pool: vi.fn(),
}));

vi.mock('pg', () => ({ default: { Pool: h.Pool } }));
vi.mock('../config/env.js', () => ({ env: h.env }));

function makePoolInstance(): {
  instance: {
    connect: ReturnType<typeof vi.fn>;
    on: ReturnType<typeof vi.fn>;
    end: ReturnType<typeof vi.fn>;
  };
  client: { query: ReturnType<typeof vi.fn>; release: ReturnType<typeof vi.fn> };
} {
  const client = {
    query: vi.fn().mockResolvedValue({ rows: [{ ok: 1 }] }),
    release: vi.fn(),
  };
  const instance = {
    connect: vi.fn().mockResolvedValue(client),
    on: vi.fn(),
    end: vi.fn().mockResolvedValue(undefined),
  };
  h.Pool.mockImplementation(() => instance);
  return { instance, client };
}

async function loadPoolModule(): Promise<typeof import('../shared/db/pool.js')> {
  vi.resetModules();
  return import('../shared/db/pool.js');
}

beforeEach(() => {
  h.env.DATABASE_URL = 'postgresql://siris_app:contoh-password@127.0.0.1:55432/siris_uji';
  h.Pool.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Unit test lapisan pool PostgreSQL SRS-43 (mock pg)', () => {
  it('tanpa DATABASE_URL tidak membuka pool dan gagal dengan kode aman', async () => {
    h.env.DATABASE_URL = '';
    const { checkDatabaseConnection } = await loadPoolModule();

    const result = await checkDatabaseConnection();

    expect(result).toEqual({ connected: false, error: 'DATABASE_URL_NOT_CONFIGURED' });
    expect(h.Pool).not.toHaveBeenCalled();
  });

  it('koneksi berhasil mengembalikan latency dan memanggil SELECT 1 dengan cleanup client', async () => {
    const { instance, client } = makePoolInstance();
    const { checkDatabaseConnection } = await loadPoolModule();

    const result = await checkDatabaseConnection();

    expect(result.connected).toBe(true);
    expect(typeof result.latency_ms).toBe('number');
    expect(client.query).toHaveBeenCalledWith('SELECT 1');
    expect(client.release).toHaveBeenCalledTimes(1);
    expect(h.Pool).toHaveBeenCalledWith({
      connectionString: h.env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
    expect(instance.connect).toHaveBeenCalledTimes(1);
  });

  it('kegagalan koneksi menghasilkan kode aman tanpa pesan atau connection string mentah', async () => {
    const { instance } = makePoolInstance();
    instance.connect.mockRejectedValue(
      Object.assign(new Error('PRIVATE_DSN_SENTINEL postgresql://user:pass@host/db'), {
        code: 'ECONNREFUSED',
      }),
    );
    const { checkDatabaseConnection } = await loadPoolModule();

    const result = await checkDatabaseConnection();

    expect(result).toEqual({ connected: false, error: 'ECONNREFUSED' });
    expect(JSON.stringify(result)).not.toContain('PRIVATE_DSN_SENTINEL');
    expect(JSON.stringify(result)).not.toContain('postgresql://');
  });

  it('kegagalan tanpa kode driver jatuh ke DATABASE_CONNECTION_FAILED', async () => {
    const { instance } = makePoolInstance();
    instance.connect.mockRejectedValue(new Error('PRIVATE_ERROR_SENTINEL'));
    const { checkDatabaseConnection } = await loadPoolModule();

    const result = await checkDatabaseConnection();

    expect(result).toEqual({ connected: false, error: 'DATABASE_CONNECTION_FAILED' });
    expect(JSON.stringify(result)).not.toContain('PRIVATE_ERROR_SENTINEL');
  });

  it('kegagalan SELECT 1 tetap melepas client dari pool', async () => {
    const { client } = makePoolInstance();
    client.query.mockRejectedValue(
      Object.assign(new Error('PRIVATE_QUERY_SENTINEL'), { code: '42P01' }),
    );
    const { checkDatabaseConnection } = await loadPoolModule();

    const result = await checkDatabaseConnection();

    expect(result).toEqual({ connected: false, error: '42P01' });
    expect(client.release).toHaveBeenCalledTimes(1);
  });

  it('error client idle dicatat sebagai kode aman, bukan pesan mentah', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { instance } = makePoolInstance();
    const { getDbPool } = await loadPoolModule();

    getDbPool();

    const errorHandler = instance.on.mock.calls.find(([event]) => event === 'error')?.[1];
    expect(errorHandler).toBeTypeOf('function');
    (errorHandler as (err: unknown) => void)(
      Object.assign(new Error('PRIVATE_IDLE_SENTINEL'), { code: 'ECONNRESET' }),
    );

    expect(log).toHaveBeenCalledWith('[SIRIS API] PostgreSQL idle client error: ECONNRESET');
    expect(JSON.stringify(log.mock.calls)).not.toContain('PRIVATE_IDLE_SENTINEL');
  });
});

describe('Penutupan pool PostgreSQL (dipakai graceful shutdown SIGTERM)', () => {
  it('menutup pool tepat satu kali dan idempoten', async () => {
    const { instance } = makePoolInstance();
    const { getDbPool, closeDbPool } = await loadPoolModule();

    getDbPool();
    await closeDbPool();
    await closeDbPool();

    expect(instance.end).toHaveBeenCalledTimes(1);
  });

  it('setelah ditutup, permintaan berikut membuka pool baru', async () => {
    makePoolInstance();
    const { getDbPool, closeDbPool } = await loadPoolModule();

    getDbPool();
    await closeDbPool();
    getDbPool();

    expect(h.Pool).toHaveBeenCalledTimes(2);
  });

  it('closeDbPool mempropagasi kegagalan pool.end sehingga shutdown keluar gagal', async () => {
    const { instance } = makePoolInstance();
    instance.end.mockRejectedValue(Object.assign(new Error('PRIVATE_END_SENTINEL'), { code: 'ECONNREFUSED' }));
    const { getDbPool, closeDbPool } = await loadPoolModule();

    getDbPool();

    await expect(closeDbPool()).rejects.toThrow('PRIVATE_END_SENTINEL');
  });
});
