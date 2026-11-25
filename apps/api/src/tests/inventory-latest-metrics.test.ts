import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it } from 'vitest';
import { computeExactCover, type MetricLineInput } from '../modules/inventory-metrics/exact-cover.js';
import type { IVarLineInput } from '../modules/inventory-metrics/i-var.js';
import {
  InventoryMetricsError,
  InventoryMetricsService,
  type MetricsFilter,
} from '../modules/inventory-metrics/inventory-metrics.service.js';
import { selectLatestCommitted, type RunSummary } from '../modules/inventory-metrics/latest-run.js';

/** Fixture I-VAR UJI dari PR #37 (sumber design.md §Fixture persediaan); dibaca, tidak diubah. */
const fixture = JSON.parse(readFileSync(new URL('./fixtures/i-var.uji.proposed-0.1.json', import.meta.url), 'utf8')) as {
  runs: { run_id: string; cutoff_id: string; rule_version: string; lines: IVarLineInput[] }[];
};
const [runA, runB] = fixture.runs;

const WAREHOUSE = '20000000-0000-4000-8000-000000000001';
const RULE = 'uji-engine/proposed-0.1';
const CORRELATION = '50000000-0000-4000-8000-000000000003';
const ACTOR = { actor_id: '10000000-0000-4000-8000-000000000004', role: 'WAREHOUSE', warehouse_ids: [WAREHOUSE] };

function summary(overrides: Partial<RunSummary>): RunSummary {
  return { run_id: 'run', warehouse_id: WAREHOUSE, mode: 'UJI', cutoff_id: runA.cutoff_id, rule_version: RULE, state: 'COMMITTED', commit_order: 1n, ...overrides };
}

describe('SRS-32 latest hanya dari run COMMITTED (D-06)', () => {
  it('memilih commit_order terbesar dalam kelompok cutoff + rule; histori tetap lengkap', () => {
    const selection = selectLatestCommitted([
      summary({ run_id: 'r-1', commit_order: 1n }),
      summary({ run_id: 'r-3', commit_order: 3n }),
      summary({ run_id: 'r-2', commit_order: 2n }),
    ]);
    expect(selection.groups).toHaveLength(1);
    expect(selection.groups[0]).toMatchObject({ status: 'OK', latest_run_id: 'r-3', history_run_ids: ['r-1', 'r-2', 'r-3'] });
  });

  it('run yang belum COMMITTED tidak pernah dipilih walaupun commit_order lebih besar', () => {
    const selection = selectLatestCommitted([
      summary({ run_id: 'r-1', commit_order: 1n }),
      summary({ run_id: 'r-9', commit_order: 9n, state: 'PENDING' }),
    ]);
    expect(selection.groups[0].latest_run_id).toBe('r-1');
    expect(selection.ignored_run_ids).toEqual(['r-9']);
    expect(selection.groups[0].history_run_ids).toEqual(['r-1']);
  });

  it('tidak menebak tie-break (OD-06): commit_order seri atau tidak ada → AMBIGUOUS_ORDER tanpa memilih', () => {
    for (const runs of [
      [summary({ run_id: 'r-1', commit_order: 2n }), summary({ run_id: 'r-2', commit_order: 2n })],
      [summary({ run_id: 'r-1', commit_order: 1n }), summary({ run_id: 'r-2', commit_order: null })],
    ]) {
      const [group] = selectLatestCommitted(runs).groups;
      expect(group).toMatchObject({ status: 'AMBIGUOUS_ORDER', latest_run_id: null, history_run_ids: ['r-1', 'r-2'] });
    }
  });

  it('seri di bawah nilai terbesar tidak menghalangi pemilihan', () => {
    const [group] = selectLatestCommitted([
      summary({ run_id: 'r-1', commit_order: 1n }), summary({ run_id: 'r-2', commit_order: 1n }), summary({ run_id: 'r-3', commit_order: 5n }),
    ]).groups;
    expect(group.latest_run_id).toBe('r-3');
  });

  it('cutoff berbeda dan rule_version berbeda adalah kelompok terpisah, tidak dicampur', () => {
    const selection = selectLatestCommitted([
      summary({ run_id: 'a', cutoff_id: runA.cutoff_id }),
      summary({ run_id: 'b', cutoff_id: runB.cutoff_id }),
      summary({ run_id: 'c', cutoff_id: runA.cutoff_id, rule_version: 'uji-engine/proposed-0.2' }),
    ]);
    expect(selection.groups.map((group) => group.latest_run_id).sort()).toEqual(['a', 'b', 'c']);
  });

  it('tanpa run → tanpa kelompok (hasil kosong, bukan error)', () => {
    expect(selectLatestCommitted([])).toEqual({ groups: [], ignored_run_ids: [] });
  });
});

