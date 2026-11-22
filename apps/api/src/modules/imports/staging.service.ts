import { createHash, randomUUID } from 'node:crypto';
import type pg from 'pg';
import { z } from 'zod';
import { AuditService, type SafeAuditLogger } from '../audit/audit.service.js';
import { appendAuditEvent } from '../audit/audit.repository.js';
import { auditCorrelationId, createAuditRecord, systemClock, type Clock } from '../audit/audit-event.js';
import { PrivateSourceStorage, type StoredSource } from './private-source-storage.js';
import { insertStaging, lockStageScope } from './staging.repository.js';
import { stageMetadata, StageError, type StageActor, type StageAuthorizer, type StageLimits,
  type SourceAdapter, type StageResult, type UploadPart, type NormalizedSourceRow } from './staging-contract.js';

const actorSchema = z.object({ actor_id: z.string().uuid(), role: z.enum(['PURCHASING', 'WAREHOUSE', 'PRODUCTION', 'MANAGEMENT']),
  warehouse_ids: z.array(z.string().uuid()) }).strict();

export class StagingService {
  private readonly audit: AuditService;
  constructor(private readonly pool: Pick<pg.Pool, 'connect'>, private readonly authorizer: StageAuthorizer,
    private readonly storage: PrivateSourceStorage, private readonly adapters: readonly SourceAdapter[],
    private readonly limits: StageLimits, private readonly logger: SafeAuditLogger, private readonly clock: Clock = systemClock) {
    if (!Object.values(limits).every((n) => Number.isSafeInteger(n) && n > 0) || Object.keys(limits).length !== 3) throw new Error('INVALID_LIMIT_CONFIGURATION');
    this.audit = new AuditService(pool, logger, clock);
  }
  async stage(metadataInput: unknown, parts: readonly UploadPart[], correlationInput?: unknown): Promise<StageResult> {
    const correlation = auditCorrelationId(correlationInput);
    const batchId = randomUUID();
    const files: {component: string; source: StoredSource; rows: NormalizedSourceRow[]}[] = [];
    let client: pg.PoolClient | undefined;
    let committing = false;
    let discard = false;
    let actor: StageActor | undefined;
    try {
      const parsed = stageMetadata.safeParse(metadataInput);
      if (!parsed.success) throw new StageError('INVALID_METADATA');
      const metadata = parsed.data;
      // Provider menolak sesi tidak ada/kedaluwarsa sebelum akses file.
      try { actor = actorSchema.parse(await this.authorizer.authorizeStage(metadata)); }
      catch { throw new StageError('ACCESS_DENIED'); }
      const adapter = this.adapters.find((a) => a.kind === metadata.kind && a.version === metadata.contract_version);
      if (!adapter) throw new StageError('SOURCE_REQUIRED');
      if (parts.length === 0 || parts.length > this.limits.max_files ||
        parts.length !== adapter.components.length || new Set(parts.map((p) => p.component)).size !== parts.length ||
        parts.some((p) => !adapter.components.includes(p.component))) throw new StageError('INVALID_FILE');
      // Tolak konteks stale sebelum upload; transaksi final menguncinya lagi.
      client = await this.pool.connect();
      await client.query('BEGIN');
      await lockStageScope(client, actor, metadata);
      await client.query('ROLLBACK'); client.release(); client = undefined;
      let totalBytes = 0;
      let totalRows = 0;
      for (const part of parts) {
        const source = await this.storage.write(part.content, this.limits.max_bytes - totalBytes);
        const file = { component: part.component, source, rows: [] as NormalizedSourceRow[] };
        files.push(file); totalBytes += source.bytes;
        file.rows = adapter.parse(await this.storage.read(source), part.component);
        totalRows += file.rows.length;
        if (totalRows > this.limits.max_rows) throw new StageError('LIMIT_EXCEEDED');
      }
      const manifest = files.map((f) => [f.component, f.source.sha256, f.source.bytes]).sort((a, b) => String(a[0]).localeCompare(String(b[0]), 'en'));
      const result: StageResult = { batch_id: batchId, kind: metadata.kind, warehouse_id: metadata.warehouse_id,
        mode: 'UJI', status: 'STAGED', contract_version: metadata.contract_version,
        source_hash: createHash('sha256').update(JSON.stringify(manifest)).digest('hex'), row_count: totalRows, correlation_id: correlation };
      client = await this.pool.connect(); await client.query('BEGIN');
      await lockStageScope(client, actor, metadata);
      await insertStaging(client, actor, metadata, result, files);
      await appendAuditEvent(client, createAuditRecord({ actor_id: actor.actor_id, warehouse_id: metadata.warehouse_id,
        mode: metadata.mode, batch_id: batchId, action: 'import.stage', outcome: 'SUCCESS', correlation_id: correlation,
        context_safe: {kind: metadata.kind, row_count: totalRows} }, this.clock));
      committing = true; await client.query('COMMIT'); return result;
    } catch (error) {
      if (committing) {
        discard = true;
        this.logger.error({code: 'AUDIT_TRANSACTION_UNKNOWN', correlation_id: correlation});
        // Pertahankan file: COMMIT bisa sudah berhasil. Jangan mengulang upload otomatis.
        throw new StageError('OUTCOME_UNKNOWN', correlation, batchId);
      }
      if (client) { try { await client.query('ROLLBACK'); } catch { discard = true; }
        client.release(discard); client = undefined; }
      const code = error instanceof StageError ? error.code : 'STAGING_FAILED';
      // Tidak menyimpan actor FK dari input yang belum dibuktikan ada pada DB.
      await this.audit.recordOutcome({ action: 'import.stage', outcome: code === 'ACCESS_DENIED' ? 'DENIED' : 'FAILURE',
        correlation_id: correlation, context_safe: {reason_code: code === 'ACCESS_DENIED' ? 'ACCESS_DENIED' : 'TRANSACTION_FAILED'} });
      // Storage di luar transaksi DB. Kegagalan cleanup tidak boleh membocorkan path/error driver.
      for (const file of files) { try { await this.storage.remove(file.source); } catch {
        this.logger.error({code: 'AUDIT_UNAVAILABLE', correlation_id: correlation});
      } }
      throw new StageError(code, correlation);
    } finally { client?.release(discard); }
  }
}
