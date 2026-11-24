import { EventEmitter, once } from 'node:events';
import { createServer } from 'node:http';
import { expect, it } from 'vitest';
import pg from 'pg';
import { closeDbPool, getDbPool } from '../../../apps/api/src/shared/db/pool.js';
import { createGracefulShutdown } from '../../../apps/api/src/shared/shutdown.js';

it.skipIf(!process.env.DATABASE_URL)('menutup koneksi PostgreSQL UJI yang aktif sebelum melaporkan shutdown sukses', async () => {
  const url = new URL(process.env.DATABASE_URL!);
  const localUji = ['postgres:', 'postgresql:'].includes(url.protocol) &&
    url.hostname === '127.0.0.1' && ['55432', '55433'].includes(url.port) &&
    url.pathname === '/siris_uji' && url.username === 'siris_app' && !url.search && !url.hash;
  expect(localUji, 'Gunakan koneksi runtime PostgreSQL UJI lokal').toBe(true);

  const observer = new pg.Client({ connectionString: url.href });
  const server = createServer();
  const pool = getDbPool();
  let held: pg.PoolClient | undefined;
  try {
    await observer.connect();
    held = await pool.connect();
    const identity = await held.query(
      "SELECT pg_backend_pid() AS pid, current_user AS role, current_database() AS db, current_setting('server_version_num') AS version",
    );
    expect(identity.rows[0]).toMatchObject({ role: 'siris_app', db: 'siris_uji', version: '160006' });
    const listening = once(server, 'listening');
    server.listen(0, '127.0.0.1');
    await listening;

    const events = new EventEmitter();
    const draining = once(events, 'draining');
    const finished = once(events, 'finished');
    const shutdown = createGracefulShutdown(server, async () => {
      const closing = closeDbPool();
      events.emit('draining');
      await closing;
    }, { exit: (code) => { events.emit('finished', code); }, log: () => {}, error: () => {}, timeoutMs: 3000 });
    shutdown();
    shutdown();
    await draining;
    expect(server.listening).toBe(false);
    const active = () => observer.query('SELECT 1 FROM pg_stat_activity WHERE pid=$1', [identity.rows[0].pid]);
    expect((await active()).rowCount).toBe(1);
    held.release();
    held = undefined;
    expect(await finished).toEqual([0]);
    await expect.poll(async () => (await active()).rowCount).toBe(0);
  } finally {
    held?.release();
    if (server.listening) await new Promise<void>((resolve) => server.close(() => resolve()));
    await closeDbPool();
    await observer.end();
  }
});