describe('SRS-32 I-EXACT dan I-COVER per run (definisi design.md)', () => {
  it('oracle fixture design.md: I-EXACT 40%, I-COVER 62,5%', () => {
    const outcome = computeExactCover(runA.lines);
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.result.counts).toEqual({ matched: 2, discrepancy: 3, valid: 5, nonvalid: 4, snapshot_items: 8 });
    expect(outcome.result.i_exact).toEqual({ numerator: 2, denominator: 5, percent: 40, insufficient_data: false });
    expect(outcome.result.i_cover).toEqual({ numerator: 5, denominator: 8, percent: 62.5, insufficient_data: false });
  });

  it('tanpa pasangan valid → I-EXACT tidak tersedia, bukan 0%', () => {
    const lines: MetricLineInput[] = [{ material_id: 'M-1', status: 'NOT_COUNTED' }, { material_id: 'M-2', status: 'UOM_MISMATCH' }];
    const outcome = computeExactCover(lines);
    expect(outcome.ok && outcome.result.i_exact).toEqual({ numerator: 0, denominator: 0, percent: null, insufficient_data: true });
    expect(outcome.ok && outcome.result.i_cover).toEqual({ numerator: 0, denominator: 2, percent: 0, insufficient_data: false });
  });

  it('hanya STOCK_MISSING (tidak ada item snapshot) → I-COVER tidak tersedia', () => {
    const outcome = computeExactCover([{ material_id: 'M-1', status: 'STOCK_MISSING' }]);
    expect(outcome.ok && outcome.result.i_cover.insufficient_data).toBe(true);
  });

  it('run kosong → kedua metrik tidak tersedia', () => {
    const outcome = computeExactCover([]);
    expect(outcome.ok && [outcome.result.i_exact.percent, outcome.result.i_cover.percent]).toEqual([null, null]);
  });

  it.each([
    ['material ganda dalam satu run (satu material per sisi per run)', [{ material_id: 'M-1', status: 'MATCHED' }, { material_id: 'M-1', status: 'DISCREPANCY' }]],
    ['status tidak dikenal', [{ material_id: 'M-1', status: 'VALID' }]],
    ['material kosong', [{ material_id: '', status: 'MATCHED' }]],
  ])('%s → seluruh run ditolak INCONSISTENT_RUN_LINE', (_label, lines) => {
    expect(computeExactCover(lines as MetricLineInput[]).ok).toBe(false);
  });
});

