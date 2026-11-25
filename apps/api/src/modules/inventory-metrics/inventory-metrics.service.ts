/**
 * Service baca metrik persediaan SRS-32 (API-16) di atas port yang disuntik. Status: PROPOSED,
 * sebagian. Belum terhubung ke PostgreSQL, route, atau sesi nyata.
 *
 * Alur (N1–N5 SRS-32): validasi filter → otorisasi scope → daftar run → latest COMMITTED per
 * kelompok → baca lines latest → I-VAR (#37) + I-EXACT/I-COVER → hasil per kelompok.
 *
 * - Filter memakai daftar cutoff_id eksplisit; definisi "periode" belum ditemukan.
 * - Hasil kosong dikembalikan kosong, bukan error (A-1).
 * - Sumber gagal → error, bukan angka nol (E-2). Data tidak konsisten → seluruh hasil ditolak.
 * - I-REPEAT tidak dihitung (definisi periode tidak ditemukan).
 * Log hanya menerima { code, correlation_id }. Objek error tidak pernah dicetak.
 */
import { computeExactCover, type ExactCoverResult } from './exact-cover.js';
import { computeIVar, type IVarLineInput, type IVarRunResult } from './i-var.js';
import { selectLatestCommitted, type RunSummary } from './latest-run.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** BAD_REQUEST/FORBIDDEN mengikuti AppError; dua kode lain PLACEHOLDER (belum ada di katalog DOC-08). */
export type InventoryMetricsErrorCode = 'BAD_REQUEST' | 'FORBIDDEN' | 'METRICS_SOURCE_UNAVAILABLE' | 'METRICS_SOURCE_INCONSISTENT';

export class InventoryMetricsError extends Error {
  constructor(readonly code: InventoryMetricsErrorCode) {
    super(code);
    this.name = 'InventoryMetricsError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export interface MetricsActor {
  actor_id: string;
  role: string;
  warehouse_ids: readonly string[];
}

export interface MetricsFilter {
  warehouse_id: string;
  mode: 'ACTUAL' | 'UJI';
  rule_version: string;
  cutoff_ids: readonly string[];
}

export interface MetricsAuthorizer {
  authorize(actor: MetricsActor, scope: { warehouse_id: string; mode: 'ACTUAL' | 'UJI' }): Promise<boolean>;
}

export interface RunCatalog {
  /** Run pada scope, rule_version, dan cutoff yang diminta; difilter sebelum paging. */
  listRuns(filter: MetricsFilter): Promise<readonly RunSummary[]>;
}

export interface RunLineReader {
  readLines(runId: string): Promise<readonly IVarLineInput[]>;
}

export interface SafeMetricsLogger {
  error(entry: { code: string; correlation_id: string }): void;
}

export interface MetricsGroupResult {
  cutoff_id: string;
  rule_version: string;
  status: 'OK' | 'AMBIGUOUS_ORDER';
  latest_run_id: string | null;
  history_run_ids: string[];
  i_var: IVarRunResult | null;
  exact_cover: ExactCoverResult | null;
}

export interface MetricsResult {
  warehouse_id: string;
  mode: 'ACTUAL' | 'UJI';
  groups: MetricsGroupResult[];
}

function assertFilter(filter: MetricsFilter): void {
  const ok = typeof filter === 'object' && filter !== null &&
    typeof filter.warehouse_id === 'string' && UUID.test(filter.warehouse_id) &&
    (filter.mode === 'UJI' || filter.mode === 'ACTUAL') &&
    typeof filter.rule_version === 'string' && filter.rule_version.length > 0 &&
    Array.isArray(filter.cutoff_ids) && filter.cutoff_ids.length > 0 &&
    filter.cutoff_ids.every((id) => typeof id === 'string' && UUID.test(id)) &&
    new Set(filter.cutoff_ids).size === filter.cutoff_ids.length;
  if (!ok) throw new InventoryMetricsError('BAD_REQUEST');
}

export class InventoryMetricsService {
  constructor(private readonly deps: {
    authorizer: MetricsAuthorizer;
    catalog: RunCatalog;
    lines: RunLineReader;
    logger: SafeMetricsLogger;
  }) {}

  async query(actor: MetricsActor, filter: MetricsFilter, correlationId: string): Promise<MetricsResult> {
    assertFilter(filter);
    if (typeof correlationId !== 'string' || !UUID.test(correlationId)) throw new InventoryMetricsError('BAD_REQUEST');
    if (!(await this.deps.authorizer.authorize(actor, { warehouse_id: filter.warehouse_id, mode: filter.mode }))) {
      throw new InventoryMetricsError('FORBIDDEN');
    }

    let runs: readonly RunSummary[];
    try {
      runs = await this.deps.catalog.listRuns(filter);
    } catch {
      this.deps.logger.error({ code: 'METRICS_SOURCE_UNAVAILABLE', correlation_id: correlationId });
      throw new InventoryMetricsError('METRICS_SOURCE_UNAVAILABLE');
    }
    // Pertahanan: hanya run pada scope dan filter yang diminta yang boleh ikut.
    const wanted = new Set(filter.cutoff_ids);
    if (runs.some((run) => run.warehouse_id !== filter.warehouse_id || run.mode !== filter.mode ||
      run.rule_version !== filter.rule_version || !wanted.has(run.cutoff_id))) {
      this.deps.logger.error({ code: 'METRICS_SOURCE_INCONSISTENT', correlation_id: correlationId });
      throw new InventoryMetricsError('METRICS_SOURCE_INCONSISTENT');
    }

    const selection = selectLatestCommitted(runs);
    const groups: MetricsGroupResult[] = [];
    for (const group of selection.groups) {
      const base = {
        cutoff_id: group.cutoff_id,
        rule_version: group.rule_version,
        status: group.status,
        latest_run_id: group.latest_run_id,
        history_run_ids: group.history_run_ids,
      };
      if (group.latest_run_id === null) {
        groups.push({ ...base, i_var: null, exact_cover: null });
        continue;
      }
      let lines: readonly IVarLineInput[];
      try {
        lines = await this.deps.lines.readLines(group.latest_run_id);
      } catch {
        this.deps.logger.error({ code: 'METRICS_SOURCE_UNAVAILABLE', correlation_id: correlationId });
        throw new InventoryMetricsError('METRICS_SOURCE_UNAVAILABLE');
      }
      const iVar = computeIVar([{ run_id: group.latest_run_id, cutoff_id: group.cutoff_id, rule_version: group.rule_version, lines }]);
      const exactCover = computeExactCover(lines);
      if (!iVar.ok || !exactCover.ok) {
        this.deps.logger.error({ code: 'METRICS_SOURCE_INCONSISTENT', correlation_id: correlationId });
        throw new InventoryMetricsError('METRICS_SOURCE_INCONSISTENT');
      }
      groups.push({ ...base, i_var: iVar.runs[0], exact_cover: exactCover.result });
    }
    return { warehouse_id: filter.warehouse_id, mode: filter.mode, groups };
  }
}
