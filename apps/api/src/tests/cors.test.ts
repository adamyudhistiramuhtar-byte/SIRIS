import { afterEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import type { Application } from 'express';

/**
 * Mengimpor ulang app dengan ALLOWED_ORIGIN tertentu agar pengujian memakai
 * jalur middleware CORS yang sama dengan aplikasi produksi.
 */
async function createAppWithAllowedOrigin(allowedOrigin: string): Promise<Application> {
  vi.resetModules();
  vi.stubEnv('ALLOWED_ORIGIN', allowedOrigin);
  const { createApp } = await import('../app.js');
  return createApp();
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('Konfigurasi CORS SRS-43', () => {
  it(
    'mengizinkan origin yang terdaftar dengan credentials',
    async () => {
      const app = await createAppWithAllowedOrigin('http://localhost:5173');
      const res = await request(app).get('/health').set('Origin', 'http://localhost:5173');

      expect(res.status).toBe(200);
      expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
      expect(res.headers['access-control-allow-credentials']).toBe('true');
    },
    20_000,
  );

  it(
    'tidak memantulkan origin yang tidak terdaftar',
    async () => {
      const app = await createAppWithAllowedOrigin('http://localhost:5173');
      const res = await request(app).get('/health').set('Origin', 'https://evil.example');

      expect(res.status).toBe(200);
      // Tanpa Access-Control-Allow-Origin, browser memblokir akses lintas origin.
      expect(res.headers['access-control-allow-origin']).toBeUndefined();
    },
    20_000,
  );

  it(
    'mendukung beberapa origin allowlist yang dipisahkan koma',
    async () => {
      const app = await createAppWithAllowedOrigin(
        'http://a.siris-uji.test, http://b.siris-uji.test',
      );
      const res = await request(app).get('/health').set('Origin', 'http://b.siris-uji.test');

      expect(res.headers['access-control-allow-origin']).toBe('http://b.siris-uji.test');
      expect(res.headers['access-control-allow-credentials']).toBe('true');
    },
    20_000,
  );

  it(
    'mengizinkan preflight OPTIONS untuk origin allowlist',
    async () => {
      const app = await createAppWithAllowedOrigin('http://localhost:5173');
      const res = await request(app)
        .options('/health')
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'GET')
        .set('Access-Control-Request-Headers', 'Content-Type');

      expect(res.status).toBe(204);
      expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
      expect(res.headers['access-control-allow-credentials']).toBe('true');
      expect(res.headers['access-control-allow-methods']).toContain('GET');
    },
    20_000,
  );

  it(
    'tidak mengirim header Access-Control-Allow-Origin saat request tanpa Origin',
    async () => {
      const app = await createAppWithAllowedOrigin('http://localhost:5173');
      const res = await request(app).get('/health');

      expect(res.headers['access-control-allow-origin']).toBeUndefined();
    },
    20_000,
  );

  it(
    'wildcard tidak boleh dipantulkan bersama credentials',
    async () => {
      const app = await createAppWithAllowedOrigin('*');
      const res = await request(app).get('/health').set('Origin', 'https://attacker.example');

      expect(res.headers['access-control-allow-origin']).toBe('*');
      expect(res.headers['access-control-allow-origin']).not.toBe('https://attacker.example');
      expect(res.headers['access-control-allow-credentials']).toBeUndefined();
    },
    20_000,
  );

  it(
    'preflight wildcard tidak mengaktifkan credentials',
    async () => {
      const app = await createAppWithAllowedOrigin('*');
      const res = await request(app)
        .options('/health')
        .set('Origin', 'https://attacker.example')
        .set('Access-Control-Request-Method', 'GET');

      expect(res.headers['access-control-allow-origin']).toBe('*');
      expect(res.headers['access-control-allow-credentials']).toBeUndefined();
    },
    20_000,
  );
});
