import { Router } from 'express';
import { healthRouter } from './health.routes.js';

export const v1Router = Router();

// Mount health routes under v1
v1Router.use(healthRouter);

