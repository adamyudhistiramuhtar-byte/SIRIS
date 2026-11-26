/**
 * Tes kontrak fixture layar commit/pembatalan impor dan audit (SRS-52, konsumen SRS-67).
 * Data SIMULATED.
 *
 * Yang dibuktikan tanpa database:
 * - request, respons sukses, respons error, dan event audit cocok dengan skema DOC-09;
 * - event audit untuk layar tidak membocorkan actor, batch, gudang, atau reason (redaksi DOC-09);
 * - event audit DTO sejalan dengan jejak service #46 per skenario;
 * - aturan replay: tidak ada audit kedua; hasil COMMIT tidak diketahui tidak menulis FAILURE palsu.
 *
 * Skenario dihasilkan dari service #46 (Draft, 6cf5bbf). Pencocokan ulang terhadap service #46
 * dilakukan pada worktree #46; di sini ditandai todo sampai #46 merged.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type {
  AuditEventDto,
  CancellationResultDto,
  CommitResultDto,
  ImportCommitErrorCodeDto,
} from '@siris/contracts';
import { doc09ResponseSchema, validateDoc09, validateInline } from './contract/doc09-schema.js';

const fixture = JSON.parse(
  readFileSync(
    new URL('../../../../database/fixtures/uji/import-commit-screen.proposed-0.1.json', import.meta.url),
    'utf8',
  ),
);

interface TraceEvent { action: string; outcome: string; mode: string | null; correlation_id: string; actor_id: string }
interface Scenario {
  case: string;
  response: { http_status: number; body: CommitResultDto | CancellationResultDto | { error: { code: ImportCommitErrorCodeDto } } };
  audit_events_dto: AuditEventDto[];
  service_trace: { events: TraceEvent[] };
}
const scenarios: Scenario[] = fixture.scenarios;
const { _keterangan: _note, ...httpStatus } = fixture.error_http_status as Record<ImportCommitErrorCodeDto, number> & { _keterangan: string };

function scenario(name: string): Scenario {
  const found = scenarios.find((s) => s.case === name);
  if (!found) throw new Error(`skenario ${name} tidak ada`);
  return found;
}

const isError = (body: Scenario['response']['body']): body is { error: { code: ImportCommitErrorCodeDto } } => 'error' in body;

describe('Label dan pemisahan data fixture commit', () => {
  it('berlabel SIMULATED, mode UJI, kontrak PROPOSED, tanpa ACTUAL', () => {
    expect(fixture.data_label).toBe('SIMULATED');
    expect(fixture.mode).toBe('UJI');
    expect(fixture.contract_status).toBe('PROPOSED');
    expect(JSON.stringify(fixture.scenarios)).not.toContain('"ACTUAL"');
  });
});

describe('Kecocokan dengan skema DOC-09', () => {
  it('request commit dan pembatalan cocok dengan CommitRequest dan Cancellation', () => {
    expect(validateDoc09('CommitRequest', fixture.requests.commit.body)).toEqual([]);
    expect(validateDoc09('Cancellation', fixture.requests.cancellation.body)).toEqual([]);
  });

  it.each(scenarios.map((s) => [s.case, s] as const))('respons "%s" cocok dengan skema yang sesuai', (_label, s) => {
    const body = s.response.body;
    if (isError(body)) {
      expect(validateDoc09('ApiError', body)).toEqual([]);
      expect(s.response.http_status).toBe(httpStatus[body.error.code]);
    } else if (body.state === 'COMMITTED') {
      expect(validateDoc09('CommitResult', body)).toEqual([]);
      expect(s.response.http_status).toBe(200);
    } else {
      expect(validateDoc09('CancellationResult', body)).toEqual([]);
      expect(s.response.http_status).toBe(200);
    }
  });

  it('seluruh event audit DTO cocok dengan respons daftar API-20', () => {
    const items = scenarios.flatMap((s) => s.audit_events_dto);
    expect(items.length).toBeGreaterThan(0);
    expect(validateInline(doc09ResponseSchema('API-20'), { items, next_cursor: null })).toEqual([]);
  });

  it('event audit dengan field internal ditolak skema (redaksi DOC-09)', () => {
    const leaked = { ...scenario('Commit sukses').audit_events_dto[0], actor_id: '10000000-0000-4000-8000-000000000001', reason_code: 'ACCESS_DENIED' };
    const errors = validateDoc09('AuditEvent', leaked);
    expect(errors.some((e) => e.includes('actor_id'))).toBe(true);
    expect(errors.some((e) => e.includes('reason_code'))).toBe(true);
  });
});

describe('Event audit DTO sejalan dengan jejak service #46', () => {
  it.each(scenarios.map((s) => [s.case, s] as const))('"%s"', (_label, s) => {
    const fromTrace = s.service_trace.events.map(({ action, outcome, mode, correlation_id }) => ({ action, outcome, mode, correlation_id }));
    const dto = s.audit_events_dto.map(({ action, outcome, mode, correlation_id }) => ({ action, outcome, mode, correlation_id }));
    expect(dto).toEqual(fromTrace);
    expect(new Set(s.audit_events_dto.map((e) => e.id)).size).toBe(s.audit_events_dto.length);
  });
});

describe('Aturan layar commit dan pembatalan', () => {
  it('commit sukses menghasilkan satu audit SUCCESS', () => {
    expect(scenario('Commit sukses').audit_events_dto.map((e) => [e.action, e.outcome])).toEqual([['import.commit', 'SUCCESS']]);
  });

  it('replay key dan body sama mengembalikan hasil yang sama tanpa audit kedua', () => {
    expect(scenario('Replay key dan body sama').response.body).toEqual(scenario('Commit sukses').response.body);
    expect(scenario('Replay key dan body sama').audit_events_dto).toEqual([]);
  });

  it('akses ditolak dicatat DENIED; kegagalan lain dicatat FAILURE', () => {
    expect(scenario('Akses ditolak').audit_events_dto.map((e) => e.outcome)).toEqual(['DENIED']);
    for (const name of ['Key sama, body berbeda', 'Preview kedaluwarsa', 'Preview berubah', 'Warning belum diakui', 'Transaksi gagal']) {
      expect(scenario(name).audit_events_dto.map((e) => e.outcome)).toEqual(['FAILURE']);
    }
  });

  it('hasil COMMIT tidak diketahui tidak menulis FAILURE palsu', () => {
    const s = scenario('Hasil COMMIT tidak diketahui');
    expect(isError(s.response.body) && s.response.body.error.code).toBe('TRANSACTION_OUTCOME_UNKNOWN');
    expect(s.audit_events_dto).toEqual([]);
  });

  it('pembatalan sukses dicatat CANCELLED; batch COMMITTED tidak dapat dibatalkan', () => {
    expect(scenario('Batal sukses').audit_events_dto.map((e) => [e.action, e.outcome])).toEqual([['import.cancel', 'CANCELLED']]);
    const late = scenario('Batal setelah COMMITTED').response.body;
    expect(isError(late) && late.error.code).toBe('STATE_CONFLICT');
  });

  it('peta status HTTP memuat seluruh kode error DTO', () => {
    const codes: ImportCommitErrorCodeDto[] = [
      'BAD_REQUEST', 'NOT_FOUND', 'FORBIDDEN', 'IDEMPOTENCY_CONFLICT', 'PREVIEW_CHANGED', 'PREVIEW_EXPIRED',
      'STATE_CONFLICT', 'WARNING_ACKNOWLEDGEMENT_OPEN', 'SOURCE_REQUIRED', 'MODE_NOT_ENABLED',
      'TRANSACTION_FAILED', 'TRANSACTION_OUTCOME_UNKNOWN',
    ];
    expect(Object.keys(httpStatus).sort()).toEqual([...codes].sort());
  });

  it.todo('cocokkan ulang seluruh skenario dengan CommitService/CancelService #46 setelah #46 merged');
});
