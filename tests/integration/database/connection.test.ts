import { describe, it, expect } from 'vitest';
import { checkDatabaseConnection } from '../../../apps/api/src/shared/db/pool.js';

describe('Database Connection Integration Test', () => {
  it('Harus menangani ketiadaan koneksi database secara aman tanpa crash', async () => {
    const result = await checkDatabaseConnection();

    expect(result).toHaveProperty('connected');

    if (result.connected) {
      // Jika instance PostgreSQL lokal aktif
      expect(typeof result.latency_ms).toBe('number');
      console.log(`[DB Test] PostgreSQL terhubung dengan latensi ${result.latency_ms}ms`);
    } else {
      // Jika PostgreSQL belum aktif (kondisi default tanpa server berjalan)
      expect(typeof result.error).toBe('string');
      console.log(`[DB Test - NOT RUN/BLOCKED] PostgreSQL belum aktif: ${result.error}`);
    }
  });
});

