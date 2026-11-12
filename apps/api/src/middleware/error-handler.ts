import type { Request, Response, NextFunction } from 'express';
import type { ApiErrorDetail, ApiErrorResponse } from '@siris/contracts';
import { AppError } from '../errors/app-error.js';
import { env } from '../config/env.js';

function buildErrorResponse(
  code: string,
  message: string,
  correlationId: string,
  details: ApiErrorDetail[] = [],
): ApiErrorResponse {
  return {
    error: {
      code,
      message,
      details,
      correlation_id: correlationId,
    },
  };
}

/**
 * Log aman untuk error tak terduga. Pesan mentah, SQL, stack lengkap, dan
 * objek error tidak dicatat karena dapat memuat nilai sensitif atau storage key.
 * Stack frame hanya dicatat saat LOG_LEVEL=debug dan tanpa baris pesan.
 */
function logUnexpectedError(err: Error, correlationId: string): void {
  const rawCode = (err as { code?: unknown }).code;
  const safeCode = typeof rawCode === 'string' && /^[A-Za-z0-9_]+$/.test(rawCode) ? rawCode : undefined;
  const summary = `[${correlationId}] Unhandled Error: ${err.name}${safeCode ? ` code=${safeCode}` : ''}`;

  if (env.LOG_LEVEL === 'debug' && typeof err.stack === 'string') {
    const frames = err.stack.split('\n').slice(1).join('\n');
    console.error(frames ? `${summary}\n${frames}` : summary);
    return;
  }

  console.error(summary);
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const correlationId = req.correlationId || '00000000-0000-0000-0000-000000000000';

  if (err instanceof AppError) {
    res
      .status(err.statusCode)
      .json(buildErrorResponse(err.code, err.message, correlationId, err.details));
    return;
  }

  // Handle syntax error dari JSON parser Express
  if ('type' in err && (err as { type: string }).type === 'entity.parse.failed') {
    res
      .status(400)
      .json(buildErrorResponse('INVALID_JSON', 'Format payload JSON tidak valid.', correlationId));
    return;
  }

  // Handle payload melebihi batas parser Express
  if ('type' in err && (err as { type: string }).type === 'entity.too.large') {
    res
      .status(413)
      .json(
        buildErrorResponse(
          'PAYLOAD_TOO_LARGE',
          'Payload melebihi batas yang diizinkan.',
          correlationId,
        ),
      );
    return;
  }

  logUnexpectedError(err, correlationId);

  res
    .status(500)
    .json(
      buildErrorResponse(
        'INTERNAL_SERVER_ERROR',
        'Terjadi kesalahan internal pada server.',
        correlationId,
      ),
    );
}
