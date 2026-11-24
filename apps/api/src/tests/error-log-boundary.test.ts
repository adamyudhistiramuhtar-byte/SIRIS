import { afterEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { correlationIdMiddleware } from '../middleware/correlation-id.js';
import { errorHandler } from '../middleware/error-handler.js';
import { env } from '../config/env.js';

afterEach(() => { vi.restoreAllMocks(); });

describe('Batas kerahasiaan log error SRS-43', () => {
  it.each(['info', 'debug'] as const)('tidak mencatat properti error mentah pada level %s', async (level) => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const previousLevel = env.LOG_LEVEL;
    env.LOG_LEVEL = level;
    try {
      const app = express();
      app.use(correlationIdMiddleware);
      app.get('/boom', () => {
        throw Object.assign(new Error('PRIVATE_MESSAGE_SENTINEL'), {
          name: 'PRIVATE_NAME_SENTINEL', code: 'PRIVATE_CODE_SENTINEL',
          stack: 'Error\n    at PRIVATE_STACK_SENTINEL',
        });
      });
      app.use(errorHandler);
      const correlation = '00000000-0000-4000-8000-000000000001';
      const response = await request(app).get('/boom').set('X-Correlation-ID', correlation);
      expect(response.status).toBe(500);
      expect(response.body.error.code).toBe('INTERNAL_SERVER_ERROR');
      expect(response.body.error.correlation_id).toBe(correlation);
      const output = JSON.stringify([log.mock.calls, response.body]);
      for (const property of ['MESSAGE', 'NAME', 'CODE', 'STACK']) {
        expect(output).not.toContain(`PRIVATE_${property}_SENTINEL`);
      }
      expect(log).toHaveBeenCalledOnce();
      expect(log.mock.calls[0].join(' ')).toContain(correlation);
    } finally { env.LOG_LEVEL = previousLevel; }
  });

  it('tidak menyalin correlation header non-UUID ke log', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const app = express();
    app.use(correlationIdMiddleware);
    app.get('/boom', () => { throw new Error('failure'); });
    app.use(errorHandler);
    const response = await request(app).get('/boom').set('X-Correlation-ID', 'PRIVATE_HEADER_SENTINEL');
    expect(response.status).toBe(500);
    expect(JSON.stringify(log.mock.calls)).not.toContain('PRIVATE_HEADER_SENTINEL');
  });
});
