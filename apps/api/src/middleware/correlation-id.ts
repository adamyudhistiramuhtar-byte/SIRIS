import { randomUUID } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      correlationId: string;
    }
  }
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidCorrelationId(value: unknown): value is string {
  return typeof value === 'string' && UUID_PATTERN.test(value);
}

export function correlationIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const existing = req.header('x-correlation-id') || req.header('X-Correlation-ID');
  const candidate = typeof existing === 'string' ? existing.trim() : '';
  const correlationId = isValidCorrelationId(candidate) ? candidate : randomUUID();

  req.correlationId = correlationId;
  res.setHeader('X-Correlation-ID', correlationId);

  next();
}
