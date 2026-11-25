import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  buildCommitmentView,
  evaluateReceiving,
  hasInitialBeforeChange,
  toScaled,
  validateClosing,
  type CommitmentRow,
  type ExpectedRow,
  type ReceivingRow,
} from './inbound-oracle.js';

/**
 * SRS-60 (T-26): suite table-driven alur inbound parsial, final, dan exception
 * terhadap fixture UJI proposed-0.1. Ini menguji fixture dan oracle referensi,
 * BUKAN aplikasi berjalan, API, atau basis data. Hasilnya tidak menggantikan
 * eksekusi PVT-06, PVT-07, PVT-16, dan PVT-23 pada build terintegrasi.
 */

const fixtureDir = fileURLToPath(new URL('../../../database/fixtures/uji/', import.meta.url));

type Negative<T> = { case_id: string; description: string; normalized: T; expected_issue: string };
type Fixture<T> = { rows: { normalized: T }[]; negative_cases: Negative<T>[] };

function load<T>(name: string): Fixture<T> {
  return JSON.parse(readFileSync(`${fixtureDir}${name}.proposed-0.1.json`, 'utf8')) as Fixture<T>;
}

const expectedFx = load<ExpectedRow>('expected');
const commitmentFx = load<CommitmentRow>('commitment');
const receivingFx = load<ReceivingRow>('receiving');

const expectedRows = expectedFx.rows.map((r) => r.normalized);
const commitments = commitmentFx.rows.map((r) => r.normalized);
const receipts = receivingFx.rows.map((r) => r.normalized);
const inbound001 = expectedRows.find((r) => r.source_ref === 'UJI-IN-001') as ExpectedRow;

describe('SRS-60 integritas fixture inbound UJI', () => {
  it('kaitkan setiap event janji dan penerimaan ke referensi EXPECTED yang ada', () => {
    const refs = new Set(expectedRows.map((r) => r.source_ref));
    for (const c of commitments) expect(refs.has(c.inbound_source_ref)).toBe(true);
    for (const r of receipts) expect(refs.has(r.inbound_source_ref)).toBe(true);
  });

  it('memakai hanya data UJI berawalan UJI-', () => {
    const all = [...expectedRows.map((r) => r.source_ref), ...commitments.map((c) => c.event_ref), ...receipts.map((r) => r.event_ref)];
    for (const id of all) expect(id.startsWith('UJI-')).toBe(true);
  });

  it('menolak format kuantitas non-desimal dan tidak membulatkan', () => {
    expect(() => toScaled('1e3')).toThrow();
    expect(() => toScaled('1.1234567')).toThrow();
    expect(toScaled('10.000000')).toBe(10_000_000n);
    expect(toScaled('2.5')).toBe(2_500_000n);
  });
});

describe('PVT-16 requested date dan histori janji (kandidat, CF-06 OPEN untuk atribut urutan)', () => {
  const view = buildCommitmentView(inbound001, commitments.filter((c) => c.inbound_source_ref === 'UJI-IN-001'));

  it('mempertahankan requested_date dari EXPECTED', () => {
    expect(view.requested_date).toBe('2026-11-10');
  });

  it('menyimpan INITIAL dan CHANGE sebagai dua event berurutan', () => {
    expect(view.history.map((h) => h.event_type)).toEqual(['INITIAL', 'CHANGE']);
    expect(view.history.map((h) => h.promised_date)).toEqual(['2026-11-11', '2026-11-13']);
  });

  it('janji terakhir tidak menimpa tanggal kebutuhan', () => {
    expect(view.currentPromisedDate).toBe('2026-11-13');
    expect(view.requested_date).not.toBe(view.currentPromisedDate);
  });

  it('data fixture berbeda dari contoh PVT-16 (CHANGE 13 Nov, bukan 12 Nov): dicatat sebagai temuan', () => {
    const change = view.history.find((h) => h.event_type === 'CHANGE');
    expect(change?.promised_date).toBe('2026-11-13');
  });

  it('PVT-16 data DOC-13 (CHANGE 12 Nov, ditulis inline): requested_date tetap dan janji terakhir 12 Nov', () => {
    const doc13 = commitments
      .filter((c) => c.inbound_source_ref === 'UJI-IN-001')
      .map((c) => (c.event_type === 'CHANGE' ? { ...c, promised_date: '2026-11-12' } : c));
    const docView = buildCommitmentView(inbound001, doc13);
    expect(docView.requested_date).toBe('2026-11-10');
    expect(docView.history.map((h) => h.promised_date)).toEqual(['2026-11-11', '2026-11-12']);
    expect(docView.currentPromisedDate).toBe('2026-11-12');
    expect(docView.requested_date).not.toBe(docView.currentPromisedDate);
  });
});

