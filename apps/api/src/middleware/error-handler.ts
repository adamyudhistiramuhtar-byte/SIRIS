import type { Request, Response, NextFunction } from 'express';
import type { ApiErrorDetail, ApiErrorResponse } from '@siris/contracts';
import { AppError } from '../errors/app-error.js';

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
 * Nama, code, dan stack milik exception juga dapat memuat data privat.
 * LOG_LEVEL=debug tidak mengubah batas kerahasiaan ini.
 */
function logUnexpectedError(correlationId: string): void {
  // Kontrak wire correlation tidak diubah; header yang belum tervalidasi
  // tidak disalin ke log. UUID sah tetap menghubungkan log dengan response.
  const safeCorrelationId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(correlationId)
    ? correlationId : 'CORRELATION_UNAVAILABLE';
  console.error(`[${safeCorrelationId}] Unhandled Error: INTERNAL_SERVER_ERROR`);
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const correlationId = req.correlationId || '00000000-0000-0000-0000-000000000000';

  // Express memungkinkan nilai error yang tidak berupa Error instance (misalnya
  // string). Normalisasi sebelum diproses agar deteksi type dan log aman.
  const error = err instanceof Error ? err : new Error('Unknown error');

  if (error instanceof AppError) {
    res
      .status(error.statusCode)
      .json(buildErrorResponse(error.code, error.message, correlationId, error.details));
    return;
  }

  // Handle syntax error dari JSON parser Express
  if ('type' in error && (error as { type: string }).type === 'entity.parse.failed') {
    res
      .status(400)
      .json(buildErrorResponse('INVALID_JSON', 'Format payload JSON tidak valid.', correlationId));
    return;
  }

  // Handle payload melebihi batas parser Express
  if ('type' in error && (error as { type: string }).type === 'entity.too.large') {
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

  logUnexpectedError(correlationId);

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
