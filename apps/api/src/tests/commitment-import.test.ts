import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  CommitmentHistoryStore,
  DuplicateInboundContextError,
  assertRequestedDateUnchanged,
  importCommitmentRows,
  parseCommitmentEventAt,
  validateNormalizedCommitmentRow,
  type CommitmentSourceRow,
  type InboundCommitmentContext,
  type NormalizedCommitmentRow,
} from '../modules/commitment/supplier-commitment.js';

const fixture = JSON.parse(
  readFileSync(
    new URL('../../../../database/fixtures/uji/commitment.proposed-0.1.json', import.meta.url),
    'utf8',
  ),
) as {
  metadata: { warehouse_id: string; mode: string };
  rows: CommitmentSourceRow[];
  negative_cases: Array<{
    case_id: string;
    description: string;
    normalized: Record<string, unknown>;
    expected_issue: string;
  }>;
};

const inboundContext: InboundCommitmentContext = {
  inbound_source_ref: 'UJI-IN-001',
  requested_date: '2026-11-10',
};

describe('SRS-18 fixture commitment.proposed-0.1', () => {
  it('metadata fixture tetap UJI dan tidak berubah maknanya', () => {
    expect(fixture.metadata).toMatchObject({
      warehouse_id: '00000000-0000-4000-8000-000000000001',
      mode: 'UJI',
    });
  });

  it('menerima INITIAL lalu CHANGE valid dan mempertahankan histori append-only', () => {
    const result = importCommitmentRows([inboundContext], fixture.rows);

    expect(result.ok).toBe(true);
    expect(result.issues).toEqual([]);
    expect(result.applied).toHaveLength(2);
    expect(result.idempotent).toHaveLength(0);

    const history = result.histories.find((h) => h.inbound_source_ref === 'UJI-IN-001');
    expect(history).toBeDefined();
    expect(history?.requested_date).toBe('2026-11-10');
    expect(history?.events.map((e) => e.event_type)).toEqual(['INITIAL', 'CHANGE']);
    expect(history?.events.map((e) => e.event_ref)).toEqual(['UJI-COM-001', 'UJI-COM-002']);
    expect(history?.events.map((e) => e.source_row_number)).toEqual([1, 2]);
  });
});

describe('SRS-18 aturan domain BR-INB-01/02', () => {
  it('CHANGE tidak mengubah requested_date inbound', () => {
    const store = new CommitmentHistoryStore([inboundContext]);

    const initial = store.apply(1, {
      inbound_source_ref: 'UJI-IN-001',
      event_ref: 'UJI-COM-001',
      event_type: 'INITIAL',
      promised_date: '2026-11-11',
      event_at: '2026-11-10T08:00:00+07:00',
    });
    const change = store.apply(2, {
      inbound_source_ref: 'UJI-IN-001',
      event_ref: 'UJI-COM-002',
      event_type: 'CHANGE',
      promised_date: '2026-11-13',
      event_at: '2026-11-11T09:30:00+07:00',
    });

    expect(initial.status).toBe('APPLIED');
    expect(change.status).toBe('APPLIED');
    expect(change.history.requested_date).toBe('2026-11-10');
    expect(assertRequestedDateUnchanged(inboundContext, change.history)).toBeNull();
  });

  it('event lama tetap tersedia setelah beberapa CHANGE', () => {
    const store = new CommitmentHistoryStore([inboundContext]);
    store.apply(1, {
      inbound_source_ref: 'UJI-IN-001',
      event_ref: 'UJI-COM-001',
      event_type: 'INITIAL',
      promised_date: '2026-11-11',
      event_at: '2026-11-10T08:00:00+07:00',
    });
    store.apply(2, {
      inbound_source_ref: 'UJI-IN-001',
      event_ref: 'UJI-COM-002',
      event_type: 'CHANGE',
      promised_date: '2026-11-13',
      event_at: '2026-11-11T09:30:00+07:00',
    });
    const third = store.apply(3, {
      inbound_source_ref: 'UJI-IN-001',
      event_ref: 'UJI-COM-003',
      event_type: 'CHANGE',
      promised_date: '2026-11-14',
      event_at: '2026-11-12T08:00:00+07:00',
    });

    expect(third.status).toBe('APPLIED');
    expect(third.history.events).toHaveLength(3);
    expect(third.history.events.map((e) => e.event_ref)).toEqual([
      'UJI-COM-001',
      'UJI-COM-002',
      'UJI-COM-003',
    ]);
    expect(third.history.events[0].promised_date).toBe('2026-11-11');
  });

  it('urutan source row dan recorded_sequence tetap tersedia', () => {
    const result = importCommitmentRows([inboundContext], fixture.rows);
    const history = result.histories[0];
    expect(history.events.map((e) => e.source_row_number)).toEqual([1, 2]);
    expect(history.events.map((e) => e.recorded_sequence)).toEqual([1, 2]);
    expect(history.events[0].event_at_epoch_ms).toBeLessThan(history.events[1].event_at_epoch_ms);
  });
});

