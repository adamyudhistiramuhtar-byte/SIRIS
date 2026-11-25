import type { TransactionClient } from '../audit/audit.repository.js';
import type { StageActor, StageMetadata, StageResult, NormalizedSourceRow } from './staging-contract.js';
import { StageError } from './staging-contract.js';
import type pg from 'pg';
import type { StoredSource } from './private-source-storage.js';

/** Pemeriksaan diulang di transaksi; konteks dari provider tidak cukup bila assignment dicabut. */
export async function lockStageScope(client: TransactionClient, actor: StageActor, metadata: StageMetadata): Promise<void> {
  const allowed = actor.role === 'PURCHASING' ? ['EXPECTED', 'COMMITMENT'] : actor.role === 'WAREHOUSE' ? ['RECEIVING', 'STOCK', 'COUNT'] : [];
  if (!allowed.includes(metadata.kind) || !actor.warehouse_ids.includes(metadata.warehouse_id)) throw new StageError('ACCESS_DENIED');
  const result = await client.query(
    `SELECT u.id FROM users u JOIN user_warehouses uw ON uw.user_id=u.id
      JOIN warehouses w ON w.id=uw.warehouse_id
      WHERE u.id=$1 AND u.role=$2 AND u.is_active AND w.id=$3 AND w.is_active
      FOR SHARE OF u,uw,w`, [actor.actor_id, actor.role, metadata.warehouse_id]);
  if (result.rowCount !== 1) throw new StageError('ACCESS_DENIED');
  if (metadata.cutoff_id) {
    const cutoff = await client.query('SELECT id,status FROM cutoff_contexts WHERE id=$1 AND warehouse_id=$2 AND mode=$3 FOR SHARE',
      [metadata.cutoff_id, metadata.warehouse_id, metadata.mode]);
    if (cutoff.rowCount !== 1) throw new StageError('ACCESS_DENIED');
    if (cutoff.rows[0].status !== 'SIMULATED') throw new StageError('CUTOFF_UNVERIFIED');
  }
}
export async function insertStaging(client: TransactionClient, actor: StageActor, metadata: StageMetadata,
  result: StageResult, sources: { component: string; source: StoredSource; rows: NormalizedSourceRow[] }[]): Promise<void> {
  await client.query(`INSERT INTO import_batches
    (id,warehouse_id,kind,mode,status,file_name,file_size_bytes,row_count,created_by,contract_version,source_hash,source_reference,source_timezone,cutoff_id)
    VALUES ($1,$2,$3,$4,'STAGED',$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
  [result.batch_id, metadata.warehouse_id, metadata.kind, metadata.mode, metadata.source_name,
    sources.reduce((n, s) => n + s.source.bytes, 0), result.row_count, actor.actor_id, metadata.contract_version,
    result.source_hash, metadata.source_reference, metadata.source_timezone ?? null, metadata.cutoff_id ?? null]);
  for (const { component, source, rows } of sources) {
    await client.query(`INSERT INTO import_source_files (batch_id,component,storage_key,source_hash,size_bytes) VALUES ($1,$2,$3,$4,$5)`,
      [result.batch_id, component, source.key, source.sha256, source.bytes]);
    for (const row of rows) await client.query(`INSERT INTO staging_rows (batch_id,row_number,component,raw_payload,normalized_payload)
      VALUES ($1,$2,$3,$4::jsonb,$5::jsonb)`, [result.batch_id, row.row_number, component, JSON.stringify(row.raw), JSON.stringify(row.normalized)]);
  }
}

/** Untuk SRS-51: hanya pemilik aktif pada scope UJI yang masih diizinkan. Tidak mengeluarkan storage key. */
export async function readOwnedStaging(client: Pick<pg.PoolClient,'query'|'release'>, actor: StageActor, batchId: string) {
  if(typeof client.release!=='function') throw new Error('STAGING_TRANSACTION_CLIENT_REQUIRED');
  try {
    await client.query('SAVEPOINT siris_staging_transaction_check');
    await client.query('RELEASE SAVEPOINT siris_staging_transaction_check');
  } catch (error) {
    if ((error as {code?: string}).code === '25P01') throw new Error('STAGING_TRANSACTION_CLIENT_REQUIRED');
    throw error;
  }
  const scope = await client.query(`SELECT kind,warehouse_id,mode FROM import_batches WHERE id=$1 AND created_by=$2`, [batchId, actor.actor_id]);
  if (scope.rowCount !== 1 || scope.rows[0].mode !== 'UJI') throw new StageError('ACCESS_DENIED');
  await lockStageScope(client, actor, scope.rows[0] as StageMetadata);
  return (await client.query(`SELECT id,batch_id,component,row_number,raw_payload,normalized_payload,validation_status
    FROM staging_rows WHERE batch_id=$1 ORDER BY component,row_number,id`, [batchId])).rows;
}
