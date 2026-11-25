/**
 * CommitService dan CancelService SRS-52 (API-04/API-05) di atas port yang disuntik.
 * Status: PROPOSED, Fase A. Belum terhubung ke PostgreSQL, route, atau sesi nyata.
 *
 * Urutan commit mengikuti kontrak kandidat #20 (KONTRAK_LINTAS_MODUL_SRS-58.md, API-04)
 * dengan satu penegasan: replay dikembalikan setelah otorisasi diulang.
 *   lock batch → baca idempotency → otorisasi ulang → keputusan replay/konflik →
 *   state → fingerprint → expiry → referensi → warning → domain → audit SUCCESS →
 *   COMMITTED → record idempotency → COMMIT.
 *
 * Batas yang sengaja fail-closed sampai ada keputusan Adam (komentar Jira SRS-52 nomor 10198):
 * - warning: commit ditolak bila preview memiliki warning atau request membawa acknowledgement;
 * - replay tidak menulis audit kedua (belum diputuskan);
 * - cancel tidak memakai Idempotency-Key (mengikuti OpenAPI kandidat) dan batch terminal ditolak.
 *
 * Log hanya menerima { code, correlation_id }. Objek error tidak pernah dicetak.
 */
import { ImportCommitError, isImportCommitError, type ImportCommitErrorCode } from './commit-errors.js';
import { assertCanCancel, assertCanCommit, assertRetentionMs, decideIdempotency, isPreviewExpired } from './commit-rules.js';
import { assertIdempotencyKey, commitRequestHash, isUuid } from './request-hash.js';
import {
  UnitOfWorkOutcomeUnknownError,
  IdempotencyKeyTakenError,
  type BatchStore,
  type CancelResult,
  type Clock,
  type CommitActor,
  type CommitAuditEvent,
  type CommitAuditWriter,
  type CommitAuthorizer,
  type CommitResult,
  type DomainCommitWriter,
  type IdempotencyStore,
  type ImportKind,
  type LockedBatch,
  type PreviewReader,
  type ReferenceRevisionReader,
  type SafeCommitLogger,
  type UnitOfWork,
} from './commit-ports.js';

/** Dependensi bersama commit dan cancel. */
export interface MutationDependencies<Tx> {
  unitOfWork: UnitOfWork<Tx>;
  batches: BatchStore<Tx>;
  authorizer: CommitAuthorizer<Tx>;
  audit: CommitAuditWriter<Tx>;
  clock: Clock;
  logger: SafeCommitLogger;
}

export interface CommitDependencies<Tx> extends MutationDependencies<Tx> {
  previews: PreviewReader<Tx>;
  references: ReferenceRevisionReader<Tx>;
  writers: readonly DomainCommitWriter<Tx>[];
  idempotency: IdempotencyStore<Tx>;
}

export interface CommitOptions {
  /** Retensi record idempotency dalam ms; nilai final menunggu keputusan (butir 3). */
  idempotencyRetentionMs: number;
}

export interface CommitCommand {
  actor: CommitActor;
  batch_id: string;
  idempotency_key: string;
  correlation_id: string;
  body: unknown;
}

export interface CancelCommand {
  actor: CommitActor;
  batch_id: string;
  correlation_id: string;
  body: unknown;
}

interface CommitBody {
  preview_fingerprint: string;
  acknowledged_warnings: string[];
}

function parseCommitBody(body: unknown): CommitBody {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) throw new ImportCommitError('BAD_REQUEST');
  const keys = Object.keys(body).sort();
  if (keys.length !== 2 || keys[0] !== 'acknowledged_warnings' || keys[1] !== 'preview_fingerprint') {
    throw new ImportCommitError('BAD_REQUEST');
  }
  const { preview_fingerprint: fingerprint, acknowledged_warnings: warnings } = body as Record<string, unknown>;
  if (typeof fingerprint !== 'string' || fingerprint.length === 0) throw new ImportCommitError('BAD_REQUEST');
  if (!Array.isArray(warnings) || !warnings.every((item) => typeof item === 'string')) throw new ImportCommitError('BAD_REQUEST');
  return { preview_fingerprint: fingerprint, acknowledged_warnings: [...warnings] };
}

function parseCancelBody(body: unknown): void {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) throw new ImportCommitError('BAD_REQUEST');
  const keys = Object.keys(body);
  const reason = (body as Record<string, unknown>).reason;
  if (keys.length !== 1 || keys[0] !== 'reason' || typeof reason !== 'string' || reason.trim().length === 0) {
    throw new ImportCommitError('BAD_REQUEST');
  }
}

