/**
 * Tes kontrak fixture daftar riwayat run rekonsiliasi SCR-13 (SRS-31, API-15). Data SIMULATED.
 *
 * Membuktikan tanpa database:
 * - body halaman cocok dengan respons 200 API-15 (DOC-09) dan `RunSummary`;
 * - query contoh sah menurut parameter API-15, dan query invalid memang melanggar parameter itu;
 * - pagination: gabungan halaman = seluruh run scope, tanpa duplikat, halaman terakhir cursor null;
 * - scope: run gudang lain tidak muncul; daftar tidak memuat penanda latest.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { ReconciliationRunListDto, ReconciliationRunListQueryDto } from '@siris/contracts';
import { doc09ResponseSchema, validateDoc09, validateInline } from './contract/doc09-schema.js';

const root = new URL('../../../../', import.meta.url);
const fixture = JSON.parse(readFileSync(new URL('database/fixtures/uji/reconciliation-history-screen.proposed-0.1.json', root), 'utf8'));

interface Parameter { name: string; in: string; required?: boolean; schema: Record<string, unknown> }

/** Parameter query API-15 dari OpenAPI DOC-09. */
function api15Parameters(): Parameter[] {
  const text = readFileSync(new URL('development-docs/09_API_SPECIFICATION.md', root), 'utf8');
  const openapi = JSON.parse(/```json\n([\s\S]*?)\n```/.exec(text)?.[1] ?? '{}');
  for (const methods of Object.values(openapi.paths as Record<string, Record<string, { 'x-endpoint-id'?: string; parameters?: Parameter[] }>>)) {
    for (const op of Object.values(methods)) if (op['x-endpoint-id'] === 'API-15') return op.parameters ?? [];
  }
  throw new Error('API-15 tidak ditemukan');
}

function queryErrors(query: Record<string, unknown>): string[] {
  const params = api15Parameters();
  const errors: string[] = [];
  for (const p of params) {
    if (!(p.name in query)) {
      if (p.required) errors.push(`${p.name}: wajib`);
      continue;
    }
    // `default` hanya anotasi OpenAPI, bukan aturan validasi; helper bersama sengaja menolaknya.
    const { default: _default, ...schema } = p.schema;
    errors.push(...validateInline(schema, query[p.name], p.name));
  }
  for (const name of Object.keys(query)) if (!params.some((p) => p.name === name)) errors.push(`${name}: tidak dikenal`);
  return errors;
}

const page1: ReconciliationRunListDto = fixture.screens.page_1.body;
const page2: ReconciliationRunListDto = fixture.screens.page_2.body;
const scope: ReconciliationRunListQueryDto = fixture.screens.page_1.query;
interface SourceRun { id: string; _scope: { warehouse_id: string; mode: string } }
const sourceRuns: SourceRun[] = fixture.source_runs.items;

describe('Label fixture riwayat', () => {
  it('berlabel SIMULATED, mode UJI, PROPOSED, tanpa ACTUAL', () => {
    expect(fixture.data_label).toBe('SIMULATED');
    expect(fixture.mode).toBe('UJI');
    expect(fixture.contract_status).toBe('PROPOSED');
    expect(JSON.stringify(fixture)).not.toContain('"ACTUAL"');
  });
});

describe('Kecocokan dengan DOC-09 API-15', () => {
  it.each(['page_1', 'page_2', 'empty'])('body %s cocok dengan respons 200 API-15', (name) => {
    expect(validateInline(doc09ResponseSchema('API-15'), fixture.screens[name].body)).toEqual([]);
    for (const item of fixture.screens[name].body.items) expect(validateDoc09('RunSummary', item)).toEqual([]);
  });

  it.each(['page_1', 'page_2', 'empty'])('query %s sah menurut parameter API-15', (name) => {
    expect(queryErrors(fixture.screens[name].query)).toEqual([]);
  });

  const invalid: { case: string; query: Record<string, unknown>; expected_error: { http_status: number } }[] = fixture.screens.invalid_queries;
  it.each(invalid.map((c) => [c.case, c] as const))('query invalid "%s" melanggar parameter dan diharapkan 400', (_label, c) => {
    expect(queryErrors(c.query).length).toBeGreaterThan(0);
    expect(c.expected_error.http_status).toBe(400);
  });

  it('item tidak memuat field internal _scope maupun penanda latest', () => {
    const text = JSON.stringify([page1, page2]);
    expect(text).not.toContain('_scope');
    expect(text).not.toMatch(/latest|is_current|commit_order/);
  });
});

describe('Pagination dan scope', () => {
  const expectedIds = sourceRuns.filter((r) => r._scope.warehouse_id === scope.warehouse_id && r._scope.mode === scope.mode).map((r) => r.id).sort();
  const pagedIds = [...page1.items, ...page2.items].map((i) => i.id);

  it('gabungan halaman sama dengan seluruh run pada scope, tanpa duplikat', () => {
    expect([...pagedIds].sort()).toEqual(expectedIds);
    expect(new Set(pagedIds).size).toBe(pagedIds.length);
  });

  it('jumlah item per halaman tidak melebihi limit; cursor berantai dan halaman terakhir null', () => {
    expect(page1.items.length).toBeLessThanOrEqual(scope.limit ?? 25);
    expect(page1.next_cursor).not.toBeNull();
    expect(fixture.screens.page_2.query.cursor).toBe(page1.next_cursor);
    expect(page2.next_cursor).toBeNull();
  });

  it('run gudang lain tidak muncul di halaman mana pun', () => {
    const otherScope = sourceRuns.filter((r) => r._scope.warehouse_id !== scope.warehouse_id).map((r) => r.id);
    expect(otherScope.length).toBeGreaterThan(0);
    for (const id of otherScope) expect(pagedIds).not.toContain(id);
  });

  it('scope tanpa run menghasilkan daftar kosong, bukan error', () => {
    expect(fixture.screens.empty.body).toEqual({ items: [], next_cursor: null });
  });

  it('akses ditolak dan sumber gagal memakai status error, bukan daftar kosong', () => {
    const statuses = fixture.screens.access_errors.map((c: { expected_error: { http_status: number } }) => c.expected_error.http_status);
    expect(statuses).toEqual([403, 500]);
  });
});
