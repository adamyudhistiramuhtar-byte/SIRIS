import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import type { NextFunction, Request, Response } from 'express';
import { app } from '../app.js';
import { correlationIdMiddleware } from '../middleware/correlation-id.js';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const VALID_UUID = '3f6c1f8e-6a1d-4b2f-9c7e-2d4a5b6c7d8e';

function runMiddleware(headerValue: string | undefined): {
  correlationId: string;
  setHeader: ReturnType<typeof vi.fn>;
  next: ReturnType<typeof vi.fn>;
} {
  const req = {
    correlationId: '',
    header: vi.fn(() => headerValue),
  } as unknown as Request;
  const setHeader = vi.fn();
  const res = { setHeader } as unknown as Response;
  const next = vi.fn();

  correlationIdMiddleware(req, res, next as unknown as NextFunction);

  return { correlationId: req.correlationId, setHeader, next };
}

describe('Kontrak correlation ID SRS-43 (UUID)', () => {
  it('menerima UUID valid klien dan mempertahankannya pada header serta body', async () => {
    const res = await request(app).get('/health').set('X-Correlation-ID', VALID_UUID);

    expect(res.status).toBe(200);
    expect(res.headers['x-correlation-id']).toBe(VALID_UUID);
    expect(res.body.meta.correlation_id).toBe(VALID_UUID);
  });

  it('membuat UUID server saat header tidak dikirim', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.headers['x-correlation-id']).toMatch(UUID_PATTERN);
    expect(res.body.meta.correlation_id).toBe(res.headers['x-correlation-id']);
  });

  it('tidak memantulkan header non-UUID dan menggantinya dengan UUID server', async () => {
    const sentinel = 'PRIVATE_NON_UUID_SENTINEL';
    const res = await request(app).get('/health').set('X-Correlation-ID', sentinel);

    expect(res.status).toBe(200);
    expect(res.headers['x-correlation-id']).toMatch(UUID_PATTERN);
    expect(res.headers['x-correlation-id']).not.toBe(sentinel);
    expect(res.body.meta.correlation_id).toBe(res.headers['x-correlation-id']);
    expect(JSON.stringify(res.body)).not.toContain(sentinel);
  });

  it('mengganti UUID yang cacat dengan UUID server', async () => {
    const malformed = '3f6c1f8e-6a1d-4b2f-9c7e-2d4a5b6c7d8';
    const res = await request(app).get('/health').set('X-Correlation-ID', malformed);

    expect(res.headers['x-correlation-id']).toMatch(UUID_PATTERN);
    expect(res.headers['x-correlation-id']).not.toBe(malformed);
    expect(res.body.meta.correlation_id).toBe(res.headers['x-correlation-id']);
  });

  it('mengganti header yang sangat panjang dengan UUID server', async () => {
    const oversized = 'x'.repeat(8192);
    const res = await request(app).get('/health').set('X-Correlation-ID', oversized);

    expect(res.headers['x-correlation-id']).toMatch(UUID_PATTERN);
    expect(res.headers['x-correlation-id']).not.toBe(oversized);
  });

  it('menerima UUID valid yang dikelilingi whitespace setelah trim', async () => {
    const res = await request(app)
      .get('/health')
      .set('X-Correlation-ID', `  ${VALID_UUID}  `);

    expect(res.headers['x-correlation-id']).toBe(VALID_UUID);
  });

  it('mengganti header kosong atau whitespace saja dengan UUID server', () => {
    for (const headerValue of ['', '   ']) {
      const { correlationId, setHeader, next } = runMiddleware(headerValue);
      expect(next).toHaveBeenCalledTimes(1);
      expect(correlationId).toMatch(UUID_PATTERN);
      expect(setHeader).toHaveBeenCalledWith('X-Correlation-ID', correlationId);
    }
  });

  it('mengganti header dengan karakter kontrol dengan UUID server', () => {
    const { correlationId, setHeader } = runMiddleware('bad\u0000value\nheader');

    expect(correlationId).toMatch(UUID_PATTERN);
    expect(correlationId).not.toContain('\u0000');
    expect(setHeader).toHaveBeenCalledWith('X-Correlation-ID', correlationId);
  });

  it('tidak berbagi correlation ID antarpermintaan bersamaan', async () => {
    const responses = await Promise.all(
      Array.from({ length: 8 }, () => request(app).get('/health')),
    );
    const ids = responses.map((response) => response.headers['x-correlation-id']);

    for (const id of ids) expect(id).toMatch(UUID_PATTERN);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
