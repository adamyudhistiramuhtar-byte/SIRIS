import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import {
  calculateOtdR,
  calculateOtdC,
  calculateQuantityMismatchRate,
  calculateSFill,
  calculateSLead,
  calculateSChange,
  calculateSupplierMetrics,
  toSupplierMetricsDtoCandidate,
} from '../features/supplier-metrics/index.js';
import type {
  CommitmentEvent,
  ExclusionReason,
  InboundRecord,
  MetricResult,
  ReceivingEvent,
  SupplierMetricsFixtureFile,
  SupplierMetricSource,
} from '../features/supplier-metrics/index.js';

interface OracleFile {
  fixture_version: string;
  oracle_version: string;
  decision_status: string;
  expected: {
    otd_r: { value: number; numerator: number; denominator: number; excluded_count: number };
    otd_c: { value: number; numerator: number; denominator: number; excluded_count: number };
    quantity_mismatch_rate: {
      value: number;
      numerator: number;
      denominator: number;
      excluded_count: number;
    };
    s_lead: { value: number; numerator: number; denominator: number; excluded_count: number };
    s_change: {
      value: number;
      numerator: number;
      denominator: number | null;
      excluded_count: number;
    };
    s_fill: Array<{
      supplier_code: string;
      material_code: string;
      uom: string;
      value: number;
      numerator: number;
      denominator: number;
      excluded_count: number;
    }>;
  };
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(
    readFileSync(new URL(`../../../../${relativePath}`, import.meta.url), 'utf8'),
  ) as T;
}

const fixture = readJson<SupplierMetricsFixtureFile>('database/fixtures/uji/supplier_metrics.uji-0.1.json');
const oracle = readJson<OracleFile>('database/fixtures/uji/supplier_metrics.expected-0.1.json');

function makeInbound(overrides: Partial<InboundRecord> = {}): InboundRecord {
  return {
    inbound_ref: 'T-IN-001',
    warehouse_id: 'WH-T',
    mode: 'UJI',
    supplier_code: 'T-SUP',
    material_code: 'T-MAT',
    uom: 'KG',
    release_date: '2026-11-01',
    requested_date: '2026-11-10',
    expected_quantity: '100.000000',
    status: 'FINAL',
    final_arrival_date: '2026-11-10',
    final_completion_at: '2026-11-10T10:00:00+07:00',
    source_reference: 'T-SRC-IN-001',
    ...overrides,
  };
}

function makeCommitment(overrides: Partial<CommitmentEvent> = {}): CommitmentEvent {
  return {
    inbound_ref: 'T-IN-001',
    event_ref: 'T-COM-001',
    event_type: 'INITIAL',
    promised_date: '2026-11-10',
    event_at: '2026-11-05T08:00:00+07:00',
    source_reference: 'T-SRC-COM-001',
    ...overrides,
  };
}

function makeReceipt(overrides: Partial<ReceivingEvent> = {}): ReceivingEvent {
  return {
    inbound_ref: 'T-IN-001',
    event_ref: 'T-RCV-001',
    received_quantity: '100.000000',
    uom: 'KG',
    received_at: '2026-11-10T09:00:00+07:00',
    is_closing: true,
    closing_reference: 'T-CLOSE-001',
    source_reference: 'T-SRC-RCV-001',
    ...overrides,
  };
}

function makeSource(overrides: Partial<SupplierMetricSource> = {}): SupplierMetricSource {
  return { data_status: 'UJI', inbound: [], commitments: [], receipts: [], ...overrides };
}

function excludedRefs(result: MetricResult, reason: ExclusionReason): string[] {
  return result.exclusions.find((entry) => entry.reason === reason)?.source_refs ?? [];
}

const result = calculateSupplierMetrics(fixture, fixture.fixture_version);

