import type { Request, Response } from 'express';
import type { ApiResponse, HealthCheckData } from '@siris/contracts';
import { env } from '../config/env.js';

const startTime = Date.now();

export function getHealth(req: Request, res: Response): void {
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);

  const data: HealthCheckData = {
    status: 'ok',
    service: 'SIRIS Backend API',
    version: '0.1.0',
    uptime_seconds: uptimeSeconds,
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  };

  const response: ApiResponse<HealthCheckData> = {
    data,
    meta: {
      correlation_id: req.correlationId,
      timestamp: data.timestamp,
    },
  };

  res.status(200).json(response);
}

