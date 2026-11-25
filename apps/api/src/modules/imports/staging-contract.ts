import { z } from 'zod';

export const importKinds = ['EXPECTED', 'COMMITMENT', 'RECEIVING', 'STOCK', 'COUNT'] as const;
export type ImportKind = typeof importKinds[number];
export const stageMetadata = z.object({
  kind: z.enum(importKinds), warehouse_id: z.string().uuid(), mode: z.literal('UJI'),
  contract_version: z.string().min(1).max(64),
  source_name: z.string().min(1).max(255).refine((v) => ![...v].some((c) => c.charCodeAt(0) < 32 || c === '/' || c === '\\')),
  source_reference: z.string().min(1).max(128),
  source_timezone: z.string().min(1).max(64).optional(),
  cutoff_id: z.string().uuid().optional(),
}).strict().refine((v) => !['STOCK', 'COUNT'].includes(v.kind) || !!v.cutoff_id);
export type StageMetadata = z.infer<typeof stageMetadata>;

/** Hanya provider SRS-47/48 boleh membentuk konteks ini; bukan body/header actor. */
export interface StageActor {
  actor_id: string;
  role: 'PURCHASING' | 'WAREHOUSE' | 'PRODUCTION' | 'MANAGEMENT';
  warehouse_ids: readonly string[];
}
export interface StageAuthorizer {
  authorizeStage(scope: Pick<StageMetadata, 'kind' | 'warehouse_id' | 'mode'>): Promise<StageActor>;
}
export interface NormalizedSourceRow {
  row_number: number;
  raw: Record<string, unknown>;
  normalized: Record<string, unknown>;
}
export interface SourceAdapter {
  readonly kind: ImportKind;
  readonly version: string;
  readonly components: readonly string[];
  /** Komponen yang boleh dikirim, tetapi tidak diwajibkan. components tetap wajib. */
  readonly optionalComponents?: readonly string[];
  parse(bytes: Buffer, component: string): NormalizedSourceRow[];
}
export interface UploadPart { component: string; content: AsyncIterable<Uint8Array>; }
export interface StageLimits { max_bytes: number; max_rows: number; max_files: number; }
export interface StageResult {
  batch_id: string; kind: ImportKind; warehouse_id: string; mode: 'UJI';
  status: 'STAGED'; contract_version: string; source_hash: string; row_count: number;
  correlation_id: string;
}
export type StageErrorCode = 'INVALID_METADATA' | 'ACCESS_DENIED' | 'SOURCE_REQUIRED' | 'CUTOFF_UNVERIFIED' |
  'INVALID_FILE' | 'LIMIT_EXCEEDED' | 'STAGING_FAILED' | 'OUTCOME_UNKNOWN';
export class StageError extends Error {
  constructor(readonly code: StageErrorCode, readonly correlation_id?: string, readonly batch_id?: string) {
    super(code); this.name = 'StageError';
  }
}