describe('SRS-32 InventoryMetricsService (fake)', () => {
  let runs: RunSummary[];
  let linesByRun: Map<string, readonly IVarLineInput[]>;
  let allowed: boolean;
  let failCatalog: boolean;
  let failLines: boolean;
  let logs: unknown[];

  const filter = (overrides: Partial<MetricsFilter> = {}): MetricsFilter => ({
    warehouse_id: WAREHOUSE, mode: 'UJI', rule_version: RULE, cutoff_ids: [runA.cutoff_id, runB.cutoff_id], ...overrides,
  });

  function service() {
    return new InventoryMetricsService({
      authorizer: { authorize: async () => allowed },
      catalog: { listRuns: async () => { if (failCatalog) throw new Error('PRIVATE_DRIVER_SENTINEL'); return runs; } },
      lines: {
        readLines: async (id) => {
          if (failLines) throw new Error('PRIVATE_DRIVER_SENTINEL');
          return linesByRun.get(id) ?? [];
        },
      },
      logger: { error: (entry) => { logs.push(entry); } },
    });
  }

  async function code(promise: Promise<unknown>) {
    try { await promise; return 'NONE'; } catch (error) { return error instanceof InventoryMetricsError ? error.code : 'OTHER'; }
  }

  beforeEach(() => {
    runs = [
      summary({ run_id: 'old-a', cutoff_id: runA.cutoff_id, commit_order: 1n }),
      summary({ run_id: runA.run_id, cutoff_id: runA.cutoff_id, commit_order: 2n }),
      summary({ run_id: runB.run_id, cutoff_id: runB.cutoff_id, commit_order: 1n }),
    ];
    linesByRun = new Map([[runA.run_id, runA.lines], [runB.run_id, runB.lines], ['old-a', [{ ...runA.lines[0] }]]]);
    allowed = true;
    failCatalog = false;
    failLines = false;
    logs = [];
  });

  it('per cutoff memakai latest COMMITTED; histori disertakan; I-VAR dan I-EXACT/I-COVER dari run itu', async () => {
    const result = await service().query(ACTOR, filter(), CORRELATION);
    const a = result.groups.find((group) => group.cutoff_id === runA.cutoff_id)!;
    expect(a.latest_run_id).toBe(runA.run_id);
    expect(a.history_run_ids).toEqual(['old-a', runA.run_id].sort());
    expect(a.i_var?.items.map((item) => [item.material_id, item.i_var]).length).toBe(5);
    expect([a.exact_cover?.i_exact.percent, a.exact_cover?.i_cover.percent]).toEqual([40, 62.5]);
    expect(result.groups).toHaveLength(2);
  });

  it('tidak ada run → kelompok kosong, bukan error (A-1)', async () => {
    runs = [];
    expect((await service().query(ACTOR, filter(), CORRELATION)).groups).toEqual([]);
  });

  it('kelompok dengan urutan commit ambigu ditampilkan tanpa angka', async () => {
    runs = [summary({ run_id: 'x', commit_order: 1n }), summary({ run_id: 'y', commit_order: 1n })];
    const [group] = (await service().query(ACTOR, filter(), CORRELATION)).groups;
    expect(group).toMatchObject({ status: 'AMBIGUOUS_ORDER', latest_run_id: null, i_var: null, exact_cover: null });
  });

  it('sumber gagal → METRICS_SOURCE_UNAVAILABLE, bukan angka nol (E-2); log aman', async () => {
    failCatalog = true;
    expect(await code(service().query(ACTOR, filter(), CORRELATION))).toBe('METRICS_SOURCE_UNAVAILABLE');
    failCatalog = false;
    failLines = true;
    expect(await code(service().query(ACTOR, filter(), CORRELATION))).toBe('METRICS_SOURCE_UNAVAILABLE');
    expect(logs.every((entry) => JSON.stringify(entry) === JSON.stringify({ code: 'METRICS_SOURCE_UNAVAILABLE', correlation_id: CORRELATION }))).toBe(true);
  });

  it('material ganda pada run latest → seluruh hasil ditolak METRICS_SOURCE_INCONSISTENT', async () => {
    linesByRun.set(runA.run_id, [...runA.lines, { ...runA.lines[0] }]);
    expect(await code(service().query(ACTOR, filter(), CORRELATION))).toBe('METRICS_SOURCE_INCONSISTENT');
  });

  it('catalog mengembalikan run di luar scope/filter → ditolak, tidak ikut dihitung', async () => {
    runs = [summary({ run_id: 'z', warehouse_id: '20000000-0000-4000-8000-000000000002' })];
    expect(await code(service().query(ACTOR, filter(), CORRELATION))).toBe('METRICS_SOURCE_INCONSISTENT');
  });

  it('izin tidak ada → FORBIDDEN tanpa membaca sumber', async () => {
    allowed = false;
    failCatalog = true;
    expect(await code(service().query(ACTOR, filter(), CORRELATION))).toBe('FORBIDDEN');
  });

  it.each([
    ['gudang bukan UUID', { warehouse_id: 'WH-01' }],
    ['cutoff kosong (periode belum didefinisikan)', { cutoff_ids: [] }],
    ['cutoff ganda', { cutoff_ids: [runA.cutoff_id, runA.cutoff_id] }],
    ['mode tidak sah', { mode: 'uji' as never }],
    ['rule_version kosong', { rule_version: '' }],
  ])('%s → BAD_REQUEST', async (_label, overrides) => {
    expect(await code(service().query(ACTOR, filter(overrides), CORRELATION))).toBe('BAD_REQUEST');
  });
});
