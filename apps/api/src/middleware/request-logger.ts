import type { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  if (env.NODE_ENV === 'test') {
    next();
    return;
  }

  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const cid = req.correlationId || '-';
    console.log(`[${new Date().toISOString()}] [${cid}] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });

  next();
}
