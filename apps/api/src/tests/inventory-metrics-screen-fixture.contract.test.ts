/**
 * Tes kontrak fixture layar metrik persediaan UI-14 (SRS-32, konsumen SRS-67). Data SIMULATED.
 *
 * Yang dibuktikan dengan kode di develop:
 * - baris sumber cocok dengan skema DOC-09 `ReconciliationLine`;
 * - I-VAR pada fixture sama dengan keluaran `computeIVar` #37;
 * - tipe DTO I-VAR identik dengan tipe #37 (diperiksa saat typecheck);
 * - state layar: histori, AMBIGUOUS_ORDER, data tidak cukup, kosong.
 *
 * Latest run dan I-EXACT/I-COVER berasal dari service #49 (Draft, 9668a00) yang belum ada di
 * develop. Keduanya dicek silang terpisah pada worktree #49; di sini ditandai todo.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type {
  InventoryMetricsGroupDto,
  InventoryMetricsScreenDto,
  IVarRunDto,
  MetricLineStatusDto,
} from '@siris/contracts';
import {
  computeIVar,
  type IVarLineInput,
  type IVarRunResult,
  type ReconciliationStatus,
} from '../modules/inventory-metrics/i-var.js';
import { validateDoc09 } from './contract/doc09-schema.js';

type Equals<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
const sameIVar: Equals<IVarRunDto, IVarRunResult> = true;
const sameStatus: Equals<MetricLineStatusDto, ReconciliationStatus> = true;

const fixture = JSON.parse(
  readFileSync(
    new URL('../../../../database/fixtures/uji/inventory-metrics-screen.proposed-0.1.json', import.meta.url),
    'utf8',
  ),
);
interface FixtureRun { run_id: string; cutoff_id: string; state: string; commit_order: string | null }
const input: { filter: { warehouse_id: string; mode: string; rule_version: string; cutoff_ids: string[] }; runs: FixtureRun[]; run_lines: Record<string, IVarLineInput[]> } = fixture.service_input;
const result: InventoryMetricsScreenDto = fixture.screens.metrics_result.body;

function group(cutoffId: string): InventoryMetricsGroupDto {
  const found = result.groups.find((g) => g.cutoff_id === cutoffId);
  if (!found) throw new Error(`kelompok ${cutoffId} tidak ada`);
  return found;
}

describe('Label dan pemisahan data fixture metrik', () => {
  it('berlabel SIMULATED, mode UJI, kontrak PROPOSED, tanpa ACTUAL', () => {
    expect([sameIVar, sameStatus]).toEqual([true, true]);
    expect(fixture.data_label).toBe('SIMULATED');
    expect(fixture.mode).toBe('UJI');
    expect(fixture.contract_status).toBe('PROPOSED');
    expect(result.mode).toBe('UJI');
    expect(JSON.stringify(fixture.service_input)).not.toContain('"ACTUAL"');
    expect(JSON.stringify(fixture.screens)).not.toContain('"ACTUAL"');
  });

  it('hasil hanya memuat gudang dan cutoff dari filter', () => {
    expect(result.warehouse_id).toBe(input.filter.warehouse_id);
    for (const g of result.groups) {
      expect(input.filter.cutoff_ids).toContain(g.cutoff_id);
      expect(g.rule_version).toBe(input.filter.rule_version);
    }
  });
});

describe('Baris sumber cocok dengan DOC-09 ReconciliationLine', () => {
  it.each(Object.entries(input.run_lines))('run %s', (_runId, lines) => {
    for (const line of lines) expect(validateDoc09('ReconciliationLine', line)).toEqual([]);
  });
});

describe('I-VAR fixture sama dengan computeIVar #37', () => {
  it('setiap kelompok yang punya latest memakai baris run latest', () => {
    for (const g of result.groups.filter((x) => x.latest_run_id !== null)) {
      const latest = g.latest_run_id as string;
      const computed = computeIVar([{ run_id: latest, cutoff_id: g.cutoff_id, rule_version: g.rule_version, lines: input.run_lines[latest] }]);
      expect(computed.ok).toBe(true);
      if (!computed.ok) return;
      expect(g.i_var).toEqual(computed.runs[0]);
    }
  });
});

describe('State layar', () => {
  const [c1, c2, c3] = input.filter.cutoff_ids;

  it('histori menyimpan semua run COMMITTED dan tidak memuat run yang belum COMMITTED', () => {
    for (const g of result.groups) {
      const committed = input.runs.filter((r) => r.cutoff_id === g.cutoff_id && r.state === 'COMMITTED').map((r) => r.run_id).sort();
      expect([...g.history_run_ids].sort()).toEqual(committed);
      const notCommitted = input.runs.filter((r) => r.state !== 'COMMITTED').map((r) => r.run_id);
      for (const id of notCommitted) {
        expect(g.history_run_ids).not.toContain(id);
        expect(g.latest_run_id).not.toBe(id);
      }
    }
    expect(group(c1).history_run_ids.length).toBeGreaterThan(1);
  });

  it('AMBIGUOUS_ORDER tidak memilih latest dan tidak menampilkan metrik', () => {
    const g = group(c2);
    expect(g.status).toBe('AMBIGUOUS_ORDER');
    expect(g.latest_run_id).toBeNull();
    expect(g.i_var).toBeNull();
    expect(g.exact_cover).toBeNull();
  });

  it('data tidak cukup: I-EXACT null (0/0), I-COVER 0% tetap angka', () => {
    const g = group(c3);
    expect(g.i_var?.insufficient_data).toBe(true);
    expect(g.i_var?.items).toEqual([]);
    expect(g.exact_cover?.i_exact).toMatchObject({ denominator: 0, percent: null, insufficient_data: true });
    expect(g.exact_cover?.i_cover).toMatchObject({ numerator: 0, percent: 0, insufficient_data: false });
  });

  it('percent belum dibulatkan (pembulatan masih OPEN)', () => {
    const g = group(c1);
    const ratio = g.exact_cover?.i_exact;
    expect(ratio?.percent).toBe(((ratio?.numerator ?? 0) * 100) / (ratio?.denominator ?? 1));
  });

  it('hasil kosong tampil sebagai daftar kelompok kosong', () => {
    expect(fixture.screens.metrics_empty.body.groups).toEqual([]);
  });

  it.todo('cocokkan latest_run_id dan exact_cover dengan InventoryMetricsService #49 setelah #49 merged');
});
