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

  it('Harus memakai default saat nilai template .env kosong atau hanya whitespace', () => {
    const loaded = loadEnv({
      NODE_ENV: '',
      PORT: '   ',
      DATABASE_URL: '',
      ALLOWED_ORIGIN: '',
      LOG_LEVEL: '',
      APP_TIMEZONE: '',
      API_PREFIX: '',
    });

    expect(loaded.NODE_ENV).toBe('development');
    expect(loaded.PORT).toBe(3001);
    expect(loaded.DATABASE_URL).toBe('');
    expect(loaded.ALLOWED_ORIGIN).toBe('http://localhost:5173');
    expect(loaded.LOG_LEVEL).toBe('info');
    expect(loaded.APP_TIMEZONE).toBe('Asia/Jakarta');
    expect(loaded.API_PREFIX).toBe('/api/v1');
  });

  it('Harus menolak konfigurasi PORT yang tidak valid', () => {
    expect(() => {
      loadEnv({ PORT: 'invalid-port' });
    }).toThrow(/Environment validation failed/);
  });

  it('Harus menolak PORT di luar rentang port TCP', () => {
    expect(() => loadEnv({ PORT: '0' })).toThrow(/Environment validation failed/);
    expect(() => loadEnv({ PORT: '70000' })).toThrow(/Environment validation failed/);
  });

  it('Harus menolak konfigurasi NODE_ENV di luar enum', () => {
    expect(() => {
      loadEnv({ NODE_ENV: 'staging' });
    }).toThrow(/Environment validation failed/);
  });

  it('Harus menolak API_PREFIX yang tidak diawali garis miring', () => {
    expect(() => loadEnv({ API_PREFIX: 'api/v1' })).toThrow(/Environment validation failed/);
  });

  it('Harus menormalkan garis miring di akhir API_PREFIX', () => {
    const loaded = loadEnv({ API_PREFIX: '/api/v1/' });
    expect(loaded.API_PREFIX).toBe('/api/v1');
  });
});
