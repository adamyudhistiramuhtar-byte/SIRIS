import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../../apps/api/src/app.js';
import type { ApiResponse, HealthCheckData } from '@siris/contracts';

describe('Monorepo Integration: API & Shared Contracts', () => {
  it('Harus berhasil melayani GET /api/v1/health dengan tipe ApiResponse<HealthCheckData>', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(200);

    const body = res.body as ApiResponse<HealthCheckData>;

    // Validasi data sesuai kontrak @siris/contracts
    expect(body.data).toBeDefined();
    expect(body.data.status).toBe('ok');
    expect(body.data.service).toBe('SIRIS Backend API');
    expect(body.data.version).toBe('0.1.0');

    // Validasi metadata
    expect(body.meta).toBeDefined();
    expect(body.meta?.correlation_id).toBeDefined();
    expect(body.meta?.timestamp).toBeDefined();
  });
});
