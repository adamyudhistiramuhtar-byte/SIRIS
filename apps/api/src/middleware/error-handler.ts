import type { Request, Response, NextFunction } from 'express';
import type { ApiErrorResponse } from '@siris/contracts';
import { AppError } from '../errors/app-error.js';
import { env } from '../config/env.js';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const correlationId = req.correlationId || '00000000-0000-0000-0000-000000000000';

  if (err instanceof AppError) {
    const payload: ApiErrorResponse = {
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        correlation_id: correlationId,
      },
    };
    res.status(err.statusCode).json(payload);
    return;
  }

  // Handle syntax error dari JSON parser Express
  if ('type' in err && (err as { type: string }).type === 'entity.parse.failed') {
    const payload: ApiErrorResponse = {
      error: {
        code: 'INVALID_JSON',
        message: 'Format payload JSON tidak valid.',
        correlation_id: correlationId,
      },
    };
    res.status(400).json(payload);
    return;
  }

  // Error tidak terduga (Internal Server Error)
  if (env.LOG_LEVEL === 'debug' || env.NODE_ENV !== 'test') {
    console.error(`[${correlationId}] Unhandled Error:`, err);
  }

  const payload: ApiErrorResponse = {
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Terjadi kesalahan internal pada server.',
      correlation_id: correlationId,
    },
  };

  res.status(500).json(payload);
}

