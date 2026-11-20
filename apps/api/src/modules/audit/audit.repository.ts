import type pg from 'pg';
import type { AuditRecord } from './audit-event.js';

export type TransactionClient = Pick<pg.PoolClient, 'query'>;

/** Tidak membuka/menutup transaksi: gunakan client yang sama dengan mutasi domain. */
export async function appendAuditEvent(client: TransactionClient, event: AuditRecord): Promise<void> {
  await client.query(
    `INSERT INTO audit_events
     (id, actor_id, warehouse_id, mode, batch_id, source_row_id, action, outcome,
      correlation_id, context_safe, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11)
     ON CONFLICT (id) DO NOTHING`,
    [event.id, event.actor_id ?? null, event.warehouse_id ?? null, event.mode ?? null,
      event.batch_id ?? null, event.source_row_id ?? null, event.action, event.outcome,
      event.correlation_id, JSON.stringify(event.context_safe ?? {}), event.created_at],
  );
}
