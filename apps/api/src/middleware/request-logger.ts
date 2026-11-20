import type { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';

export interface RequestLogInput {
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  correlationId: string;
}

/**
 * Membentuk satu baris log akses tanpa query string. Parameter query dapat
 * memuat token, pencarian sensitif, atau storage key sehingga tidak dicatat.
 */
export function formatRequestLog(input: RequestLogInput): string {
  const safePath = input.path.split('?')[0] || '/';
  return `[${new Date().toISOString()}] [${input.correlationId}] ${input.method} ${safePath} ${input.statusCode} ${input.durationMs}ms`;
}

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  if (env.NODE_ENV === 'test') {
    next();
    return;
  }

  const start = Date.now();
  res.on('finish', () => {
    console.log(
      formatRequestLog({
        method: req.method,
        // req.path tidak memuat query string; originalUrl dapat memuatnya.
        path: req.path,
        statusCode: res.statusCode,
        durationMs: Date.now() - start,
        correlationId: req.correlationId || '-',
      }),
    );
  });

  next();
}
