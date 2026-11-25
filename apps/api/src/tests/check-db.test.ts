import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';

const poolMock = vi.hoisted(() => ({
  checkDatabaseConnection: vi.fn(),
  closeDbPool: vi.fn(),
}));

vi.mock('../shared/db/pool.js', () => ({
  checkDatabaseConnection: (...args: unknown[]) => poolMock.checkDatabaseConnection(...args),
  closeDbPool: (...args: unknown[]) => poolMock.closeDbPool(...args),
}));

describe('Pemeriksaan database (check-db) SRS-43', () => {
  let exitMock: MockInstance<typeof process.exit>;
  let logMock: MockInstance<typeof console.log>;
  let errorMock: MockInstance<typeof console.error>;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    exitMock = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    logMock = vi.spyOn(console, 'log').mockImplementation(() => {});
    errorMock = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('gagal memakai identitas DATABASE_CHECK_FAILED dan keluar kode 1', async () => {
    poolMock.checkDatabaseConnection.mockResolvedValue({ connected: false, error: 'DATABASE_URL_NOT_CONFIGURED' });
    poolMock.closeDbPool.mockResolvedValue(undefined);

    await import('../scripts/check-db.js');

    expect(errorMock).toHaveBeenCalledWith('[SIRIS API] DATABASE_CHECK_FAILED: Koneksi PostgreSQL gagal (DATABASE_URL_NOT_CONFIGURED).');
    expect(exitMock).toHaveBeenCalledWith(1);
    expect(exitMock).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(errorMock.mock.calls)).not.toContain('postgresql://');
    expect(JSON.stringify(errorMock.mock.calls)).not.toContain('password');
  });

  it('berhasil memeriksa koneksi dan keluar kode 0', async () => {
    poolMock.checkDatabaseConnection.mockResolvedValue({ connected: true, latency_ms: 5 });
    poolMock.closeDbPool.mockResolvedValue(undefined);

    await import('../scripts/check-db.js');

    expect(logMock).toHaveBeenCalledWith('[SIRIS API] Koneksi PostgreSQL berhasil (5ms).');
    expect(exitMock).toHaveBeenCalledWith(0);
  });

  it('memakai DATABASE_CHECK_FAILED saat pemeriksaan tidak dapat dijalankan', async () => {
    poolMock.checkDatabaseConnection.mockRejectedValue(new Error('PRIVATE_DB_ERROR_SENTINEL'));
    poolMock.closeDbPool.mockResolvedValue(undefined);

    await import('../scripts/check-db.js');

    expect(errorMock).toHaveBeenCalledWith('[SIRIS API] DATABASE_CHECK_FAILED: Pemeriksaan database tidak dapat dijalankan.');
    expect(exitMock).toHaveBeenCalledWith(1);
  });
});
