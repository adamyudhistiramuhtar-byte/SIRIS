import { config } from 'dotenv';
import { z } from 'zod';

// Muat .env jika file ada
config();

/**
 * Nilai kosong atau berisi whitespace diperlakukan sebagai "tidak diisi"
 * sehingga default aman berlaku. Ini mencegah kegagalan startup hanya karena
 * template .env.example disalin apa adanya.
 */
function emptyToUndefined(value: unknown): unknown {
  if (typeof value === 'string' && value.trim() === '') {
    return undefined;
  }
  return value;
}

const apiPrefixSchema = z
  .string()
  .regex(
    /^\/[A-Za-z0-9][A-Za-z0-9/_-]*$/,
    'API_PREFIX harus diawali "/" dan hanya berisi segmen path yang sah.',
  )
  .transform((value) => (value.length > 1 ? value.replace(/\/+$/, '') : value));

const envSchema = z.object({
  NODE_ENV: z.preprocess(
    emptyToUndefined,
    z.enum(['development', 'test', 'production']).default('development'),
  ),
  PORT: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .regex(/^\d+$/, 'PORT harus berupa angka.')
      .transform((value) => Number.parseInt(value, 10))
      .pipe(z.number().int().min(1).max(65535))
      .default('3001'),
  ),
  DATABASE_URL: z.preprocess(emptyToUndefined, z.string().default('')),
  ALLOWED_ORIGIN: z.preprocess(emptyToUndefined, z.string().default('http://localhost:5173')),
  LOG_LEVEL: z.preprocess(
    emptyToUndefined,
    z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  ),
  APP_TIMEZONE: z.preprocess(emptyToUndefined, z.string().default('Asia/Jakarta')),
  API_PREFIX: z.preprocess(emptyToUndefined, apiPrefixSchema.default('/api/v1')),
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
