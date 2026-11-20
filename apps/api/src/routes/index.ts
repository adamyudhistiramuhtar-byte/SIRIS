import { Router } from 'express';
import { v1Router } from './v1.routes.js';
import { getHealth } from '../controllers/health.controller.js';
import { env } from '../config/env.js';

export const rootRouter = Router();

// Top-level direct health check (untuk liveness/readiness probe)
rootRouter.get('/health', getHealth);

// Versioned API routes; prefix mengikuti konfigurasi API_PREFIX
rootRouter.use(env.API_PREFIX, v1Router);
