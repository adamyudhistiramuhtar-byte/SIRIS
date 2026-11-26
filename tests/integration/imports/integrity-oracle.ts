/**
 * Oracle integritas impor SRS-59 (DOC-13 PVT-01/02/03/04/11/12/15/17/22). Status: PROPOSED.
 *
 * Oracle ini hanya MENILAI observasi yang dikumpulkan tes integrasi; ia tidak menjalankan
 * impor, tidak memanggil modul domain, dan tidak bergantung pada SRS-17/18/19/26/54.
 * Penilaian mengikuti "Expected result" DOC-13 dan kode katalog DOC-08.
 *
 * Verdict:
 * - PASS: semua syarat expected result terpenuhi pada observasi.
 * - FAIL: minimal satu syarat dilanggar; `reasons` menjelaskan yang dilanggar.
 * Oracle tidak pernah menghasilkan PASS untuk kasus yang tidak dijalankan: status NOT RUN dan
 * BLOCKED dicatat di matriks kasus, bukan di sini.
 */

/** Hitungan baris per tabel domain/lineage sebelum atau sesudah langkah uji. */
export type TableCounts = Readonly<Record<string, number>>;

export interface ApiOutcome {
  http_status: number;
  /** Kode error envelope; null untuk respons sukses. */
  error_code: string | null;
  /** Body respons mentah, dipakai untuk memeriksa kebocoran data lintas scope. */
  body: unknown;
}

export interface Verdict {
  verdict: 'PASS' | 'FAIL';
  reasons: string[];
}

function verdict(reasons: string[]): Verdict {
  return { verdict: reasons.length === 0 ? 'PASS' : 'FAIL', reasons };
}

/** Tabel yang bertambah antara dua snapshot; tabel yang hilang dari snapshot dianggap 0. */
export function grownTables(before: TableCounts, after: TableCounts): string[] {
  const names = new Set([...Object.keys(before), ...Object.keys(after)]);
  return [...names].filter((name) => (after[name] ?? 0) > (before[name] ?? 0)).sort();
}

function noDomainGrowth(before: TableCounts, after: TableCounts, reasons: string[], label = 'domain'): void {
  const grown = grownTables(before, after);
  if (grown.length > 0) reasons.push(`${label} bertambah: ${grown.join(', ')}`);
}

function expectError(outcome: ApiOutcome, allowed: readonly string[], reasons: string[]): void {
  if (outcome.error_code === null || !allowed.includes(outcome.error_code)) {
    reasons.push(`kode error ${outcome.error_code ?? 'tidak ada'}, diharapkan salah satu ${allowed.join('/')}`);
  }
  if (outcome.http_status < 400) reasons.push(`HTTP ${outcome.http_status} bukan penolakan`);
}

/**
 * PVT-01 File invalid / PVT-02 Missing reference (dan negative case lain per jenis impor):
 * validasi menolak dengan kode yang diharapkan, preview tidak siap commit, percobaan commit
 * ditolak, dan tidak ada domain bertambah.
 */
export function judgeRejectedImport(obs: {
  validation: ApiOutcome;
  preview_can_commit: boolean | null;
  commit_attempt: ApiOutcome | null;
  expected_codes: readonly string[];
  domain_before: TableCounts;
  domain_after: TableCounts;
}): Verdict {
  const reasons: string[] = [];
  expectError(obs.validation, obs.expected_codes, reasons);
  if (obs.preview_can_commit === true) reasons.push('preview siap commit padahal ada error');
  if (obs.commit_attempt && obs.commit_attempt.http_status < 400) reasons.push('commit berhasil padahal file invalid');
  noDomainGrowth(obs.domain_before, obs.domain_after, reasons);
  return verdict(reasons);
}