describe('SRS-18 negative cases dari fixture', () => {
  it('NEG-01: CHANGE tanpa INITIAL ditolak dan tidak membuat histori', () => {
    const neg = fixture.negative_cases.find((c) => c.case_id === 'UJI-COM-NEG-01');
    expect(neg).toBeDefined();
    const result = importCommitmentRows(
      [{ inbound_source_ref: 'UJI-IN-002', requested_date: '2026-11-12' }],
      [{ row_number: 1, normalized: neg!.normalized }],
    );

    expect(result.ok).toBe(false);
    expect(result.applied).toHaveLength(0);
    expect(result.issues[0].code).toBe('CHANGE_WITHOUT_INITIAL');
    // Fixture mencatat expected_issue INVALID_FILE (gap katalog G-04); perilaku domain tetap menolak.
    expect(['INVALID_FILE', 'CHANGE_WITHOUT_INITIAL']).toContain(result.issues[0].code);
  });

  it('NEG-02: inbound_source_ref belum di-commit ditolak sebagai MISSING_REFERENCE', () => {
    const neg = fixture.negative_cases.find((c) => c.case_id === 'UJI-COM-NEG-02');
    expect(neg).toBeDefined();
    const validated = validateNormalizedCommitmentRow(1, neg!.normalized);
    expect(validated.ok).toBe(true);
    if (!validated.ok) return;

    const store = new CommitmentHistoryStore([inboundContext]);
    const result = store.apply(1, validated.value);

    expect(result.status).toBe('REJECTED');
    expect(result.issues[0].code).toBe('MISSING_REFERENCE');
  });

  it('NEG-03: event_at lokal tanpa offset ditolak sebagai INVALID_FILE', () => {
    const neg = fixture.negative_cases.find((c) => c.case_id === 'UJI-COM-NEG-03');
    expect(neg).toBeDefined();
    const validated = validateNormalizedCommitmentRow(1, neg!.normalized);
    expect(validated.ok).toBe(false);
    if (validated.ok) return;
    expect(validated.issues[0].code).toBe('INVALID_FILE');
    expect(validated.issues[0].field).toBe('event_at');
  });
});

