import { createHash } from 'node:crypto';
import type {
  BuildPreviewInput,
  PreviewAuthorizer,
  PreviewResult,
  ReadOwnedStaging,
  StagingRow,
  ValidationIssue,
} from './preview-types.js';

export const PREVIEW_VALIDATION_VERSION = 'srs51-preview-v1';
export const PREVIEW_TTL_MS = 30 * 60 * 1000;

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableJson(v)}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

export function computePreviewFingerprint(input: {
  batchId: string;
  warehouseId: string;
  mode: string;
  importType: string;
  sourceHash: string;
  contractVersion: string;
  validationVersion: string;
  metadata: Record<string, unknown>;
  rows: StagingRow[];
}): string {
  const canonical = stableJson({
    batchId: input.batchId,
    warehouseId: input.warehouseId,
    mode: input.mode,
    importType: input.importType,
    sourceHash: input.sourceHash,
    contractVersion: input.contractVersion,
    validationVersion: input.validationVersion,
    metadata: input.metadata,
    rows: input.rows.map((r) => ({
      id: r.id,
      component: r.component,
      row_number: r.row_number,
      raw_payload: r.raw_payload,
      normalized_payload: r.normalized_payload,
      validation_status: r.validation_status,
    })),
  });
  return createHash('sha256').update(canonical).digest('hex');
}

function issueId(batchId: string, code: string, rowNumber: number | null | undefined, field?: string | null): string {
  const raw = `${batchId}|${code}|${rowNumber ?? 'batch'}|${field ?? ''}`;
  return `warn_${createHash('sha1').update(raw).digest('hex').slice(0, 16)}`;
}

function validationError(code: string, message: string, statusCode = 403): Error & { code: string; statusCode: number } {
  return Object.assign(new Error(message), { code, statusCode });
}

export interface PreviewServiceDeps {
  readOwnedStaging: ReadOwnedStaging;
  authorizer: PreviewAuthorizer;
  now?: () => number;
  ttlMs?: number;
  validationVersion?: string;
}

export function createPreviewService(deps: PreviewServiceDeps) {
  const now = deps.now ?? (() => Date.now());
  const ttlMs = deps.ttlMs ?? PREVIEW_TTL_MS;
  const validationVersion = deps.validationVersion ?? PREVIEW_VALIDATION_VERSION;

  async function buildPreview(input: BuildPreviewInput): Promise<PreviewResult> {
    const decision = deps.authorizer.authorize({
      actor: input.actor,
      action: 'import:preview',
      scope: { warehouseId: input.warehouseId, mode: input.mode, batchOwnerId: input.batchOwnerId },
    });
    if (!decision.allowed || !input.actor) {
      throw validationError('FORBIDDEN', 'Akses preview ditolak.', 403);
    }
    if (input.mode !== 'UJI') {
      throw validationError('MODE_NOT_ENABLED', 'Mode ACTUAL belum diaktifkan.', 422);
    }

    const rows = await deps.readOwnedStaging({ batchId: input.batchId, actorId: input.actor.accountId });
    const issues: ValidationIssue[] = [];

    rows.forEach((row, idx) => {
      const expectedRow = idx + 1;
      if (row.row_number !== expectedRow) {
        issues.push({
          id: issueId(input.batchId, 'ROW_ORDER_INVALID', row.row_number, 'row_number'),
          severity: 'ERROR',
          code: 'ROW_ORDER_INVALID',
          message: `Urutan baris tidak valid pada row_number ${row.row_number}.`,
          rowNumber: row.row_number,
          field: 'row_number',
        });
      }
      if (row.validation_status === 'INVALID') {
        issues.push({
          id: issueId(input.batchId, 'ROW_INVALID', row.row_number),
          severity: 'ERROR',
          code: 'ROW_INVALID',
          message: `Baris ${row.row_number} tidak valid.`,
          rowNumber: row.row_number,
        });
      }
      if (row.validation_status === 'PENDING') {
        issues.push({
          id: issueId(input.batchId, 'ROW_PENDING', row.row_number),
          severity: 'WARNING',
          code: 'ROW_PENDING',
          message: `Baris ${row.row_number} masih pending validasi.`,
          rowNumber: row.row_number,
        });
      }
      const qty = row.normalized_payload.quantity;
      if (typeof qty === 'number' && qty < 0) {
        issues.push({
          id: issueId(input.batchId, 'NEGATIVE_QUANTITY', row.row_number, 'quantity'),
          severity: 'ERROR',
          code: 'NEGATIVE_QUANTITY',
          message: `Kuantitas negatif pada baris ${row.row_number}.`,
          rowNumber: row.row_number,
          field: 'quantity',
        });
      }
    });

    const dedup = new Map<string, ValidationIssue>();
    for (const issue of issues) dedup.set(issue.id, issue);
    const finalIssues = [...dedup.values()].sort((a, b) => (a.rowNumber ?? 0) - (b.rowNumber ?? 0) || a.code.localeCompare(b.code));
    const errors = finalIssues.filter((i) => i.severity === 'ERROR');
    const warnings = finalIssues.filter((i) => i.severity === 'WARNING');

    const fingerprint = computePreviewFingerprint({
      batchId: input.batchId,
      warehouseId: input.warehouseId,
      mode: input.mode,
      importType: input.importType,
      sourceHash: input.sourceHash,
      contractVersion: input.contractVersion,
      validationVersion,
      metadata: input.metadata,
      rows,
    });

    const expiresAtMs = now() + ttlMs;
    return {
      batchId: input.batchId,
      status: errors.length > 0 ? 'INVALID' : 'VALID',
      fingerprint,
      validationVersion,
      expiresAt: new Date(expiresAtMs).toISOString(),
      expiresInMs: ttlMs,
      issues: finalIssues,
      warnings,
      errors,
      rowCount: rows.length,
      canCommit: errors.length === 0,
    };
  }

  function assertPreviewFresh(preview: PreviewResult, currentFingerprint: string, at = now()): void {
    if (preview.fingerprint !== currentFingerprint) {
      throw validationError('PREVIEW_INVALIDATED', 'Preview tidak lagi valid karena data/scope berubah.', 409);
    }
    if (at >= Date.parse(preview.expiresAt)) {
      throw validationError('PREVIEW_EXPIRED', 'Preview kedaluwarsa. Validasi ulang diperlukan.', 409);
    }
  }

  return { buildPreview, assertPreviewFresh, validationVersion, ttlMs };
}
