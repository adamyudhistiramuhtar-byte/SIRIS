import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const database = vi.hoisted(() => ({ connect: vi.fn(), on: vi.fn(), end: vi.fn() }));
vi.mock('../config/env.js', () => ({ env: { DATABASE_URL: 'postgresql://fixture@127.0.0.1/uji' } }));
vi.mock('pg', () => ({ default: { Pool: class {
  connect = database.connect;
  on = database.on;
  end = database.end;
} } }));
import { checkDatabaseConnection, closeDbPool, getDbPool } from '../shared/db/pool.js';

beforeEach(() => { vi.clearAllMocks(); database.end.mockResolvedValue(undefined); });
afterEach(async () => { await closeDbPool(); vi.restoreAllMocks(); });

describe('Kerahasiaan diagnostik pool PostgreSQL (unit dengan mock)', () => {
  it('tidak mengembalikan code error arbitrer dari kegagalan koneksi', async () => {
    database.connect.mockRejectedValue({ code: 'PRIVATE_DATABASE_CODE_SENTINEL' });
    expect(await checkDatabaseConnection()).toEqual({ connected: false, error: 'DATABASE_CONNECTION_FAILED' });
  });

  it('tidak mencatat code error arbitrer dari idle client', () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    getDbPool();
    const listener = database.on.mock.calls.find(([name]) => name === 'error')?.[1];
    expect(listener).toBeTypeOf('function');
    listener({ code: 'PRIVATE_DATABASE_CODE_SENTINEL' });
    expect(JSON.stringify(log.mock.calls)).not.toContain('PRIVATE_DATABASE_CODE_SENTINEL');
    expect(log.mock.calls[0].join(' ')).toContain('DATABASE_CONNECTION_FAILED');
  });

  it.each(['ECONNREFUSED', '28P01'])('mempertahankan diagnostik terdaftar %s', async (code) => {
    database.connect.mockRejectedValue({ code });
    expect(await checkDatabaseConnection()).toEqual({ connected: false, error: code });
  });
});
