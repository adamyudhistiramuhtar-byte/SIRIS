/**
 * Service pembuatan run rekonsiliasi SRS-29 (API-13) di atas engine murni yang sudah merged
 * (PR #36) dan port yang disuntik. Status: PROPOSED, sebagian. Belum terhubung ke
 * PostgreSQL, route, atau sesi nyata.
 *
 * Urutan dalam satu transaksi:
 *   baca snapshot & sesi (FOR SHARE) → otorisasi kedua scope → identitas run →
 *   keputusan key/reuse → engine → simpan run + lines → catat key → audit SUCCESS → COMMIT.
 *
 * Keputusan yang dipakai: D-04 dan D-05 (Adam, komentar Jira SRS-38 nomor 10153 butir 3–4).
 * Yang masih usulan: bentuk respons reuse, audit untuk reuse (tidak menulis audit kedua),
 * komposisi identity hash, dan pemetaan key ke idempotency_records 012.
 *
 * Log hanya menerima { code, correlation_id }. Objek error tidak pernah dicetak.
 */
import { reconcile, RECONCILIATION_RULE_VERSION } from './reconciliation-engine.js';
import { isReconciliationServiceError, ReconciliationServiceError } from './reconciliation-errors.js';
import { decideRun, runIdentityHash } from './run-identity.js';
import {
  ReconciliationOutcomeUnknownError,
  RunIdentityTakenError,
  RunKeyTakenError,
  type CountSessionReader,
  type ReconciliationActor,
  type ReconciliationAuditWriter,
  type ReconciliationAuthorizer,
  type ReconciliationRunStore,
  type ReconciliationUnitOfWork,
  type RunIdGenerator,
  type RunKeyStore,
  type SafeReconciliationLogger,
  type StockSnapshotReader,
} from './reconciliation-ports.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const KEY_MAX_LENGTH = 128; // kolom idempotency_key VARCHAR(128) pada migrasi 001

export interface ReconciliationDependencies<Tx> {
  unitOfWork: ReconciliationUnitOfWork<Tx>;
  snapshots: StockSnapshotReader<Tx>;
  sessions: CountSessionReader<Tx>;
  authorizer: ReconciliationAuthorizer<Tx>;
  runs: ReconciliationRunStore<Tx>;
  keys: RunKeyStore<Tx>;
  audit: ReconciliationAuditWriter<Tx>;
  ids: RunIdGenerator;
  logger: SafeReconciliationLogger;
}

export interface CreateRunCommand {
  actor: ReconciliationActor;
  idempotency_key: string;
  correlation_id: string;
  body: unknown;
}

/** DOC-09 API-13 mengembalikan {run_id, rule_version}; penanda `reused` adalah usulan PR #14 §7. */
export interface CreateRunResult {
  run_id: string;
  rule_version: string;
  reused: boolean;
}

function parseBody(body: unknown): { stock_snapshot_id: string; count_session_id: string } {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) throw new ReconciliationServiceError('BAD_REQUEST');
  const keys = Object.keys(body).sort();
  const { stock_snapshot_id: snapshot, count_session_id: session } = body as Record<string, unknown>;
  if (keys.length !== 2 || keys[0] !== 'count_session_id' || keys[1] !== 'stock_snapshot_id' ||
    typeof snapshot !== 'string' || !UUID.test(snapshot) || typeof session !== 'string' || !UUID.test(session)) {
    throw new ReconciliationServiceError('BAD_REQUEST');
  }
  return { stock_snapshot_id: snapshot, count_session_id: session };
}

function assertCommand(command: CreateRunCommand): void {
  const key = command.idempotency_key;
  if (typeof command.actor?.actor_id !== 'string' || !UUID.test(command.actor.actor_id) ||
    typeof command.correlation_id !== 'string' || !UUID.test(command.correlation_id) ||
    typeof key !== 'string' || key.trim().length === 0 || key.length > KEY_MAX_LENGTH) {
    throw new ReconciliationServiceError('BAD_REQUEST');
  }
}

export class ReconciliationService<Tx> {
  constructor(private readonly deps: ReconciliationDependencies<Tx>) {}

