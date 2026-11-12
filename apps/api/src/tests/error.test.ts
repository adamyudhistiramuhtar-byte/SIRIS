import { describe, it, expect, vi, afterEach } from 'vitest';
import request from 'supertest';
import express, { type Application } from 'express';
import { app } from '../app.js';
import { correlationIdMiddleware } from '../middleware/correlation-id.js';
import { errorHandler } from '../middleware/error-handler.js';

function createThrowingApp(): Application {
  const testApp = express();
  testApp.use(correlationIdMiddleware);
  testApp.get('/boom', () => {
    // Pesan ini menyerupai error driver yang tidak boleh bocor ke response.
    throw new Error("SELECT * FROM secret_table WHERE token = 'rahasia'");
  });
  testApp.use(errorHandler);
  return testApp;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Error Handling Middleware Tests', () => {
  it('Route yang tidak ada harus menghasilkan 404 dengan struktur ApiErrorResponse DOC-09', async () => {
    const res = await request(app).get('/api/v1/non-existent-route-999');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toHaveProperty('code', 'NOT_FOUND');
    expect(res.body.error).toHaveProperty('message');
    expect(res.body.error).toHaveProperty('correlation_id');
    expect(res.body.error.details).toEqual([]);
    expect(res.body.error.correlation_id).toBe(res.headers['x-correlation-id']);
  });

  it('Payload JSON rusak harus menghasilkan 400 INVALID_JSON', async () => {
    const res = await request(app)
      .post('/api/v1/health')
      .set('Content-Type', 'application/json')
      .send('{"invalid-json": ');

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error.code).toBe('INVALID_JSON');
    expect(res.body.error.correlation_id).toBeDefined();
  });

  it('Payload melebihi batas parser harus menghasilkan 413 tanpa detail internal', async () => {
    const tinyApp = express();
    tinyApp.use(correlationIdMiddleware);
    tinyApp.use(express.json({ limit: '1kb' }));
    tinyApp.post('/payload', (_req, res) => res.json({ ok: true }));
    tinyApp.use(errorHandler);

    const res = await request(tinyApp)
      .post('/payload')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ padding: 'x'.repeat(2 * 1024) }));

    expect(res.status).toBe(413);
    expect(res.body.error.code).toBe('PAYLOAD_TOO_LARGE');
    expect(JSON.stringify(res.body)).not.toContain('stack');
  });

  it('Error tak terduga tidak boleh membocorkan SQL, pesan mentah, atau stack', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const res = await request(createThrowingApp()).get('/boom');

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('INTERNAL_SERVER_ERROR');
    expect(res.body.error.message).toBe('Terjadi kesalahan internal pada server.');
    expect(res.body.error.details).toEqual([]);
    expect(res.body.error.correlation_id).toBeDefined();

    const serialized = JSON.stringify(res.body);
    expect(serialized).not.toContain('SELECT');
    expect(serialized).not.toContain('secret_table');
    expect(serialized).not.toContain('rahasia');
    expect(serialized).not.toContain('stack');

    // Log aman: hanya nama error dan correlation ID, bukan pesan mentah.
    const logged = consoleError.mock.calls.map((call) => call.join(' ')).join('\n');
    expect(logged).not.toContain('SELECT');
    expect(logged).not.toContain('rahasia');
    expect(logged).toContain('Error');
  });
});
