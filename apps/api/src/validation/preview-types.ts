import type { DataMode } from '@siris/contracts';

export type ValidationSeverity = 'ERROR' | 'WARNING';

export interface ValidationIssue {
  id: string;
  severity: ValidationSeverity;
  code: string;
  message: string;
  rowNumber?: number | null;
  field?: string | null;
}

export interface StagingRow {
  id: string;
  component: string;
  row_number: number;
  raw_payload: Record<string, unknown>;
  normalized_payload: Record<string, unknown>;
  validation_status: 'PENDING' | 'VALID' | 'INVALID';
}

export interface ReadOwnedStagingInput {
  batchId: string;
  actorId: string;
}

export type ReadOwnedStaging = (input: ReadOwnedStagingInput) => Promise<StagingRow[]>;

export interface PreviewActor {
  accountId: string;
  role: string;
  warehouseIds: readonly string[];
  active: boolean;
  sessionRevoked?: boolean;
}

export interface PreviewAuthorizeInput {
  actor: PreviewActor | null;
  action: 'import:preview' | 'import:validate';
  scope: { warehouseId: string; mode: DataMode; batchOwnerId?: string | null };
}

export interface PreviewAuthorizeDecision {
  allowed: boolean;
  reason: string;
}

export interface PreviewAuthorizer {
  authorize(input: PreviewAuthorizeInput): PreviewAuthorizeDecision;
}

export interface BuildPreviewInput {
  batchId: string;
  warehouseId: string;
  mode: DataMode;
  importType: string;
  actor: PreviewActor | null;
  batchOwnerId: string;
  sourceHash: string;
  contractVersion: string;
  metadata: Record<string, unknown>;
}

export interface PreviewResult {
  batchId: string;
  status: 'VALID' | 'INVALID';
  fingerprint: string;
  validationVersion: string;
  expiresAt: string;
  expiresInMs: number;
  issues: ValidationIssue[];
  warnings: ValidationIssue[];
  errors: ValidationIssue[];
  rowCount: number;
  canCommit: boolean;
}

export interface PreviewValidationError {
  code: string;
  statusCode: number;
  message: string;
  details?: Array<{ code: string; field?: string; message?: string }>;
}