describe('SRS-18 validasi dan idempotensi', () => {
  it('menolak event_type yang tidak didukung', () => {
    const validated = validateNormalizedCommitmentRow(1, {
      inbound_source_ref: 'UJI-IN-001',
      event_ref: 'UJI-COM-X',
      event_type: 'CANCEL',
      promised_date: '2026-11-11',
      event_at: '2026-11-10T08:00:00+07:00',
    });
    expect(validated.ok).toBe(false);
    if (validated.ok) return;
    expect(validated.issues[0].code).toBe('INVALID_FILE');
  });

  it('menolak field wajib yang hilang', () => {
    const validated = validateNormalizedCommitmentRow(7, {
      inbound_source_ref: 'UJI-IN-001',
      event_type: 'INITIAL',
      promised_date: '2026-11-11',
      event_at: '2026-11-10T08:00:00+07:00',
    });
    expect(validated.ok).toBe(false);
    if (validated.ok) return;
    expect(validated.issues.some((i) => i.field === 'event_ref')).toBe(true);
  });

  it('menolak promised_date tidak valid', () => {
    const validated = validateNormalizedCommitmentRow(1, {
      inbound_source_ref: 'UJI-IN-001',
      event_ref: 'UJI-COM-X',
      event_type: 'INITIAL',
      promised_date: '2026-13-40',
      event_at: '2026-11-10T08:00:00+07:00',
    });
    expect(validated.ok).toBe(false);
  });

  it('menerima event_at dengan Z', () => {
    expect(parseCommitmentEventAt('2026-11-10T01:00:00Z')).toBe(Date.parse('2026-11-10T01:00:00Z'));
  });

  it('duplikat event_ref dengan payload identik bersifat idempotent', () => {
    const row = {
      inbound_source_ref: 'UJI-IN-001',
      event_ref: 'UJI-COM-001',
      event_type: 'INITIAL' as const,
      promised_date: '2026-11-11',
      event_at: '2026-11-10T08:00:00+07:00',
    };
    const store = new CommitmentHistoryStore([inboundContext]);
    const first = store.apply(1, row);
    const second = store.apply(99, row);

    expect(first.status).toBe('APPLIED');
    expect(second.status).toBe('IDEMPOTENT');
    expect(second.history.events).toHaveLength(1);
    expect(second.history.events[0].source_row_number).toBe(1);
  });

  it('duplikat event_ref dengan payload berbeda ditolak sebagai konflik', () => {
    const store = new CommitmentHistoryStore([inboundContext]);
    store.apply(1, {
      inbound_source_ref: 'UJI-IN-001',
      event_ref: 'UJI-COM-001',
      event_type: 'INITIAL',
      promised_date: '2026-11-11',
      event_at: '2026-11-10T08:00:00+07:00',
    });
    const conflict = store.apply(2, {
      inbound_source_ref: 'UJI-IN-001',
      event_ref: 'UJI-COM-001',
      event_type: 'INITIAL',
      promised_date: '2026-11-12',
      event_at: '2026-11-10T08:00:00+07:00',
    });

    expect(conflict.status).toBe('REJECTED');
    expect(conflict.issues[0].code).toBe('CONFLICTING_EVENT_REF');
    expect(conflict.history.events).toHaveLength(1);
  });

  it('INITIAL kedua untuk inbound yang sama ditolak', () => {
    const store = new CommitmentHistoryStore([inboundContext]);
    store.apply(1, {
      inbound_source_ref: 'UJI-IN-001',
      event_ref: 'UJI-COM-001',
      event_type: 'INITIAL',
      promised_date: '2026-11-11',
      event_at: '2026-11-10T08:00:00+07:00',
    });
    const secondInitial = store.apply(2, {
      inbound_source_ref: 'UJI-IN-001',
      event_ref: 'UJI-COM-001B',
      event_type: 'INITIAL',
      promised_date: '2026-11-12',
      event_at: '2026-11-10T09:00:00+07:00',
    });

    expect(secondInitial.status).toBe('REJECTED');
    expect(secondInitial.issues[0].code).toBe('INVALID_FILE');
  });

  it('menolak baris non-objek tanpa melempar exception', () => {
    const validated = validateNormalizedCommitmentRow(1, null);
    expect(validated.ok).toBe(false);
  });

  it('event_ref yang sama boleh ada pada inbound berbeda (unik per inbound)', () => {
    const store = new CommitmentHistoryStore([
      { inbound_source_ref: 'UJI-IN-001', requested_date: '2026-11-10' },
      { inbound_source_ref: 'UJI-IN-002', requested_date: '2026-11-12' },
    ]);

    const a = store.apply(1, {
      inbound_source_ref: 'UJI-IN-001',
      event_ref: 'UJI-COM-001',
      event_type: 'INITIAL',
      promised_date: '2026-11-11',
      event_at: '2026-11-10T08:00:00+07:00',
    });
    const b = store.apply(2, {
      inbound_source_ref: 'UJI-IN-002',
      event_ref: 'UJI-COM-001',
      event_type: 'INITIAL',
      promised_date: '2026-11-13',
      event_at: '2026-11-11T08:00:00+07:00',
    });

    expect(a.status).toBe('APPLIED');
    expect(b.status).toBe('APPLIED');
    expect(store.getHistory('UJI-IN-001')?.events).toHaveLength(1);
    expect(store.getHistory('UJI-IN-002')?.events).toHaveLength(1);
  });

  it('re-import baris identik (duplicate source row/payload) tidak menggandakan histori', () => {
    const rows: CommitmentSourceRow[] = [
      {
        row_number: 1,
        normalized: {
          inbound_source_ref: 'UJI-IN-001',
          event_ref: 'UJI-COM-001',
          event_type: 'INITIAL',
          promised_date: '2026-11-11',
          event_at: '2026-11-10T08:00:00+07:00',
        },
      },
      {
        row_number: 1,
        normalized: {
          inbound_source_ref: 'UJI-IN-001',
          event_ref: 'UJI-COM-001',
          event_type: 'INITIAL',
          promised_date: '2026-11-11',
          event_at: '2026-11-10T08:00:00+07:00',
        },
      },
    ];

    const result = importCommitmentRows([inboundContext], rows);
    expect(result.ok).toBe(true);
    expect(result.applied).toHaveLength(1);
    expect(result.idempotent).toHaveLength(1);
    expect(result.histories[0].events).toHaveLength(1);
  });
});

