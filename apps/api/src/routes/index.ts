import { Router } from 'express';
import { v1Router } from './v1.routes.js';
import { getHealth } from '../controllers/health.controller.js';

export const rootRouter = Router();

// Top-level direct health check (untuk liveness/readiness probe)
rootRouter.get('/health', getHealth);

// Versioned API routes
rootRouter.use('/api/v1', v1Router);