describe('SRS-24 fixture UJI dan oracle berversi', () => {
  it('memuat dataset demonstrasi design.md §6.6 (5 inbound, 6 commitment, 6 receipt)', () => {
    expect(fixture.fixture_version).toBe('uji-0.1');
    expect(fixture.data_status).toBe('UJI');
    expect(fixture.inbound).toHaveLength(5);
    expect(fixture.commitments).toHaveLength(6);
    expect(fixture.receipts).toHaveLength(6);
    expect(fixture.inbound.filter((row) => row.status === 'FINAL')).toHaveLength(4);
    expect(fixture.inbound.filter((row) => row.status === 'OPEN')).toHaveLength(1);
    expect(fixture.commitments.filter((row) => row.event_type === 'CHANGE')).toHaveLength(2);
    expect(oracle.fixture_version).toBe(fixture.fixture_version);
    expect(oracle.decision_status).toBe('CANDIDATE_UJI');
  });

  it('OTD-R 75% (3/4) dan mengecualikan record OPEN', () => {
    const metric = result.metrics.otd_r;
    expect(metric.value).toBeCloseTo(oracle.expected.otd_r.value, 6);
    expect(metric.numerator).toBe(oracle.expected.otd_r.numerator);
    expect(metric.denominator).toBe(oracle.expected.otd_r.denominator);
    expect(metric.excluded_count).toBe(oracle.expected.otd_r.excluded_count);
    expect(excludedRefs(metric, 'OPEN_NOT_FINAL')).toEqual(['UJI-IN-005']);
    expect(metric.unit).toBe('PERCENT');
    expect(metric.decision_status).toBe('CANDIDATE_UJI');
  });

  it('OTD-C 100% karena CHANGE terakhir menutup keterlambatan terhadap requested date', () => {
    const metric = result.metrics.otd_c;
    expect(metric.value).toBeCloseTo(oracle.expected.otd_c.value, 6);
    expect(metric.numerator).toBe(oracle.expected.otd_c.numerator);
    expect(metric.denominator).toBe(oracle.expected.otd_c.denominator);
    expect(metric.source_refs).toContain('UJI-COM-003');
  });

  it('Quantity Mismatch Rate 50% (2/4)', () => {
    const metric = result.metrics.quantity_mismatch_rate;
    expect(metric.value).toBeCloseTo(oracle.expected.quantity_mismatch_rate.value, 6);
    expect(metric.numerator).toBe(oracle.expected.quantity_mismatch_rate.numerator);
    expect(metric.denominator).toBe(oracle.expected.quantity_mismatch_rate.denominator);
    expect(excludedRefs(metric, 'OPEN_NOT_FINAL')).toEqual(['UJI-IN-005']);
  });

  it('S-LEAD 10,25 hari dari selisih hari kalender completion - release', () => {
    const metric = result.metrics.s_lead;
    expect(metric.value).toBeCloseTo(oracle.expected.s_lead.value, 6);
    expect(metric.numerator).toBe(oracle.expected.s_lead.numerator);
    expect(metric.denominator).toBe(oracle.expected.s_lead.denominator);
    expect(metric.unit).toBe('DAYS');
  });

  it('S-CHANGE menghitung 2 event CHANGE dan bukan 6 commitment events', () => {
    const metric = result.metrics.s_change;
    expect(metric.value).toBe(oracle.expected.s_change.value);
    expect(metric.unit).toBe('COUNT');
    expect(metric.denominator).toBeNull();
    expect(metric.source_refs).toEqual(['UJI-COM-002', 'UJI-COM-003']);
  });

  it('S-FILL dihitung per supplier + material + UOM sesuai oracle', () => {
    expect(result.s_fill.map((group) => group.group)).toEqual(
      oracle.expected.s_fill.map((group) => ({
        supplier_code: group.supplier_code,
        material_code: group.material_code,
        uom: group.uom,
      })),
    );

    for (const expectedGroup of oracle.expected.s_fill) {
      const actual = result.s_fill.find(
        (group) =>
          group.group.supplier_code === expectedGroup.supplier_code &&
          group.group.material_code === expectedGroup.material_code &&
          group.group.uom === expectedGroup.uom,
      );
      expect(actual).toBeDefined();
      expect(actual?.value).toBeCloseTo(expectedGroup.value, 6);
      expect(actual?.numerator).toBe(expectedGroup.numerator);
      expect(actual?.denominator).toBe(expectedGroup.denominator);
      expect(actual?.metric).toBe('S_FILL');
    }
  });

  it('S-FILL tidak menggabungkan material/UOM berbeda menjadi satu nilai', () => {
    const source = makeSource({
      inbound: [
        makeInbound({ inbound_ref: 'T-IN-A', material_code: 'T-MAT-X', uom: 'KG' }),
        makeInbound({ inbound_ref: 'T-IN-B', material_code: 'T-MAT-X', uom: 'L' }),
      ],
      receipts: [
        makeReceipt({ inbound_ref: 'T-IN-A', event_ref: 'T-RCV-A' }),
        makeReceipt({ inbound_ref: 'T-IN-B', event_ref: 'T-RCV-B', uom: 'L' }),
      ],
    });

    const groups = calculateSFill(source);
    expect(groups).toHaveLength(2);
    expect(groups.map((group) => group.group.uom).sort()).toEqual(['KG', 'L']);
  });
});