function row(
  overrides: Partial<Record<keyof NormalizedCommitmentRow, unknown>> = {},
): NormalizedCommitmentRow & Record<string, unknown> {
  return {
    inbound_source_ref: 'UJI-IN-001',
    event_ref: 'UJI-COM-001',
    event_type: 'INITIAL',
    promised_date: '2026-11-11',
    event_at: '2026-11-10T08:00:00+07:00',
    ...overrides,
  } as unknown as NormalizedCommitmentRow & Record<string, unknown>;
}

describe('SRS-18 review A: idempotensi dan provenance source row', () => {
  it('event identik dari source row berbeda bersifat IDEMPOTENT dan mempertahankan provenance asli', () => {
    const store = new CommitmentHistoryStore([inboundContext]);
    const first = store.apply(1, row());
    const duplicateFromOtherRow = store.apply(42, row());

    expect(first.status).toBe('APPLIED');
    expect(duplicateFromOtherRow.status).toBe('IDEMPOTENT');
    expect(duplicateFromOtherRow.record?.source_row_number).toBe(1);
    expect(duplicateFromOtherRow.history.events).toHaveLength(1);
    expect(duplicateFromOtherRow.history.events[0].source_row_number).toBe(1);
    expect(duplicateFromOtherRow.history.events[0].recorded_sequence).toBe(1);
  });

  it('event identik yang diimpor berulang tidak menggandakan histori', () => {
    const store = new CommitmentHistoryStore([inboundContext]);
    store.apply(1, row());
    const second = store.apply(2, row());
    const third = store.apply(3, row());

    expect(second.status).toBe('IDEMPOTENT');
    expect(third.status).toBe('IDEMPOTENT');
    expect(third.history.events).toHaveLength(1);
    expect(third.record?.source_row_number).toBe(1);
  });

  it('payload berbeda untuk event_ref yang sama ditolak tanpa mutasi', () => {
    const store = new CommitmentHistoryStore([inboundContext]);
    store.apply(1, row());
    const conflict = store.apply(2, row({ promised_date: '2026-11-12' }));

    expect(conflict.status).toBe('REJECTED');
    expect(conflict.issues[0].code).toBe('CONFLICTING_EVENT_REF');
    expect(conflict.history.events).toHaveLength(1);
    expect(conflict.history.events[0].promised_date).toBe('2026-11-11');
  });

  it('event_ref yang sama pada inbound berbeda tetap menjadi event independen', () => {
    const store = new CommitmentHistoryStore([
      { inbound_source_ref: 'UJI-IN-001', requested_date: '2026-11-10' },
      { inbound_source_ref: 'UJI-IN-002', requested_date: '2026-11-12' },
    ]);
    const a = store.apply(1, row());
    const b = store.apply(2, row({ inbound_source_ref: 'UJI-IN-002' }));

    expect(a.status).toBe('APPLIED');
    expect(b.status).toBe('APPLIED');
    expect(store.getHistory('UJI-IN-001')?.events).toHaveLength(1);
    expect(store.getHistory('UJI-IN-002')?.events).toHaveLength(1);
  });
});

