/**
 * Pemilihan latest run untuk metrik persediaan (SRS-32, UI-14). Fungsi murni. Status: PROPOSED.
 *
 * Keputusan PM teknis UJI (Adam, komentar Jira SRS-38 nomor 10153 butir 4, D-06):
 * latest hanya dipilih dari run COMMITTED; created_at/id tidak boleh mendahului keberhasilan
 * commit; histori tetap disimpan.
 *
 * Yang sengaja TIDAK ditebak:
 * - tie-break latest (OD-06 masih OPEN). Fungsi ini memakai `commit_order` yang wajib
 *   disediakan adapter dan mencerminkan urutan commit; bila tidak ada atau seri, kelompok
 *   ditandai AMBIGUOUS_ORDER tanpa memilih, dan tidak jatuh ke created_at atau id;
 * - sumber `commit_order` (lihat pertanyaan di development-docs/KONTRAK_METRIK_PERSEDIAAN_SRS-32.md).
 *
 * Kelompok = (warehouse_id, mode, cutoff_id, rule_version), sesuai design.md UI-14
 * "latest committed run untuk cutoff + rule-version sama" dalam scope gudang/mode.
 */
export interface RunSummary {
  run_id: string;
  warehouse_id: string;
  mode: 'ACTUAL' | 'UJI';
  cutoff_id: string;
  rule_version: string;
  /** Adapter memetakan run yang terlihat setelah COMMIT menjadi 'COMMITTED'. */
  state: string;
  /** Urutan commit dalam kelompok; null bila adapter tidak dapat menjaminnya. */
  commit_order: bigint | null;
}

export interface LatestRunGroup {
  warehouse_id: string;
  mode: 'ACTUAL' | 'UJI';
  cutoff_id: string;
  rule_version: string;
  status: 'OK' | 'AMBIGUOUS_ORDER';
  /** null bila status AMBIGUOUS_ORDER. */
  latest_run_id: string | null;
  /** Seluruh run COMMITTED kelompok ini, urut run_id; histori tidak dihapus atau ditimpa. */
  history_run_ids: string[];
}

export interface LatestRunSelection {
  groups: LatestRunGroup[];
  /** Run yang tidak COMMITTED; tidak pernah dipilih. */
  ignored_run_ids: string[];
}

const compare = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

export function selectLatestCommitted(runs: readonly RunSummary[]): LatestRunSelection {
  const groups = new Map<string, RunSummary[]>();
  const ignored: string[] = [];
  for (const run of runs) {
    if (run.state !== 'COMMITTED') {
      ignored.push(run.run_id);
      continue;
    }
    const key = JSON.stringify([run.warehouse_id, run.mode, run.cutoff_id, run.rule_version]);
    const list = groups.get(key) ?? [];
    list.push(run);
    groups.set(key, list);
  }

  const result: LatestRunGroup[] = [];
  for (const members of groups.values()) {
    const [first] = members;
    const ordered = members.every((run) => typeof run.commit_order === 'bigint');
    let latest: RunSummary | null = null;
    let ambiguous = !ordered;
    if (ordered) {
      for (const run of members) {
        if (latest === null || (run.commit_order as bigint) > (latest.commit_order as bigint)) {
          latest = run;
          ambiguous = false;
        } else if (run.commit_order === latest.commit_order) {
          ambiguous = true;
        }
      }
    }
    result.push({
      warehouse_id: first.warehouse_id,
      mode: first.mode,
      cutoff_id: first.cutoff_id,
      rule_version: first.rule_version,
      status: ambiguous ? 'AMBIGUOUS_ORDER' : 'OK',
      latest_run_id: ambiguous ? null : (latest as RunSummary).run_id,
      history_run_ids: members.map((run) => run.run_id).sort(compare),
    });
  }
  result.sort((a, b) => compare(a.warehouse_id, b.warehouse_id) || compare(a.mode, b.mode) ||
    compare(a.cutoff_id, b.cutoff_id) || compare(a.rule_version, b.rule_version));
  return { groups: result, ignored_run_ids: ignored.sort(compare) };
}