describe('SRS-24 denominator nol dan nilai hilang', () => {
  it('denominator nol menghasilkan null + alasan, bukan 0%', () => {
    const source = makeSource({
      inbound: [
        makeInbound({
          status: 'OPEN',
          final_arrival_date: null,
          final_completion_at: null,
        }),
      ],
    });

    for (const metric of [
      calculateOtdR(source),
      calculateOtdC(source),
      calculateQuantityMismatchRate(source),
      calculateSLead(source),
    ]) {
      expect(metric.value).toBeNull();
      expect(metric.value).not.toBe(0);
      expect(metric.denominator).toBe(0);
      expect(metric.unavailable_reason).toBe('ZERO_DENOMINATOR');
    }
  });

  it('S-CHANGE bernilai 0 bila tidak ada event CHANGE, karena ini metrik hitung', () => {
    const metric = calculateSChange(makeSource({ inbound: [makeInbound()] }));
    expect(metric.value).toBe(0);
    expect(metric.value).not.toBeNull();
    expect(metric.unavailable_reason).toBeNull();
  });

  it('final tanpa requested_date dikecualikan dari OTD-R dengan alasan eksplisit', () => {
    const metric = calculateOtdR(makeSource({ inbound: [makeInbound({ requested_date: null })] }));
    expect(metric.value).toBeNull();
    expect(metric.excluded_count).toBe(1);
    expect(metric.exclusions).toEqual([
      { reason: 'MISSING_REQUESTED_DATE', count: 1, source_refs: ['T-IN-001'] },
    ]);
  });

  it('final tanpa release_date dikecualikan dari S-LEAD', () => {
    const metric = calculateSLead(makeSource({ inbound: [makeInbound({ release_date: null })] }));
    expect(metric.value).toBeNull();
    expect(excludedRefs(metric, 'MISSING_RELEASE_DATE')).toEqual(['T-IN-001']);
  });

  it('final tanpa expected_quantity dikecualikan dari mismatch, bukan dianggap 0', () => {
    const metric = calculateQuantityMismatchRate(
      makeSource({
        inbound: [makeInbound({ expected_quantity: null })],
        receipts: [makeReceipt()],
      }),
    );
    expect(metric.value).toBeNull();
    expect(excludedRefs(metric, 'MISSING_EXPECTED_QUANTITY')).toEqual(['T-IN-001']);
  });

  it('expected_quantity nol dikecualikan dengan alasan ZERO_EXPECTED_QUANTITY', () => {
    const source = makeSource({
      inbound: [makeInbound({ expected_quantity: '0.000000' })],
      receipts: [makeReceipt({ received_quantity: '0.000000' })],
    });
    const mismatch = calculateQuantityMismatchRate(source);
    expect(mismatch.value).toBeNull();
    expect(excludedRefs(mismatch, 'ZERO_EXPECTED_QUANTITY')).toEqual(['T-IN-001']);

    const fill = calculateSFill(source);
    expect(fill).toHaveLength(1);
    expect(fill[0].value).toBeNull();
    expect(fill[0].unavailable_reason).toBe('ZERO_DENOMINATOR');
  });
});

