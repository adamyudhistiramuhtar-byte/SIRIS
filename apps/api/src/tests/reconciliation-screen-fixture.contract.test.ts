/**
 * Tes kontrak fixture layar rekonsiliasi SCR-12 (SRS-86, konsumen SRS-67). Data SIMULATED.
 *
 * Membuktikan tanpa database:
 * 1. Isi fixture cocok dengan skema DOC-09 (RunCreated, RunDetail, ReconciliationLine).
 * 2. Baris `run_detail` benar-benar keluaran engine #36 dari `engine_input`, bukan ketikan.
 * 3. Tipe DTO @siris/contracts identik dengan tipe engine (diperiksa saat typecheck).
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type {
  ReconciliationErrorCodeDto,
  ReconciliationLineDto,
  ReconciliationRejectCodeDto,
  ReconciliationRunDetailDto,
  ReconciliationStatusDto,
} from '@siris/contracts';
import {
  RECONCILIATION_RULE_VERSION,
  reconcile,
  type ReconciliationContext,
  type ReconciliationLineResult,
  type ReconciliationRejectCode,
  type ReconciliationStatus,
  type StockLineInput,
} from '../modules/reconciliation/reconciliation-engine.js';
import { doc09Schemas, validateDoc09 } from './contract/doc09-schema.js';

/** Gagal typecheck bila dua tipe tidak identik; mencegah DTO menyimpang dari engine. */
type Equals<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
const sameStatus: Equals<ReconciliationStatusDto, ReconciliationStatus> = true;
const sameLine: Equals<ReconciliationLineDto, ReconciliationLineResult> = true;
const sameReject: Equals<ReconciliationRejectCodeDto, ReconciliationRejectCode> = true;

const fixture = JSON.parse(
  readFileSync(
    new URL('../../../../database/fixtures/uji/reconciliation-screen.proposed-0.1.json', import.meta.url),
    'utf8',
  ),
);
const input = fixture.engine_input;
const detail: ReconciliationRunDetailDto = fixture.screens.run_detail.body;
const httpStatus: Record<ReconciliationErrorCodeDto, number> = fixture.error_http_status;
const VALID_PAIR: ReconciliationStatusDto[] = ['MATCHED', 'DISCREPANCY'];

interface Rejection {
  case: string;
  stock_context_override: Partial<ReconciliationContext>;
  count_context_override: Partial<ReconciliationContext>;
  stock_lines_override?: StockLineInput[];
  expected_error: { code: ReconciliationRejectCodeDto; http_status: number; material_id?: string };
}
const rejections: Rejection[] = fixture.screens.context_rejections;

describe('Label dan pemisahan data fixture rekonsiliasi', () => {
  it('berlabel SIMULATED, mode UJI, kontrak PROPOSED', () => {
    expect([sameStatus, sameLine, sameReject]).toEqual([true, true, true]);
    expect(fixture.data_label).toBe('SIMULATED');
    expect(fixture.mode).toBe('UJI');
    expect(fixture.contract_status).toBe('PROPOSED');
    expect(input.context.mode).toBe('UJI');
  });

  it('ACTUAL hanya muncul sebagai input kasus penolakan, tidak pernah sebagai hasil', () => {
    const { context_rejections: _rejections, ...rest } = fixture.screens;
    expect(JSON.stringify(rest)).not.toContain('"ACTUAL"');
    expect(JSON.stringify(input)).not.toContain('"ACTUAL"');
  });
});