describe('SRS-18 review B: pemrosesan batch parsial', () => {
  it('baris valid lalu invalid: baris valid tetap applied dan issue dilaporkan', () => {
    const result = importCommitmentRows([inboundContext], [
      { row_number: 1, normalized: row() },
      { row_number: 2, normalized: row({ event_ref: 'UJI-COM-002', event_type: 'CHANGE', event_at: 'tanpa-offset' }) },
    ]);

    expect(result.ok).toBe(false);
    expect(result.applied).toHaveLength(1);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].code).toBe('INVALID_FILE');
    expect(result.issues[0].row_number).toBe(2);
    expect(result.histories[0].events).toHaveLength(1);
  });

  it('baris invalid lalu valid: tidak ada mutasi dari baris invalid dan baris valid diterapkan', () => {
    const result = importCommitmentRows([inboundContext], [
      { row_number: 1, normalized: row({ promised_date: '2026-02-30' }) },
      { row_number: 2, normalized: row() },
    ]);

    expect(result.ok).toBe(false);
    expect(result.applied).toHaveLength(1);
    expect(result.applied[0].source_row_number).toBe(2);
    expect(result.applied[0].recorded_sequence).toBe(1);
    expect(result.issues[0].row_number).toBe(1);
    expect(result.histories[0].events).toHaveLength(1);
  });

  it('campuran valid dan invalid menghasilkan applied count serta histories yang konsisten', () => {
    const result = importCommitmentRows([inboundContext], [
      { row_number: 1, normalized: row() },
      { row_number: 2, normalized: row({ event_ref: 'UJI-COM-002', event_type: 'CHANGE', promised_date: '2026-11-13', event_at: '2026-11-11T09:30:00+07:00' }) },
      { row_number: 3, normalized: row({ event_ref: 'UJI-COM-003', event_type: 'INVALID' }) },
      { row_number: 4, normalized: row({ event_ref: 'UJI-COM-004', event_type: 'CHANGE', event_at: '2026-11-12T08:00:00' }) },
    ]);

    expect(result.ok).toBe(false);
    expect(result.applied).toHaveLength(2);
    expect(result.applied.map((e) => e.source_row_number)).toEqual([1, 2]);
    expect(result.issues.map((i) => i.row_number)).toEqual([3, 4]);
    expect(result.histories[0].events.map((e) => e.event_ref)).toEqual(['UJI-COM-001', 'UJI-COM-002']);
  });

  it('hasil batch deterministik untuk input yang sama', () => {
    const rows: CommitmentSourceRow[] = [
      { row_number: 1, normalized: row() },
      { row_number: 2, normalized: row({ event_ref: 'UJI-COM-002', event_type: 'CHANGE', promised_date: '2026-11-13', event_at: '2026-11-11T09:30:00+07:00' }) },
      { row_number: 3, normalized: row({ event_ref: 'UJI-COM-003', event_type: 'INVALID' }) },
    ];

    const first = importCommitmentRows([inboundContext], rows);
    const second = importCommitmentRows([inboundContext], rows);

    expect(second.histories).toEqual(first.histories);
    expect(second.issues.map((i) => [i.code, i.row_number])).toEqual(
      first.issues.map((i) => [i.code, i.row_number]),
    );
    expect(second.applied).toEqual(first.applied);
  });

  it('baris yang ditolak tidak mengubah sequence atau histori', () => {
    const store = new CommitmentHistoryStore([inboundContext]);
    store.apply(1, row());
    const before = store.getHistory('UJI-IN-001');

    const rejected = store.apply(2, row({ event_ref: 'UJI-COM-002', event_type: 'CHANGE', promised_date: '2026-02-30' }));
    expect(rejected.status).toBe('REJECTED');
    expect(store.getHistory('UJI-IN-001')).toEqual(before);

    const next = store.apply(3, row({ event_ref: 'UJI-COM-003', event_type: 'CHANGE', promised_date: '2026-11-13', event_at: '2026-11-11T09:30:00+07:00' }));
    expect(next.status).toBe('APPLIED');
    expect(next.record?.recorded_sequence).toBe(2);
  });
});