function assertCommand(actor: CommitActor, batchId: string, correlationId: string): void {
  if (!isUuid(actor?.actor_id) || !isUuid(batchId) || !isUuid(correlationId)) throw new ImportCommitError('BAD_REQUEST');
}

/** Kerangka penanganan kegagalan yang sama untuk commit dan cancel. */
abstract class ImportMutationService<Tx, D extends MutationDependencies<Tx>> {
  protected constructor(protected readonly deps: D) {}

  protected async failAfterRollback(
    error: unknown,
    action: CommitAuditEvent['action'],
    actor: CommitActor,
    correlationId: string,
    batch: LockedBatch | null,
  ): Promise<never> {
    if (error instanceof UnitOfWorkOutcomeUnknownError) {
      // COMMIT mungkin sudah berhasil; jangan menulis FAILURE palsu.
      this.deps.logger.error({ code: 'IMPORT_MUTATION_OUTCOME_UNKNOWN', correlation_id: correlationId });
      throw new ImportCommitError('TRANSACTION_OUTCOME_UNKNOWN');
    }
    const code: ImportCommitErrorCode = isImportCommitError(error) ? error.code : 'TRANSACTION_FAILED';
    if (!isImportCommitError(error)) {
      this.deps.logger.error({ code: 'IMPORT_MUTATION_FAILED', correlation_id: correlationId });
    }
    const denied = code === 'FORBIDDEN' || code === 'NOT_FOUND';
    const event: CommitAuditEvent = {
      action,
      outcome: denied ? 'DENIED' : 'FAILURE',
      correlation_id: correlationId,
      actor_id: actor.actor_id,
      // Batch tersembunyi/tidak ada tidak dirujuk agar FK audit tidak menunjuk objek yang tidak sah.
      batch_id: code === 'NOT_FOUND' ? null : batch?.id ?? null,
      warehouse_id: code === 'NOT_FOUND' ? null : batch?.warehouse_id ?? null,
      mode: code === 'NOT_FOUND' ? null : batch?.mode ?? null,
      context_safe: { reason_code: denied ? 'ACCESS_DENIED' : 'TRANSACTION_FAILED' },
    };
    try {
      await this.deps.audit.recordAfterRollback(event);
    } catch {
      this.deps.logger.error({ code: 'AUDIT_UNAVAILABLE', correlation_id: correlationId });
    }
    throw isImportCommitError(error) ? error : new ImportCommitError('TRANSACTION_FAILED');
  }
}

export class CommitService<Tx> extends ImportMutationService<Tx, CommitDependencies<Tx>> {
  private readonly writers: ReadonlyMap<ImportKind, DomainCommitWriter<Tx>>;

  constructor(deps: CommitDependencies<Tx>, private readonly options: CommitOptions) {
    super(deps);
    assertRetentionMs(options.idempotencyRetentionMs);
    const writers = new Map<ImportKind, DomainCommitWriter<Tx>>();
    for (const writer of deps.writers) {
      if (writers.has(writer.kind)) throw new Error('INVALID_WRITER_CONFIGURATION');
      writers.set(writer.kind, writer);
    }
    this.writers = writers;
  }