describe('SRS-24 receiving: parsial, mismatch, dan event tidak sah', () => {
  it('penerimaan parsial dijumlahkan dan tidak dihitung mismatch bila total sama', () => {
    const source = makeSource({
      inbound: [makeInbound({ expected_quantity: '100.000000' })],
      receipts: [
        makeReceipt({ event_ref: 'T-RCV-001', received_quantity: '40.000000', is_closing: false, closing_reference: null }),
        makeReceipt({ event_ref: 'T-RCV-002', received_quantity: '60.000000' }),
      ],
    });

    const metric = calculateQuantityMismatchRate(source);
    expect(metric.denominator).toBe(1);
    expect(metric.numerator).toBe(0);
    expect(metric.value).toBe(0);
  });

  it('total received berbeda dari expected dihitung sebagai mismatch', () => {
    const source = makeSource({
      inbound: [makeInbound({ expected_quantity: '100.000000' })],
      receipts: [
        makeReceipt({ event_ref: 'T-RCV-001', received_quantity: '40.000000', is_closing: false, closing_reference: null }),
        makeReceipt({ event_ref: 'T-RCV-002', received_quantity: '50.000000' }),
      ],
    });

    const metric = calculateQuantityMismatchRate(source);
    expect(metric.numerator).toBe(1);
    expect(metric.value).toBe(100);
  });

  it('receipt dengan UOM berbeda tidak dikonversi dan record dikecualikan', () => {
    const metric = calculateQuantityMismatchRate(
      makeSource({
        inbound: [makeInbound({ uom: 'KG' })],
        receipts: [makeReceipt({ uom: 'G', received_quantity: '1000.000000' })],
      }),
    );
    expect(metric.value).toBeNull();
    expect(excludedRefs(metric, 'UOM_NOT_COMPARABLE')).toEqual(['T-IN-001']);
  });

  it('is_closing tanpa closing_reference dikecualikan sebagai INVALID_RECEIPT', () => {
    const metric = calculateQuantityMismatchRate(
      makeSource({
        inbound: [makeInbound()],
        receipts: [makeReceipt({ is_closing: true, closing_reference: null })],
      }),
    );
    expect(metric.value).toBeNull();
    expect(excludedRefs(metric, 'INVALID_RECEIPT')).toEqual(['T-IN-001']);
  });

  it('event receipt duplikat dikecualikan, bukan dijumlahkan dua kali', () => {
    const metric = calculateQuantityMismatchRate(
      makeSource({
        inbound: [makeInbound()],
        receipts: [
          makeReceipt({ event_ref: 'T-RCV-DUP', received_quantity: '50.000000', is_closing: false, closing_reference: null }),
          makeReceipt({ event_ref: 'T-RCV-DUP', received_quantity: '50.000000' }),
        ],
      }),
    );
    expect(metric.value).toBeNull();
    expect(excludedRefs(metric, 'DUPLICATE_RECEIPT_EVENT')).toEqual(['T-IN-001']);
  });

  it('final tanpa receipt dikecualikan dan tidak dianggap menerima 0', () => {
    const metric = calculateQuantityMismatchRate(
      makeSource({ inbound: [makeInbound({ expected_quantity: '100.000000' })] }),
    );
    expect(metric.value).toBeNull();
    expect(excludedRefs(metric, 'NO_RECEIPTS')).toEqual(['T-IN-001']);
  });
});

