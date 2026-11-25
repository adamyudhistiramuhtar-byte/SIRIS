import express, { type Application } from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { correlationIdMiddleware } from './middleware/correlation-id.js';
import { requestLogger } from './middleware/request-logger.js';
import { errorHandler } from './middleware/error-handler.js';
import { rootRouter } from './routes/index.js';
import { NotFoundError } from './errors/app-error.js';

export function createApp(): Application {
  const app: Application = express();

  // Trust proxy jika di balik reverse proxy / load balancer
  app.set('trust proxy', 1);

  // Security & tracing middlewares
  app.use(correlationIdMiddleware);
  app.use(requestLogger);

  // CORS configuration. Wildcard tidak boleh digabung dengan credentials:
  // mode wildcard memakai origin '*' tanpa credentials sehingga origin pemanggil
  // tidak pernah dipantulkan (reflected).
  const allowedOrigins = env.ALLOWED_ORIGIN.split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
  const allowWildcard = allowedOrigins.includes('*');

  app.use(
    cors({
      origin: allowWildcard ? '*' : allowedOrigins,
      credentials: !allowWildcard,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID'],
      exposedHeaders: ['X-Correlation-ID'],
    }),
  );

  // Parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Routes
  app.use(rootRouter);

  // 404 handler untuk route yang tidak ditemukan
  app.use((req, _res, next) => {
    next(new NotFoundError(`Endpoint ${req.method} ${req.path} tidak ditemukan.`));
  });

  // Centralized Error handler
  app.use(errorHandler);

  return app;
}

export const app = createApp();