  async createRun(command: CreateRunCommand): Promise<CreateRunResult> {
    assertCommand(command);
    const input = parseBody(command.body);
    // Satu ulangan bila unique identity/key terlanjur dipakai transaksi paralel:
    // percobaan kedua membaca run/key pemenang lalu memakai ulang atau menolak konflik.
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const seen: { warehouse_id: string | null; mode: 'ACTUAL' | 'UJI' | null } = { warehouse_id: null, mode: null };
      try {
        return await this.attempt(command, input, seen);
      } catch (error) {
        if ((error instanceof RunIdentityTakenError || error instanceof RunKeyTakenError) && attempt === 0) continue;
        return this.fail(error, command, seen);
      }
    }
    return this.fail(new Error('RETRY_EXHAUSTED'), command, { warehouse_id: null, mode: null });
  }

  private attempt(
    command: CreateRunCommand,
    input: { stock_snapshot_id: string; count_session_id: string },
    seen: { warehouse_id: string | null; mode: 'ACTUAL' | 'UJI' | null },
  ): Promise<CreateRunResult> {
    const { actor } = command;
    return this.deps.unitOfWork.transaction(async (tx) => {
      const stock = await this.deps.snapshots.readForShare(tx, input.stock_snapshot_id);
      const count = await this.deps.sessions.readForShare(tx, input.count_session_id);
      if (stock === null || count === null) throw new ReconciliationServiceError('NOT_FOUND');
      seen.warehouse_id = stock.context.warehouse_id;
      seen.mode = stock.context.mode;
      // Kedua sumber diotorisasi terpisah agar ketidakcocokan scope tidak membocorkan sumber lain.
      for (const scope of [stock.context, count.context]) {
        if (!(await this.deps.authorizer.authorize(tx, actor, { warehouse_id: scope.warehouse_id, mode: scope.mode }))) {
          throw new ReconciliationServiceError('FORBIDDEN');
        }
      }

      // Identitas dihitung sebelum engine: rule_version adalah versi engine yang terpasang,
      // sehingga reuse tidak perlu menghitung ulang dan konflik key terdeteksi lebih dulu.
      const identityHash = runIdentityHash({
        stock_snapshot_id: stock.id,
        count_session_id: count.id,
        rule_version: RECONCILIATION_RULE_VERSION,
        warehouse_id: stock.context.warehouse_id,
        mode: stock.context.mode,
      });
      const keyRecord = await this.deps.keys.find(tx, actor.actor_id, command.idempotency_key);
      const identityRun = await this.deps.runs.findByIdentity(tx, identityHash);
      const decision = decideRun(keyRecord, identityRun, identityHash);
      if (decision.kind === 'CONFLICT') throw new ReconciliationServiceError('IDEMPOTENCY_CONFLICT');
      if (decision.kind === 'REUSE') {
        if (decision.record_key) {
          await this.deps.keys.record(tx, actor.actor_id, command.idempotency_key, { identity_hash: identityHash, run_id: decision.run_id });
        }
        return { run_id: decision.run_id, rule_version: RECONCILIATION_RULE_VERSION, reused: true };
      }

      // Konteks/grain ditolak seluruhnya (E-1, D-04); tidak ada run yang disimpan.
      const result = reconcile({ stock: { context: stock.context, lines: stock.lines }, count: { context: count.context, lines: count.lines } });
      if (!result.ok) throw new ReconciliationServiceError(result.code);

      const runId = this.deps.ids.next();
      await this.deps.runs.insertRun(tx, {
        id: runId,
        identity_hash: identityHash,
        stock_snapshot_id: stock.id,
        count_session_id: count.id,
        rule_version: result.rule_version,
        warehouse_id: stock.context.warehouse_id,
        mode: stock.context.mode,
        cutoff_id: stock.context.cutoff_id,
        created_by: actor.actor_id,
        lines: result.lines,
      });
      await this.deps.keys.record(tx, actor.actor_id, command.idempotency_key, { identity_hash: identityHash, run_id: runId });
      await this.deps.audit.appendInTransaction(tx, {
        action: 'reconciliation.create',
        outcome: 'SUCCESS',
        correlation_id: command.correlation_id,
        actor_id: actor.actor_id,
        warehouse_id: stock.context.warehouse_id,
        mode: stock.context.mode,
        context_safe: { line_count: result.lines.length },
      });
      return { run_id: runId, rule_version: result.rule_version, reused: false };
    });
  }

  private async fail(
    error: unknown,
    command: CreateRunCommand,
    seen: { warehouse_id: string | null; mode: 'ACTUAL' | 'UJI' | null },
  ): Promise<never> {
    const correlationId = command.correlation_id;
    if (error instanceof ReconciliationOutcomeUnknownError) {
      // COMMIT mungkin berhasil; jangan menulis FAILURE palsu. Retry dengan key sama memakai ulang run.
      this.deps.logger.error({ code: 'RECONCILIATION_OUTCOME_UNKNOWN', correlation_id: correlationId });
      throw new ReconciliationServiceError('TRANSACTION_OUTCOME_UNKNOWN');
    }
    const domain = isReconciliationServiceError(error) ? error : null;
    if (domain === null) this.deps.logger.error({ code: 'RECONCILIATION_FAILED', correlation_id: correlationId });
    const denied = domain?.code === 'FORBIDDEN' || domain?.code === 'NOT_FOUND';
    try {
      await this.deps.audit.recordAfterRollback({
        action: 'reconciliation.create',
        outcome: denied ? 'DENIED' : 'FAILURE',
        correlation_id: correlationId,
        actor_id: command.actor.actor_id,
        warehouse_id: domain?.code === 'NOT_FOUND' ? null : seen.warehouse_id,
        mode: domain?.code === 'NOT_FOUND' ? null : seen.mode,
        context_safe: { reason_code: denied ? 'ACCESS_DENIED' : 'TRANSACTION_FAILED' },
      });
    } catch {
      this.deps.logger.error({ code: 'AUDIT_UNAVAILABLE', correlation_id: correlationId });
    }
    throw domain ?? new ReconciliationServiceError('TRANSACTION_FAILED');
  }
}