describe('SRS-24 commitment: perubahan ganda dan event tidak sah', () => {
  it('memakai janji terakhir sebelum completion dan mengabaikan CHANGE setelah completion', () => {
    const inbound = makeInbound({
      final_arrival_date: '2026-11-12',
      final_completion_at: '2026-11-12T10:00:00+07:00',
    });

    const lateChange = makeSource({
      inbound: [inbound],
      commitments: [
        makeCommitment({ event_ref: 'T-COM-001', promised_date: '2026-11-11', event_at: '2026-11-10T08:00:00+07:00' }),
        makeCommitment({ event_ref: 'T-COM-002', event_type: 'CHANGE', promised_date: '2026-11-13', event_at: '2026-11-12T12:00:00+07:00' }),
      ],
    });
    expect(calculateOtdC(lateChange).numerator).toBe(0);

    const earlyChange = makeSource({
      inbound: [inbound],
      commitments: [
        makeCommitment({ event_ref: 'T-COM-001', promised_date: '2026-11-11', event_at: '2026-11-10T08:00:00+07:00' }),
        makeCommitment({ event_ref: 'T-COM-002', event_type: 'CHANGE', promised_date: '2026-11-13', event_at: '2026-11-12T09:00:00+07:00' }),
      ],
    });
    const metric = calculateOtdC(earlyChange);
    expect(metric.numerator).toBe(1);
    expect(metric.value).toBe(100);
  });

  it('CHANGE tanpa INITIAL dianggap tidak sah', () => {
    const metric = calculateOtdC(
      makeSource({
        inbound: [makeInbound()],
        commitments: [
          makeCommitment({ event_type: 'CHANGE', promised_date: '2026-11-10' }),
        ],
      }),
    );
    expect(metric.value).toBeNull();
    expect(excludedRefs(metric, 'INVALID_COMMITMENT_SEQUENCE')).toEqual(['T-IN-001']);
  });

  it('event commitment duplikat dikecualikan dari OTD-C', () => {
    const metric = calculateOtdC(
      makeSource({
        inbound: [makeInbound()],
        commitments: [
          makeCommitment({ event_ref: 'T-COM-DUP', promised_date: '2026-11-10' }),
          makeCommitment({ event_ref: 'T-COM-DUP', event_type: 'CHANGE', promised_date: '2026-11-11' }),
        ],
      }),
    );
    expect(metric.value).toBeNull();
    expect(excludedRefs(metric, 'DUPLICATE_COMMITMENT_EVENT')).toEqual(['T-IN-001']);
  });

  it('final tanpa commitment dikecualikan dari OTD-C dengan alasan NO_COMMITMENT', () => {
    const metric = calculateOtdC(makeSource({ inbound: [makeInbound()] }));
    expect(metric.value).toBeNull();
    expect(excludedRefs(metric, 'NO_COMMITMENT')).toEqual(['T-IN-001']);
  });
});

describe('SRS-24 DTO kandidat', () => {
  it('menandai kontrak dan data sebagai kandidat UJI, bukan kontrak bersama', () => {
    const dto = toSupplierMetricsDtoCandidate(result, {
      generated_at: '2026-11-24T00:00:00Z',
      oracle_version: oracle.oracle_version,
      filter: { supplier_code: 'UJI-SUP-A' },
    });

    expect(dto.contract_status).toBe('CANDIDATE');
    expect(dto.data_status).toBe('UJI');
    expect(dto.fixture_version).toBe('uji-0.1');
    expect(dto.oracle_version).toBe('oracle-0.1');
    expect(dto.filter.supplier_code).toBe('UJI-SUP-A');
    expect(dto.metrics.otd_r.decision_status).toBe('CANDIDATE_UJI');
    expect(dto.open_decisions.length).toBeGreaterThan(0);
    expect(dto.s_fill).toHaveLength(3);
  });
});


describe('Regresi review PM terhadap sumber DESAIN-42-1.1',()=>{
  it('kuantitas expected negatif tidak masuk denominator',()=>{
    const source=makeSource({inbound:[makeInbound({expected_quantity:'-100.000000'})],receipts:[makeReceipt()]});
    expect(calculateQuantityMismatchRate(source).denominator).toBe(0);
  });
  it('janji pada instant final tidak dipakai sebagai janji sebelum final',()=>{
    const source=makeSource({inbound:[makeInbound({final_arrival_date:'2026-11-10'})],commitments:[makeCommitment({promised_date:'2026-11-09'}),makeCommitment({event_ref:'T-COM-002',event_type:'CHANGE',event_at:'2026-11-10T10:00:00+07:00',promised_date:'2026-11-12'})]});
    expect(calculateOtdC(source).value).toBe(0);
  });
});
