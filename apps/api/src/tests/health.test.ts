import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';

describe('Health Endpoint Tests', () => {
  it('GET /health harus mengembalikan status 200 dan data health yang valid', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data.status).toBe('ok');
    expect(res.body.data.service).toBe('SIRIS Backend API');
    expect(res.body.data.version).toBe('0.1.0');
    expect(typeof res.body.data.uptime_seconds).toBe('number');
    expect(res.body).toHaveProperty('meta');
    expect(res.body.meta).toHaveProperty('correlation_id');
    expect(res.headers['x-correlation-id']).toBe(res.body.meta.correlation_id);
  });

  it('GET /api/v1/health harus mengembalikan status 200 sesuai kontrak DOC-09', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('ok');
    expect(res.body.meta.correlation_id).toBeDefined();
  });

  it('Harus menghormati header X-Correlation-ID yang dikirimkan klien', async () => {
    const customCorrelationId = 'test-client-correlation-id-12345';
    const res = await request(app)
      .get('/health')
      .set('X-Correlation-ID', customCorrelationId);

    expect(res.status).toBe(200);
    expect(res.headers['x-correlation-id']).toBe(customCorrelationId);
    expect(res.body.meta.correlation_id).toBe(customCorrelationId);
  });
});

