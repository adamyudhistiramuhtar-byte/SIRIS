/**
 * Kontrak health check endpoint.
 */

export interface HealthCheckData {
  status: 'ok' | 'degraded';
  service: string;
  version: string;
  uptime_seconds: number;
  timestamp: string;
  environment: string;
}