describe('PVT-06 dan PVT-07 penerimaan parsial dan final', () => {
  const cases: {
    name: string;
    events: ReceivingRow[];
    status: 'PARTIAL' | 'FINAL';
    total: string;
    mismatch: boolean | null;
  }[] = [
    {
      name: 'PVT-06: parsial 4 KG tanpa penutup tidak final dan tidak mismatch',
      events: [receipts[0]],
      status: 'PARTIAL',
      total: '4.000000',
      mismatch: null,
    },
    {
      name: 'fixture: parsial 4 KG ditambah penutup sah 5 KG menjadi final dengan total 9 KG (mismatch terhadap 10 KG)',
      events: receipts,
      status: 'FINAL',
      total: '9.000000',
      mismatch: true,
    },
    {
      name: 'PVT-07: parsial 4 KG ditambah penutup sah 6 KG menjadi final dengan total 10 KG tanpa mismatch',
      events: [receipts[0], { ...receipts[1], received_quantity: '6.000000' }],
      status: 'FINAL',
      total: '10.000000',
      mismatch: false,
    },
  ];

  it.each(cases)('$name', ({ events, status, total, mismatch }) => {
    const outcome = evaluateReceiving(inbound001, events);
    expect(outcome.status).toBe(status);
    expect(outcome.receivedTotal).toBe(toScaled(total));
    expect(outcome.quantityMismatch).toBe(mismatch);
    expect(outcome.rejected).toEqual([]);
  });

  it('tidak pernah menyimpulkan delivery delay (OD-06 OPEN)', () => {
    for (const c of cases) expect(evaluateReceiving(inbound001, c.events).deliveryDelay).toBeNull();
  });

  it('urutan input tidak mengubah hasil (diurutkan menurut received_at)', () => {
    const forward = evaluateReceiving(inbound001, receipts);
    const reversed = evaluateReceiving(inbound001, [...receipts].reverse());
    expect(reversed).toEqual(forward);
  });

  it.todo('PVT-07 langkah 1: validitas isi bukti penutup menurut aturan yang disepakati (OD-06 OPEN)');
  it.todo('PVT-07: penentuan delay setelah final (OD-06 OPEN)');
});

describe('PVT-23 penutup invalid dan exception', () => {
  const negatives = receivingFx.negative_cases;

  it('fixture membawa kode INVALID_CLOSING untuk penutup tanpa referensi', () => {
    const neg = negatives.find((n) => n.case_id === 'UJI-RCV-NEG-01');
    expect(neg?.expected_issue).toBe('INVALID_CLOSING');
    expect(validateClosing(neg!.normalized)).toBe('INVALID_CLOSING');
  });

  it('penutup yang ditolak tidak dihitung dan tidak membuat final', () => {
    const neg = negatives.find((n) => n.case_id === 'UJI-RCV-NEG-01')!.normalized;
    const l = { ...neg, inbound_source_ref: 'UJI-IN-002' };
    const outcome = evaluateReceiving(expectedRows.find((r) => r.source_ref === 'UJI-IN-002')!, [l]);
    expect(outcome.status).toBe('NO_RECEIPT');
    expect(outcome.rejected).toEqual([{ event_ref: l.event_ref, issue: 'INVALID_CLOSING' }]);
  });

  it('UOM berbeda ditolak dan tidak dikonversi otomatis', () => {
    const neg = negatives.find((n) => n.case_id === 'UJI-RCV-NEG-02')!;
    expect(neg.expected_issue).toBe('INVALID_FILE');
    const outcome = evaluateReceiving(inbound001, [neg.normalized]);
    expect(outcome.rejected).toEqual([{ event_ref: neg.normalized.event_ref, issue: 'UOM_MISMATCH' }]);
    expect(outcome.receivedTotal).toBe(0n);
  });

  it('CHANGE tanpa INITIAL dikenali sebagai tidak sah pada fixture janji', () => {
    const neg = commitmentFx.negative_cases.find((n) => n.case_id === 'UJI-COM-NEG-01')!;
    expect(hasInitialBeforeChange([neg.normalized])).toBe(false);
    expect(hasInitialBeforeChange(commitments.filter((c) => c.inbound_source_ref === 'UJI-IN-001'))).toBe(true);
  });

  it.todo('PVT-23 langkah 2: daftar overdue terbuka berbeda dari delivery delay final (acuan overdue dan OD-06 belum ditetapkan)');
  it.todo('exception dan notices dari API nyata (SRS-21, SRS-23, SRS-54 belum selesai)');
});
