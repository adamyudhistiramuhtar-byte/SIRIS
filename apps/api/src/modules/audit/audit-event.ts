import { randomUUID } from 'node:crypto';
import { z } from 'zod';

export const auditOutcomes = ['SUCCESS', 'FAILURE', 'CANCELLED', 'DENIED'] as const;
const uuid = z.string().uuid();
const contextSchema = z.object({
  row_count: z.number().int().nonnegative().safe().optional(),
  error_count: z.number().int().nonnegative().safe().optional(),
  warning_count: z.number().int().nonnegative().safe().optional(),
  kind: z.enum(['EXPECTED', 'COMMITMENT', 'RECEIVING', 'STOCK', 'COUNT']).optional(),
  reason_code: z.enum(['TRANSACTION_FAILED', 'ACCESS_DENIED', 'USER_CANCELLED', 'DATABASE_UNAVAILABLE',
    'INVALID_METADATA', 'INVALID_FILE', 'LIMIT_EXCEEDED', 'SOURCE_REQUIRED', 'CUTOFF_UNVERIFIED']).optional(),
}).strict();

const inputSchema = z.object({
  actor_id: uuid.nullable().optional(),
  warehouse_id: uuid.nullable().optional(),
  mode: z.enum(['ACTUAL', 'UJI']).nullable().optional(),
  batch_id: uuid.nullable().optional(),
  source_row_id: uuid.nullable().optional(),
  action: z.enum(['import.stage', 'import.validate', 'import.commit', 'import.cancel', 'auth.login', 'auth.logout', 'authorization.check', 'reconciliation.create']),
  outcome: z.enum(auditOutcomes),
  correlation_id: uuid,
  context_safe: contextSchema.optional(),
}).strict().refine((event) => !event.source_row_id || !!event.batch_id)
  .refine((event) => !event.batch_id || (!!event.warehouse_id && !!event.mode));

export type AuditInput = z.input<typeof inputSchema>;
export interface AuditRecord extends AuditInput {
  id: string;
  created_at: string;
}
export interface Clock { now(): Date; }
export const systemClock: Clock = { now: () => new Date() };

/** Header tidak sah tidak disimpan sebagai correlation UUID atau bagian log. */
export function auditCorrelationId(header: unknown): string {
  const parsed = uuid.safeParse(header);
  return parsed.success ? parsed.data : randomUUID();
}

export function createAuditRecord(input: AuditInput, clock: Clock = systemClock): AuditRecord {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) throw new Error('INVALID_AUDIT_EVENT');
  return { ...parsed.data, id: randomUUID(), created_at: clock.now().toISOString() };
}
