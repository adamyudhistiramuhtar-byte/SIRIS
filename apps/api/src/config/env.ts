import { config } from 'dotenv';
import { z } from 'zod';

// Muat .env jika file ada
config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1).max(65535))
    .default('3001'),
  DATABASE_URL: z.string().optional().default(''),
  ALLOWED_ORIGIN: z.string().default('http://localhost:5173'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  APP_TIMEZONE: z.string().default('Asia/Jakarta'),
  API_PREFIX: z.string().default('/api/v1'),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(override?: Record<string, string | undefined>): Env {
  const source = override || process.env;
  const result = envSchema.safeParse(source);

  if (!result.success) {
    const errorDetails = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Environment validation failed:\n${errorDetails}`);
  }

  return result.data;
}

export const env = loadEnv();

