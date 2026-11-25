import type pg from 'pg';
import { createAuditRecord, systemClock, type AuditInput, type Clock } from './audit-event.js';
import { appendAuditEvent } from './audit.repository.js';

export interface SafeAuditLogger {
  error(event: { code: 'AUDIT_UNAVAILABLE' | 'AUDIT_TRANSACTION_UNKNOWN'; correlation_id: string }): void;
}

export class AuditedTransactionError extends Error {
  constructor(
    readonly code: 'TRANSACTION_FAILED' | 'TRANSACTION_OUTCOME_UNKNOWN',
    readonly correlation_id: string,
    readonly audit_recorded: boolean,
    options?: ErrorOptions,
  ) {
    super(code === 'TRANSACTION_FAILED' ? 'Transaksi gagal.' : 'Hasil transaksi belum diketahui.', options);
    this.name = 'AuditedTransactionError';
  }
}

export class AuditService {
  constructor(
    private readonly pool: Pick<pg.Pool, 'connect'>,
    private readonly logger: SafeAuditLogger,
    private readonly clock: Clock = systemClock,
  ) {}

  /** Jalur terpisah setelah rollback/penolakan. Dua upaya terbatas; tanpa antrean palsu. */
  async recordOutcome(input: AuditInput): Promise<boolean> {
    const event = createAuditRecord(input, this.clock);
    for (let attempt = 0; attempt < 2; attempt += 1) {
      let client: pg.PoolClient | undefined;
      let discard = false;
      try {
        client = await this.pool.connect();
        await appendAuditEvent(client, event);
        return true;
      } catch {
        // PK event sama membuat retry aman bila INSERT autocommit sebenarnya sukses.
        discard = true;
      } finally {
        client?.release(discard);
      }
    }
    this.logger.error({ code: 'AUDIT_UNAVAILABLE', correlation_id: event.correlation_id });
    return false;
  }

  /** Callback hanya menulis DB. Side effect file/network tidak ikut atomisitas PostgreSQL. */
  async transaction<T>(
    input: AuditInput & { outcome: 'SUCCESS' | 'CANCELLED' },
    mutate: (client: pg.PoolClient) => Promise<T>,
  ): Promise<T> {
    const event = createAuditRecord(input, this.clock);
    let client: pg.PoolClient | undefined;
    let committing = false;
    let discard = false;
    try {
      client = await this.pool.connect();
      await client.query('BEGIN');
      const result = await mutate(client);
      await appendAuditEvent(client, event);
      committing = true;
      await client.query('COMMIT');
      return result;
    } catch (cause) {
      if (committing) {
        // Koneksi putus saat COMMIT bukan bukti rollback; jangan merekam FAILURE palsu.
        discard = true;
        this.logger.error({ code: 'AUDIT_TRANSACTION_UNKNOWN', correlation_id: event.correlation_id });
        throw new AuditedTransactionError('TRANSACTION_OUTCOME_UNKNOWN', event.correlation_id, false, {cause});
      }
      if (client) {
        try { await client.query('ROLLBACK'); } catch { discard = true; }
        client.release(discard);
        client = undefined;
      }
      // UUID objek yang baru di-insert dapat hilang akibat rollback. Failure ditautkan
      // lewat correlation ID dan scope; tidak menyimpan FK ke baris yang sudah hilang.
      const recorded = await this.recordOutcome({
        ...input, outcome: 'FAILURE', batch_id: null, source_row_id: null,
        context_safe: { reason_code: 'TRANSACTION_FAILED' },
      });
      throw new AuditedTransactionError('TRANSACTION_FAILED', event.correlation_id, recorded, {cause});
    } finally {
      client?.release(discard);
    }
  }
}