  async commit(command: CommitCommand): Promise<CommitResult> {
    assertCommand(command.actor, command.batch_id, command.correlation_id);
    assertIdempotencyKey(command.idempotency_key);
    const body = parseCommitBody(command.body);
    const { actor, correlation_id: correlationId } = command;
    const seen: { batch: LockedBatch | null } = { batch: null };

    try {
      return await this.deps.unitOfWork.transaction(async (tx) => {
        const batch = await this.deps.batches.lockForUpdate(tx, command.batch_id);
        if (batch === null) throw new ImportCommitError('NOT_FOUND');
        seen.batch = batch;

        const scope = { actor_id: actor.actor_id, operation: 'import.commit' as const, idempotency_key: command.idempotency_key };
        const existing = await this.deps.idempotency.find(tx, scope);
        if (!(await this.deps.authorizer.authorize(tx, actor, batch, 'import.commit'))) throw new ImportCommitError('FORBIDDEN');

        const requestHash = commitRequestHash({
          actor_id: actor.actor_id,
          batch_id: batch.id,
          warehouse_id: batch.warehouse_id,
          mode: batch.mode,
          preview_fingerprint: body.preview_fingerprint,
          acknowledged_warnings: body.acknowledged_warnings,
        });
        const decision = decideIdempotency(existing, requestHash);
        // Replay boleh dikembalikan walaupun preview sekarang sudah kedaluwarsa (#20 API-04).
        if (decision.kind === 'REPLAY') return decision.response;
        if (decision.kind === 'CONFLICT') throw new ImportCommitError('IDEMPOTENCY_CONFLICT');

        assertCanCommit(batch.state);
        const preview = await this.deps.previews.read(tx, actor, batch);
        if (preview === null || preview.batch_id !== batch.id) throw new ImportCommitError('PREVIEW_CHANGED');
        if (preview.error_count !== 0) throw new ImportCommitError('STATE_CONFLICT');
        if (body.preview_fingerprint !== preview.fingerprint) throw new ImportCommitError('PREVIEW_CHANGED');
        const now = this.deps.clock.now();
        if (isPreviewExpired(now, preview.expires_at)) throw new ImportCommitError('PREVIEW_EXPIRED');
        if ((await this.deps.references.current(tx, batch)) !== preview.reference_revision) {
          throw new ImportCommitError('PREVIEW_CHANGED');
        }
        if (preview.warning_issue_ids.length > 0 || body.acknowledged_warnings.length > 0) {
          throw new ImportCommitError('WARNING_ACKNOWLEDGEMENT_OPEN');
        }

        const writer = this.writers.get(batch.kind);
        if (writer === undefined) throw new ImportCommitError('SOURCE_REQUIRED');
        const written = await writer.write(tx, batch, preview, actor);
        if (!Number.isSafeInteger(written?.committed_count) || written.committed_count < 0) {
          throw new Error('INVALID_COMMITTED_COUNT');
        }

        await this.deps.audit.appendInTransaction(tx, {
          action: 'import.commit',
          outcome: 'SUCCESS',
          correlation_id: correlationId,
          actor_id: actor.actor_id,
          batch_id: batch.id,
          warehouse_id: batch.warehouse_id,
          mode: batch.mode,
          context_safe: { kind: batch.kind, committed_count: written.committed_count },
        });
        await this.deps.batches.markCommitted(tx, batch.id, now);

        const response: CommitResult = { batch_id: batch.id, state: 'COMMITTED', committed_count: written.committed_count };
        try {
          await this.deps.idempotency.insertSucceeded(tx, {
            ...scope,
            request_hash: requestHash,
            batch_id: batch.id,
            response,
            expires_at: new Date(now.getTime() + this.options.idempotencyRetentionMs),
          });
        } catch (error) {
          if (error instanceof IdempotencyKeyTakenError) throw new ImportCommitError('IDEMPOTENCY_CONFLICT');
          throw error;
        }
        return response;
      });
    } catch (error) {
      return this.failAfterRollback(error, 'import.commit', actor, correlationId, seen.batch);
    }
  }
}

export class CancelService<Tx> extends ImportMutationService<Tx, MutationDependencies<Tx>> {
  constructor(deps: MutationDependencies<Tx>) {
    super(deps);
  }

  async cancel(command: CancelCommand): Promise<CancelResult> {
    assertCommand(command.actor, command.batch_id, command.correlation_id);
    parseCancelBody(command.body);
    const { actor, correlation_id: correlationId } = command;
    const seen: { batch: LockedBatch | null } = { batch: null };

    try {
      return await this.deps.unitOfWork.transaction(async (tx) => {
        const batch = await this.deps.batches.lockForUpdate(tx, command.batch_id);
        if (batch === null) throw new ImportCommitError('NOT_FOUND');
        seen.batch = batch;
        if (!(await this.deps.authorizer.authorize(tx, actor, batch, 'import.cancel'))) throw new ImportCommitError('FORBIDDEN');
        assertCanCancel(batch.state);
        await this.deps.batches.markCancelled(tx, batch.id, this.deps.clock.now());
        // Alasan bebas dari pengguna tidak disalin ke audit/log (#20 API-05).
        await this.deps.audit.appendInTransaction(tx, {
          action: 'import.cancel',
          outcome: 'CANCELLED',
          correlation_id: correlationId,
          actor_id: actor.actor_id,
          batch_id: batch.id,
          warehouse_id: batch.warehouse_id,
          mode: batch.mode,
          context_safe: { kind: batch.kind, reason_code: 'USER_CANCELLED' },
        });
        return { batch_id: batch.id, state: 'CANCELLED' as const };
      });
    } catch (error) {
      return this.failAfterRollback(error, 'import.cancel', actor, correlationId, seen.batch);
    }
  }
}