describe('SRS-18 review C: batas validasi apply()', () => {
  it('menolak promised_date invalid tanpa menyisipkan event', () => {
    const store = new CommitmentHistoryStore([inboundContext]);
    const result = store.apply(1, row({ promised_date: '2026-02-30' }));

    expect(result.status).toBe('REJECTED');
    expect(result.issues[0].field).toBe('promised_date');
    expect(store.getHistory('UJI-IN-001')?.events).toHaveLength(0);
  });

  it('menolak event_type invalid tanpa menyisipkan event', () => {
    const store = new CommitmentHistoryStore([inboundContext]);
    const result = store.apply(1, row({ event_type: 'CANCEL' }));

    expect(result.status).toBe('REJECTED');
    expect(result.issues[0].field).toBe('event_type');
    expect(store.getHistory('UJI-IN-001')?.events).toHaveLength(0);
  });

  it('menolak event_ref kosong tanpa menyisipkan event', () => {
    const store = new CommitmentHistoryStore([inboundContext]);
    const result = store.apply(1, row({ event_ref: '   ' }));

    expect(result.status).toBe('REJECTED');
    expect(result.issues[0].field).toBe('event_ref');
    expect(store.getHistory('UJI-IN-001')?.events).toHaveLength(0);
  });

  it('menolak inbound_source_ref kosong tanpa menyisipkan event', () => {
    const store = new CommitmentHistoryStore([inboundContext]);
    const result = store.apply(1, row({ inbound_source_ref: '' }));

    expect(result.status).toBe('REJECTED');
    expect(result.issues[0].field).toBe('inbound_source_ref');
    expect(store.getHistory('UJI-IN-001')?.events).toHaveLength(0);
  });

  it('menolak event_at tanpa offset tanpa menyisipkan event', () => {
    const store = new CommitmentHistoryStore([inboundContext]);
    const result = store.apply(1, row({ event_at: '2026-11-10T08:00:00' }));

    expect(result.status).toBe('REJECTED');
    expect(result.issues[0].field).toBe('event_at');
    expect(store.getHistory('UJI-IN-001')?.events).toHaveLength(0);
  });

  it('menolak input non-objek tanpa melempar exception', () => {
    const store = new CommitmentHistoryStore([inboundContext]);
    const result = store.apply(1, null as unknown as NormalizedCommitmentRow);

    expect(result.status).toBe('REJECTED');
    expect(result.issues[0].code).toBe('INVALID_FILE');
  });
});

describe('SRS-18 review D: context inbound duplikat', () => {
  it('menolak duplicate inbound_source_ref dengan requested_date identik', () => {
    expect(
      () =>
        new CommitmentHistoryStore([
          { inbound_source_ref: 'UJI-IN-001', requested_date: '2026-11-10' },
          { inbound_source_ref: 'UJI-IN-001', requested_date: '2026-11-10' },
        ]),
    ).toThrow(DuplicateInboundContextError);
  });

  it('menolak duplicate inbound_source_ref dengan requested_date berbeda', () => {
    expect(
      () =>
        new CommitmentHistoryStore([
          { inbound_source_ref: 'UJI-IN-001', requested_date: '2026-11-10' },
          { inbound_source_ref: 'UJI-IN-001', requested_date: '2026-11-11' },
        ]),
    ).toThrow(DuplicateInboundContextError);
  });

  it('menolak tabrakan referensi setelah trim', () => {
    expect(
      () =>
        new CommitmentHistoryStore([
          { inbound_source_ref: 'UJI-IN-001', requested_date: '2026-11-10' },
          { inbound_source_ref: '  UJI-IN-001  ', requested_date: '2026-11-10' },
        ]),
    ).toThrow(DuplicateInboundContextError);
  });

  it('importCommitmentRows juga menolak context duplikat', () => {
    expect(() =>
      importCommitmentRows(
        [
          { inbound_source_ref: 'UJI-IN-001', requested_date: '2026-11-10' },
          { inbound_source_ref: 'UJI-IN-001', requested_date: '2026-11-10' },
        ],
        [],
      ),
    ).toThrow(DuplicateInboundContextError);
  });
});

