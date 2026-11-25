import { afterEach, describe, expect, it, vi } from 'vitest';
import express, { type Application } from 'express';
import request from 'supertest';
import { correlationIdMiddleware } from '../middleware/correlation-id.js';
import { errorHandler } from '../middleware/error-handler.js';
import { env } from '../config/env.js';

function buildApp(action: () => void): Application {
  const testApp = express();
  testApp.use(correlationIdMiddleware);
  testApp.get('/boom', () => {
    action();
  });
  testApp.use(errorHandler);
  return testApp;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Batas kerahasiaan log error SRS-43 (error-handler)', () => {
  it.each(['info', 'debug'] as const)('tidak mencatat properti error mentah pada level %s', async (level) => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const previousLevel = env.LOG_LEVEL;
    env.LOG_LEVEL = level;
    try {
      const app = buildApp(() => {
        throw Object.assign(new Error('PRIVATE_MESSAGE_SENTINEL'), {
          name: 'PRIVATE_NAME_SENTINEL',
          code: 'PRIVATE_CODE_SENTINEL',
          stack: 'Error\n    at PRIVATE_STACK_SENTINEL',
        });
      });
      const correlation = '00000000-0000-4000-8000-000000000001';
      const response = await request(app).get('/boom').set('X-Correlation-ID', correlation);

      expect(response.status).toBe(500);
      expect(response.body.error.code).toBe('INTERNAL_SERVER_ERROR');
      expect(response.body.error.message).toBe('Terjadi kesalahan internal pada server.');
      expect(response.body.error.details).toEqual([]);
      expect(response.body.error.correlation_id).toBe(correlation);

      const output = JSON.stringify([log.mock.calls, response.body]);
      for (const property of ['MESSAGE', 'NAME', 'CODE', 'STACK']) {
        expect(output).not.toContain(`PRIVATE_${property}_SENTINEL`);
      }
      expect(log).toHaveBeenCalledOnce();
      expect(log.mock.calls[0].join(' ')).toContain(correlation);
      expect(log.mock.calls[0].join(' ')).toContain('INTERNAL_SERVER_ERROR');
    } finally {
      env.LOG_LEVEL = previousLevel;
    }
  });

  it('tidak menyalin correlation header non-UUID ke log dan tetap memakai UUID server yang konsisten', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const app = buildApp(() => {
      throw new Error('failure');
    });
    const sentinel = 'PRIVATE_HEADER_SENTINEL';
    const response = await request(app).get('/boom').set('X-Correlation-ID', sentinel);

    expect(response.status).toBe(500);
    const correlationId = response.headers['x-correlation-id'];
    expect(correlationId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(response.body.error.correlation_id).toBe(correlationId);
    expect(JSON.stringify(log.mock.calls)).not.toContain(sentinel);
    expect(log.mock.calls[0].join(' ')).toContain(correlationId);
  });
});
