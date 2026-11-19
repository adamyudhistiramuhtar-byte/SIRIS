import type { ApiErrorDetail } from '@siris/contracts';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: ApiErrorDetail[];

  constructor(
    statusCode: number,
    code: string,
    message: string,
    details?: ApiErrorDetail[],
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource tidak ditemukan.', details?: ApiErrorDetail[]) {
    super(404, 'NOT_FOUND', message, details);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validasi data gagal.', details?: ApiErrorDetail[]) {
    super(422, 'VALIDATION_ERROR', message, details);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Permintaan tidak valid.', code = 'BAD_REQUEST', details?: ApiErrorDetail[]) {
    super(400, code, message, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Sesi tidak sah atau tidak ditemukan.') {
    super(401, 'UNAUTHORIZED', message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Akses ditolak untuk role atau gudang ini.') {
    super(403, 'FORBIDDEN', message);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Terjadi konflik data atau state.', code = 'CONFLICT', details?: ApiErrorDetail[]) {
    super(409, code, message, details);
  }
}