describe('Kecocokan dengan skema DOC-09', () => {
  it('run_created cocok dengan RunCreated dan rule_version engine', () => {
    expect(validateDoc09('RunCreated', fixture.screens.run_created.body)).toEqual([]);
    expect(fixture.screens.run_created.body.rule_version).toBe(RECONCILIATION_RULE_VERSION);
  });

  it('run_detail dan run_detail_empty cocok dengan RunDetail', () => {
    expect(validateDoc09('RunDetail', detail)).toEqual([]);
    expect(validateDoc09('RunDetail', fixture.screens.run_detail_empty.body)).toEqual([]);
    expect(fixture.screens.run_detail_empty.body.lines).toEqual([]);
  });

  it('pemeriksa skema menolak fixture yang dirusak (bukan pemeriksa kosong)', () => {
    const broken = structuredClone(detail) as unknown as { lines: Record<string, unknown>[] };
    broken.lines[0].variance = 1;
    broken.lines[1].catatan = 'tidak dikenal';
    broken.lines[2].status = 'SELISIH';
    delete broken.lines[3].material_id;
    const errors = validateDoc09('RunDetail', broken);
    for (const path of ['lines[0].variance', 'lines[1].catatan', 'lines[2].status', 'lines[3].material_id']) {
      expect(errors.some((e) => e.includes(path))).toBe(true);
    }
  });

  it('enum status DOC-09 sama dengan enam status di fixture', () => {
    const schema = doc09Schemas().ReconciliationLine as { properties: { status: { enum: string[] } } };
    expect(new Set(detail.lines.map((l) => l.status))).toEqual(new Set(schema.properties.status.enum));
  });
});

describe('Baris run_detail berasal dari engine #36', () => {
  it('engine_input menghasilkan baris yang sama persis', () => {
    const result = reconcile({
      stock: { context: input.context, lines: input.stock_lines },
      count: { context: input.context, lines: input.count_lines },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.rule_version).toBe(fixture.screens.run_created.body.rule_version);
    expect(result.lines).toEqual(detail.lines);
  });

  it('variance hanya ada pada pasangan valid; nonvalid tetap null, bukan 0', () => {
    for (const line of detail.lines) {
      if (VALID_PAIR.includes(line.status)) expect(line.variance).not.toBeNull();
      else expect(line.variance).toBeNull();
    }
  });

  it('fisik nol yang dihitung tetap angka, belum dihitung tetap null', () => {
    const zero = detail.lines.find((l) => l.physical_quantity === '0.000000');
    const notCounted = detail.lines.find((l) => l.status === 'NOT_COUNTED');
    expect(zero?.status).toBe('DISCREPANCY');
    expect(notCounted?.physical_quantity).toBeNull();
    expect(notCounted?.variance).toBeNull();
  });

  it.each(rejections.map((r) => [r.case, r] as const))('penolakan "%s" menghasilkan kode engine yang sama', (_label, rejection) => {
    const result = reconcile({
      stock: { context: { ...input.context, ...rejection.stock_context_override }, lines: rejection.stock_lines_override ?? input.stock_lines },
      count: { context: { ...input.context, ...rejection.count_context_override }, lines: input.count_lines },
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe(rejection.expected_error.code);
    expect(result.material_id).toBe(rejection.expected_error.material_id);
    expect(httpStatus[result.code]).toBe(rejection.expected_error.http_status);
  });
});

describe('Peta status HTTP error (usulan #47)', () => {
  it('memuat semua kode error DTO dan kode tolak konteks bernilai 422', () => {
    const codes: ReconciliationErrorCodeDto[] = [
      'BAD_REQUEST', 'NOT_FOUND', 'FORBIDDEN', 'IDEMPOTENCY_CONFLICT', 'WAREHOUSE_MISMATCH', 'MODE_MISMATCH',
      'CUTOFF_MISMATCH', 'CUTOFF_UNVERIFIED', 'AMBIGUOUS_PAIR', 'NOT_COUNTED_VALUE', 'INVALID_FILE',
      'TRANSACTION_FAILED', 'TRANSACTION_OUTCOME_UNKNOWN',
    ];
    const { _keterangan: _note, ...map } = fixture.error_http_status;
    expect(Object.keys(map).sort()).toEqual([...codes].sort());
    for (const rejection of rejections) expect(rejection.expected_error.http_status).toBe(422);
  });
});