describe('SRS-18 hardening tanggal dan waktu', () => {
  it('menolak tanggal kalender yang tidak ada', () => {
    for (const promised_date of ['2026-02-30', '2025-02-29', '2026-13-01', '2026-00-10', '2026-11-00']) {
      const result = validateNormalizedCommitmentRow(1, row({ promised_date }));
      expect(result.ok, promised_date).toBe(false);
    }
  });

  it('menerima 29 Februari pada tahun kabisat', () => {
    const result = validateNormalizedCommitmentRow(1, row({ promised_date: '2024-02-29' }));
    expect(result.ok).toBe(true);
  });

  it('menolak timestamp invalid dan timestamp tanpa offset', () => {
    for (const event_at of [
      '2026-11-10T25:00:00+07:00',
      '2026-11-10T08:60:00+07:00',
      '2026-11-10 08:00:00+07:00',
      '2026-11-10T08:00:00',
      '2026-11-10T08:00+07:00',
    ]) {
      expect(parseCommitmentEventAt(event_at), event_at).toBeNull();
    }
  });

  it('timestamp tanpa detik ditolak karena contoh kontrak memakai detik', () => {
    expect(validateNormalizedCommitmentRow(1, row({ event_at: '2026-11-10T08:00+07:00' })).ok).toBe(false);
  });

  it('offset zona waktu yang berbeda menunjuk instant yang sama', () => {
    expect(parseCommitmentEventAt('2026-11-10T01:00:00Z')).toBe(
      parseCommitmentEventAt('2026-11-10T08:00:00+07:00'),
    );
    expect(parseCommitmentEventAt('2026-11-10T13:00:00+13:00')).toBe(
      parseCommitmentEventAt('2026-11-10T00:00:00Z'),
    );
  });

  it('beberapa inbound memiliki histori terpisah', () => {
    const result = importCommitmentRows(
      [
        { inbound_source_ref: 'UJI-IN-001', requested_date: '2026-11-10' },
        { inbound_source_ref: 'UJI-IN-002', requested_date: '2026-11-12' },
      ],
      [
        { row_number: 1, normalized: row() },
        { row_number: 2, normalized: row({ inbound_source_ref: 'UJI-IN-002', event_ref: 'UJI-COM-100' }) },
      ],
    );

    expect(result.ok).toBe(true);
    expect(result.histories).toHaveLength(2);
    expect(result.histories.map((h) => h.inbound_source_ref)).toEqual(['UJI-IN-001', 'UJI-IN-002']);
  });

  it('recorded_sequence adalah urutan penyisipan, bukan kronologi bisnis event_at', () => {
    const store = new CommitmentHistoryStore([inboundContext]);
    store.apply(1, row({ event_at: '2026-11-11T09:30:00+07:00' }));
    const laterSourceEarlierTime = store.apply(2, row({ event_ref: 'UJI-COM-002', event_type: 'CHANGE', promised_date: '2026-11-13', event_at: '2026-11-10T08:00:00+07:00' }));

    expect(laterSourceEarlierTime.status).toBe('APPLIED');
    expect(laterSourceEarlierTime.record?.recorded_sequence).toBe(2);
    expect(laterSourceEarlierTime.history.events.map((e) => e.event_at)).toEqual([
      '2026-11-11T09:30:00+07:00',
      '2026-11-10T08:00:00+07:00',
    ]);
  });
});
