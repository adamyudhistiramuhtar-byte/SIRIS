import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createGracefulShutdown } from '../shared/shutdown.js';

describe('SRS-43 penutupan server', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());
  const effects = () => ({ exit: vi.fn(), log: vi.fn(), error: vi.fn(), timeoutMs: 100 });

  it('menunggu database dan keluar sukses satu kali pada sinyal berulang', async () => {
    const output = effects();
    let resolve: () => void = () => {};
    const closeDatabase = vi.fn(() => new Promise<void>((done) => { resolve = done; }));
    const server = { close: vi.fn((done: () => void) => done()) };
    const shutdown = createGracefulShutdown(server, closeDatabase, output);
    shutdown(); shutdown();
    expect(output.exit).not.toHaveBeenCalled();
    resolve();
    await vi.runAllTimersAsync();
    expect(output.exit).toHaveBeenCalledExactlyOnceWith(0);
    expect(server.close).toHaveBeenCalledTimes(1);
    expect(closeDatabase).toHaveBeenCalledTimes(1);
    expect(output.error).not.toHaveBeenCalled();
  });

  it('keluar gagal tanpa membocorkan pesan, nama, SQL atau storage key dari error pool', async () => {
    const output = effects();
    const secret = 'SQL_RAW_CREDENTIAL_STORAGE_SENTINEL';
    const shutdown = createGracefulShutdown({ close: (done) => done() },
      async () => { throw Object.assign(new Error(secret), { name: secret }); }, output);
    shutdown();
    await vi.runAllTimersAsync();
    expect(output.exit).toHaveBeenCalledExactlyOnceWith(1);
    expect(JSON.stringify([output.log.mock.calls, output.error.mock.calls])).not.toContain(secret);
    expect(output.error).toHaveBeenCalledExactlyOnceWith('[SIRIS API] Gagal menutup database pool.');
  });

  it('tetap menutup database bila HTTP close mengembalikan error', async () => {
    const output = effects();
    const database = vi.fn().mockResolvedValue(undefined);
    createGracefulShutdown({ close: (done) => done(new Error('PRIVATE')) }, database, output)();
    await vi.runAllTimersAsync();
    expect(database).toHaveBeenCalledTimes(1);
    expect(output.exit).toHaveBeenCalledExactlyOnceWith(1);
    expect(JSON.stringify(output.error.mock.calls)).not.toContain('PRIVATE');
  });

  it('menangani exception sinkron saat HTTP close', async () => {
    const output = effects();
    const database = vi.fn().mockResolvedValue(undefined);
    createGracefulShutdown({ close: () => { throw new Error('PRIVATE'); } }, database, output)();
    await vi.runAllTimersAsync();
    expect(database).toHaveBeenCalledTimes(1);
    expect(output.exit).toHaveBeenCalledExactlyOnceWith(1);
  });

  it('memaksa keluar gagal ketika HTTP tidak pernah selesai', async () => {
    const output = effects();
    createGracefulShutdown({ close: () => {} }, async () => {}, output)();
    await vi.advanceTimersByTimeAsync(100);
    expect(output.exit).toHaveBeenCalledExactlyOnceWith(1);
  });

  it('tidak keluar dua kali bila database pulih setelah deadline', async () => {
    const output = effects();
    let resolve: () => void = () => {};
    createGracefulShutdown({ close: (done) => done() },
      () => new Promise<void>((done) => { resolve = done; }), output)();
    await vi.advanceTimersByTimeAsync(100);
    resolve();
    await vi.runAllTimersAsync();
    expect(output.exit).toHaveBeenCalledExactlyOnceWith(1);
  });
});