/** PVT-03 Duplicate import: batch B identik tidak menambah domain, hasil lama dikenali, outcome diaudit. */
export function judgeDuplicateImport(obs: {
  first_result_ref: string | null;
  second: ApiOutcome & { result_ref: string | null };
  domain_after_first: TableCounts;
  domain_after_second: TableCounts;
  audit_outcomes_for_second: readonly string[];
}): Verdict {
  const reasons: string[] = [];
  noDomainGrowth(obs.domain_after_first, obs.domain_after_second, reasons);
  const recognized = obs.second.result_ref !== null && obs.second.result_ref === obs.first_result_ref;
  const rejectedAsDuplicate = obs.second.error_code === 'DUPLICATE_SOURCE';
  if (!recognized && !rejectedAsDuplicate) reasons.push('batch identik tidak dikenali sebagai hasil lama');
  if (obs.audit_outcomes_for_second.length === 0) reasons.push('outcome batch kedua tidak diaudit');
  return verdict(reasons);
}

/**
 * PVT-04 Expired preview. `at_ms - preview_created_ms` adalah umur preview saat commit; TTL usulan
 * 30 menit masih PROPOSED. Tepat pada TTL wajib PREVIEW_EXPIRED tanpa commit.
 */
export function judgePreviewExpiry(obs: {
  ttl_ms: number;
  attempts: readonly { age_ms: number; outcome: ApiOutcome; domain_grew: boolean }[];
}): Verdict {
  const reasons: string[] = [];
  for (const attempt of obs.attempts) {
    const expired = attempt.age_ms >= obs.ttl_ms;
    if (expired) {
      if (attempt.outcome.error_code !== 'PREVIEW_EXPIRED') reasons.push(`umur ${attempt.age_ms}ms: diharapkan PREVIEW_EXPIRED`);
      if (attempt.domain_grew) reasons.push(`umur ${attempt.age_ms}ms: domain bertambah setelah expiry`);
    } else if (attempt.outcome.error_code === 'PREVIEW_EXPIRED') {
      reasons.push(`umur ${attempt.age_ms}ms: PREVIEW_EXPIRED sebelum TTL`);
    }
  }
  if (!obs.attempts.some((a) => a.age_ms === obs.ttl_ms)) reasons.push('tidak ada percobaan tepat pada batas TTL');
  return verdict(reasons);
}

/** PVT-11 Rollback: domain/lineage tidak bertambah, batch tidak berubah, ada FAILURE, tanpa SUCCESS palsu. */
export function judgeRollback(obs: {
  outcome: ApiOutcome;
  domain_before: TableCounts;
  domain_after: TableCounts;
  batch_state_before: string;
  batch_state_after: string;
  audit_outcomes: readonly string[];
  db_recovered: boolean;
}): Verdict {
  const reasons: string[] = [];
  if (obs.outcome.http_status < 400) reasons.push('commit dengan fault dilaporkan sukses');
  noDomainGrowth(obs.domain_before, obs.domain_after, reasons, 'domain/lineage');
  if (obs.batch_state_after !== obs.batch_state_before) reasons.push(`state batch berubah ${obs.batch_state_before}→${obs.batch_state_after}`);
  if (obs.audit_outcomes.includes('SUCCESS')) reasons.push('audit SUCCESS palsu');
  if (obs.db_recovered && !obs.audit_outcomes.includes('FAILURE')) reasons.push('audit FAILURE tidak tercatat padahal DB pulih');
  return verdict(reasons);
}

