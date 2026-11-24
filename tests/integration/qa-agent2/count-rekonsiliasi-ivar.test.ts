import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { toReconciliationCountLine, type CountLineRecord } from '../../../apps/api/src/modules/count/count-contract.js';
import { reconcile, type ReconciliationContext } from '../../../apps/api/src/modules/reconciliation/reconciliation-engine.js';
import { computeIVar } from '../../../apps/api/src/modules/inventory-metrics/i-var.js';

it('meneruskan nol terhitung dan count kosong dari record melalui rekonsiliasi sampai I-VAR', () => {
  const count: { session: ReconciliationContext; lines: { material_code: string; record: CountLineRecord }[] } = JSON.parse(
    readFileSync(new URL('../../../apps/api/src/tests/fixtures/count-records.uji.proposed-0.1.json', import.meta.url), 'utf8'),
  );
  const stock: {
    metadata: ReconciliationContext;
    rows: { row_number: number; normalized: { material_code: string; uom: string; system_quantity: string } }[];
  } = JSON.parse(readFileSync(new URL('../../../database/fixtures/uji/stock.proposed-0.1.json', import.meta.url), 'utf8'));

  const ids = new Map(count.lines.map(({ material_code, record }) => [material_code, record.material_id]));
  const balance = stock.rows.map(({ row_number, normalized }) => {
    const material_id = ids.get(normalized.material_code);
    if (!material_id) throw new Error('Kode saldo fixture UJI belum dipetakan');
    return { id: 'saldo-uji-' + row_number, material_id, uom: normalized.uom, system_quantity: normalized.system_quantity };
  });
  const result = reconcile({
    stock: { context: stock.metadata, lines: balance },
    count: { context: count.session, lines: count.lines.map(({ record }) => toReconciliationCountLine(record)) },
  });
  if (!result.ok) throw new Error(result.code);

  const counted = '10000000-0000-4000-8000-000000000001';
  const uncounted = '10000000-0000-4000-8000-000000000002';
  expect(result.lines).toMatchObject([
    { material_id: counted, stock_line_id: 'saldo-uji-1', count_line_id: '50000000-0000-4000-8000-000000000001', status: 'DISCREPANCY', variance: '-10.000000' },
    { material_id: uncounted, stock_line_id: 'saldo-uji-2', count_line_id: '50000000-0000-4000-8000-000000000002', status: 'NOT_COUNTED', variance: null },
  ]);
  const metrics = computeIVar([{
    run_id: 'run-uji-qa', cutoff_id: count.session.cutoff_id, rule_version: result.rule_version, lines: result.lines,
  }]);
  expect(metrics).toMatchObject({
    ok: true, runs: [{
      items: [{ material_id: counted, i_var: '-10.000000' }],
      excluded: [{ material_id: uncounted, status: 'NOT_COUNTED' }],
    }],
  });
});
