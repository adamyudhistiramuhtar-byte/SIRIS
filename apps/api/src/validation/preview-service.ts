import { createHash } from 'node:crypto';
import type {
  BuildPreviewInput,
  PreviewAuthorizer,
  PreviewResult,
  ReadOwnedStaging,
  StagingRow,
  ValidationIssue,
  ValidationSeverity,
} from './preview-types.js';

export const PREVIEW_VALIDATION_VERSION = 'srs51-preview-v1';
export const PREVIEW_TTL_MS = 30 * 60 * 1000;

// Pembanding eksplisit agar kanonikalisasi hash tidak bergantung pada locale.
function compareStrings(a: string, b: string): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

function stableJson(value: unknown): string {
  if (value instanceof Date) {
    const ms = value.getTime();
    const serialized = Number.isFinite(ms) ? value.toISOString() : 'INVALID_DATE';
    return JSON.stringify(serialized);
  }
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => compareStrings(a, b));
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

function issueId(
  batchId: string,
  component: string,
  code: string,
  severity: ValidationSeverity,
  rowNumber: number | null | undefined,
  field?: string | null,
): string {
  const prefix = severity === 'WARNING' ? 'warn_' : 'err_';
  const raw = `${batchId}|${component}|${severity}|${code}|${rowNumber ?? 'batch'}|${field ?? ''}`;
  return `${prefix}${createHash('sha1').update(raw).digest('hex').slice(0, 16)}`;
}

export interface PreviewRowValidationFinding {
  severity: ValidationSeverity;
  code: string;
  message: string;
  field?: string | null;
}

export type PreviewRowValidator = (row: StagingRow) => readonly PreviewRowValidationFinding[];

function validationError(code: string, message: string, statusCode = 403): Error & { code: string; statusCode: number } {
  return Object.assign(new Error(message), { code, statusCode });
}

export interface PreviewServiceDeps {
  readOwnedStaging: ReadOwnedStaging;
  authorizer: PreviewAuthorizer;
  now?: () => number;
  ttlMs?: number;
  validationVersion?: string;
  /** Aturan validasi tambahan (mis. WARNING) yang diinjeksi; default kosong (tanpa perilaku tambahan). */
  rowValidators?: readonly PreviewRowValidator[];
}

export function createPreviewService(deps: PreviewServiceDeps) {
  const now = deps.now ?? (() => Date.now());
  const ttlMs = deps.ttlMs ?? PREVIEW_TTL_MS;
  const validationVersion = deps.validationVersion ?? PREVIEW_VALIDATION_VERSION;
  const rowValidators = deps.rowValidators ?? [];

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
    const issueComponents = new Map<string, string>();
    const addIssue = (component: string, issue: ValidationIssue): void => {
      issues.push(issue);
      issueComponents.set(issue.id, component);
    };
    const componentRowCounter = new Map<string, number>();

    rows.forEach((row) => {
      const expectedRow = (componentRowCounter.get(row.component) ?? 0) + 1;
      componentRowCounter.set(row.component, expectedRow);
      if (row.row_number !== expectedRow) {
        addIssue(row.component, {
          id: issueId(input.batchId, row.component, 'ROW_ORDER_INVALID', 'ERROR', row.row_number, 'row_number'),
          severity: 'ERROR',
          code: 'ROW_ORDER_INVALID',
          message: `Urutan baris tidak valid pada row_number ${row.row_number}.`,
          rowNumber: row.row_number,
          field: 'row_number',
        });
      }
      if (row.validation_status === 'INVALID') {
        addIssue(row.component, {
          id: issueId(input.batchId, row.component, 'ROW_INVALID', 'ERROR', row.row_number),
          severity: 'ERROR',
          code: 'ROW_INVALID',
          message: `Baris ${row.row_number} tidak valid.`,
          rowNumber: row.row_number,
        });
      }
      if (row.validation_status === 'PENDING') {
        addIssue(row.component, {
          id: issueId(input.batchId, row.component, 'ROW_PENDING', 'ERROR', row.row_number),
          severity: 'ERROR',
          code: 'ROW_PENDING',
          message: `Baris ${row.row_number} masih menunggu validasi dan belum boleh di-commit.`,
          rowNumber: row.row_number,
        });
      }
      const qty = row.normalized_payload.quantity;
      if (typeof qty === 'number' && qty < 0) {
        addIssue(row.component, {
          id: issueId(input.batchId, row.component, 'NEGATIVE_QUANTITY', 'ERROR', row.row_number, 'quantity'),
          severity: 'ERROR',
          code: 'NEGATIVE_QUANTITY',
          message: `Kuantitas negatif pada baris ${row.row_number}.`,
          rowNumber: row.row_number,
          field: 'quantity',
        });
      }
      for (const validateRow of rowValidators) {
        for (const finding of validateRow(row)) {
          addIssue(row.component, {
            id: issueId(input.batchId, row.component, finding.code, finding.severity, row.row_number, finding.field),
            severity: finding.severity,
            code: finding.code,
            message: finding.message,
            rowNumber: row.row_number,
            ...(finding.field !== undefined ? { field: finding.field } : {}),
          });
        }
      }
    });

    const dedup = new Map<string, ValidationIssue>();
    for (const issue of issues) dedup.set(issue.id, issue);
    const finalIssues = [...dedup.values()].sort(
      (a, b) =>
        compareStrings(issueComponents.get(a.id) ?? '', issueComponents.get(b.id) ?? '') ||
        (a.rowNumber ?? 0) - (b.rowNumber ?? 0) ||
        compareStrings(a.code, b.code) ||
        compareStrings(a.id, b.id),
    );
    const errors = finalIssues.filter((i) => i.severity === 'ERROR');
    const warnings = finalIssues.filter((i) => i.severity === 'WARNING');
    const hasPendingValidation = finalIssues.some((i) => i.code === 'ROW_PENDING');

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
    // Fail-closed: selama belum ada mekanisme acknowledgment warning yang disepakati,
    // warning yang ada (jika nanti ada) tidak boleh melewati syarat commit.
    const canCommit = errors.length === 0 && !hasPendingValidation && warnings.length === 0;
    return {
      batchId: input.batchId,
      status: canCommit ? 'VALID' : 'INVALID',
      fingerprint,
      validationVersion,
      expiresAt: new Date(expiresAtMs).toISOString(),
      expiresInMs: ttlMs,
      issues: finalIssues,
      warnings,
      errors,
      rowCount: rows.length,
      canCommit,
    };
  }

  function assertPreviewFresh(preview: PreviewResult, currentFingerprint: string, at = now()): void {
    if (preview.fingerprint !== currentFingerprint) {
      throw validationError('PREVIEW_INVALIDATED', 'Preview tidak lagi valid karena data/scope berubah.', 409);
    }
    const expiresAtMs = Date.parse(preview.expiresAt);
    if (!Number.isFinite(expiresAtMs)) {
      throw validationError('PREVIEW_EXPIRED', 'Preview memiliki tanggal kedaluwarsa yang tidak valid.', 409);
    }
    if (at >= expiresAtMs) {
      throw validationError('PREVIEW_EXPIRED', 'Preview kedaluwarsa. Validasi ulang diperlukan.', 409);
    }
  }

  return { buildPreview, assertPreviewFresh, validationVersion, ttlMs };
}