/** PVT-12 Idempotency dan konkurensi. */
export function judgeIdempotency(obs: {
  concurrent: readonly (ApiOutcome & { result_ref: string | null })[];
  retry_after_lost_response: ApiOutcome & { result_ref: string | null };
  changed_payload_same_key: ApiOutcome;
  domain_writes_total: number;
}): Verdict {
  const reasons: string[] = [];
  const refs = new Set(obs.concurrent.map((r) => r.result_ref).filter((r) => r !== null));
  if (refs.size !== 1) reasons.push(`request konkuren identik menghasilkan ${refs.size} hasil`);
  const [ref] = [...refs];
  if (obs.retry_after_lost_response.result_ref !== ref) reasons.push('retry tidak menerima ID hasil yang sama');
  if (obs.changed_payload_same_key.http_status !== 409 || obs.changed_payload_same_key.error_code !== 'IDEMPOTENCY_CONFLICT') {
    reasons.push('payload berubah dengan key sama bukan 409 IDEMPOTENCY_CONFLICT');
  }
  if (obs.domain_writes_total !== 1) reasons.push(`penulisan domain ${obs.domain_writes_total} kali, diharapkan 1`);
  return verdict(reasons);
}

/** PVT-15 Preview metadata tampering: fingerprint lama setelah metadata diubah ditolak, tanpa commit. */
export function judgeTampering(obs: { outcome: ApiOutcome; domain_before: TableCounts; domain_after: TableCounts }): Verdict {
  const reasons: string[] = [];
  expectError(obs.outcome, ['PREVIEW_CHANGED', 'WAREHOUSE_MISMATCH', 'MODE_MISMATCH', 'CUTOFF_MISMATCH', 'FORBIDDEN'], reasons);
  noDomainGrowth(obs.domain_before, obs.domain_after, reasons);
  return verdict(reasons);
}

/** PVT-17 QTY AKHIR tanpa double counting. */
export function judgeNoDoubleCounting(obs: {
  qty_akhir: string;
  support_movement_total: string;
  stored_system_quantity: string | null;
  reconciliation: { status: string; variance: string | null; system_quantity: string | null };
  support_rows_stored_separately: boolean | null;
}): Verdict {
  const reasons: string[] = [];
  const eq = (a: string | null, b: string) => a !== null && Number(a) === Number(b);
  if (obs.stored_system_quantity !== null && !eq(obs.stored_system_quantity, obs.qty_akhir)) {
    reasons.push(`system_quantity tersimpan ${obs.stored_system_quantity}, diharapkan ${obs.qty_akhir}`);
  }
  if (!eq(obs.reconciliation.system_quantity, obs.qty_akhir)) {
    reasons.push(`system_quantity rekonsiliasi ${obs.reconciliation.system_quantity}, diharapkan ${obs.qty_akhir}`);
  }
  if (eq(obs.reconciliation.system_quantity, String(Number(obs.qty_akhir) + Number(obs.support_movement_total)))) {
    reasons.push('movement dukungan ikut dijumlahkan ke saldo (double counting)');
  }
  if (obs.reconciliation.status !== 'MATCHED' || !eq(obs.reconciliation.variance, '0')) {
    reasons.push(`rekonsiliasi ${obs.reconciliation.status}/${obs.reconciliation.variance}, diharapkan MATCHED/0`);
  }
  if (obs.support_rows_stored_separately === false) reasons.push('dukungan tidak tersimpan terpisah');
  return verdict(reasons);
}

/** PVT-22 Warehouse scope: akses lintas izin ditolak/disembunyikan dan tidak ada data B di respons. */
export function judgeWarehouseScope(obs: {
  attempts: readonly { label: string; outcome: ApiOutcome }[];
  forbidden_markers: readonly string[];
  domain_before: TableCounts;
  domain_after: TableCounts;
}): Verdict {
  const reasons: string[] = [];
  for (const attempt of obs.attempts) {
    if (![403, 404].includes(attempt.outcome.http_status)) reasons.push(`${attempt.label}: HTTP ${attempt.outcome.http_status}, diharapkan 403/404`);
    const text = JSON.stringify(attempt.outcome.body ?? null);
    for (const marker of obs.forbidden_markers) {
      if (text.includes(marker)) reasons.push(`${attempt.label}: data scope B bocor (${marker})`);
    }
  }
  noDomainGrowth(obs.domain_before, obs.domain_after, reasons);
  return verdict(reasons);
}
