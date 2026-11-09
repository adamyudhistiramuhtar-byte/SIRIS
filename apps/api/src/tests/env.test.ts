import { describe, it, expect } from 'vitest';
import { loadEnv } from '../config/env.js';

describe('Environment Configuration Validation Tests', () => {
  it('Harus memuat nilai default yang aman saat env kosong', () => {
    const loaded = loadEnv({});

    expect(loaded.NODE_ENV).toBe('development');
    expect(loaded.PORT).toBe(3001);
    expect(loaded.APP_TIMEZONE).toBe('Asia/Jakarta');
    expect(loaded.ALLOWED_ORIGIN).toBe('http://localhost:5173');
    expect(loaded.API_PREFIX).toBe('/api/v1');
  });

  it('Harus menolak konfigurasi PORT yang tidak valid', () => {
    expect(() => {
      loadEnv({ PORT: 'invalid-port' });
    }).toThrow(/Environment validation failed/);
  });

  it('Harus menolak konfigurasi NODE_ENV di luar enum', () => {
    expect(() => {
      loadEnv({ NODE_ENV: 'staging' });
    }).toThrow(/Environment validation failed/);
  });
});

