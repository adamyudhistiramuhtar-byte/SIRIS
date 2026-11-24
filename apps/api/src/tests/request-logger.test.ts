import { describe, it, expect } from 'vitest';
import { formatRequestLog } from '../middleware/request-logger.js';

describe('Request Logger Tests', () => {
  it('Harus mencatat path tanpa query string', () => {
    const line = formatRequestLog({
      method: 'GET',
      path: '/api/v1/imports?token=rahasia&storage_key=private/uji.csv',
      statusCode: 200,
      durationMs: 12,
      correlationId: 'uji-correlation-id',
    });

    expect(line).toContain('GET /api/v1/imports 200 12ms');
    expect(line).toContain('[uji-correlation-id]');
    expect(line).not.toContain('token');
    expect(line).not.toContain('rahasia');
    expect(line).not.toContain('storage_key');
    expect(line).not.toContain('?');
  });

  it('Harus tetap mencatat path akar saat query string berada di awal', () => {
    const line = formatRequestLog({
      method: 'POST',
      path: '/?debug=true',
      statusCode: 201,
      durationMs: 3,
      correlationId: 'uji-correlation-id-2',
    });

    expect(line).toContain('POST / 201 3ms');
    expect(line).not.toContain('debug');
  });
});
