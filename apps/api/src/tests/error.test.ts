import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';

describe('Error Handling Middleware Tests', () => {
  it('Route yang tidak ada harus menghasilkan 404 dengan struktur ApiErrorResponse DOC-09', async () => {
    const res = await request(app).get('/api/v1/non-existent-route-999');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toHaveProperty('code', 'NOT_FOUND');
    expect(res.body.error).toHaveProperty('message');
    expect(res.body.error).toHaveProperty('correlation_id');
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
});
