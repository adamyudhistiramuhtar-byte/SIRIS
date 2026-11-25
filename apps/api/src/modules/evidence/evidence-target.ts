/**
 * Aturan target evidence (UC-11). Status: PROPOSED; hanya aturan murni.
 *
 * Keputusan PM teknis UJI (Adam, komentar Jira SRS-38 nomor 10153 butir 3, D-03):
 * evidence harus XOR, tepat satu `stock_snapshot_id` atau `count_session_id` sesuai sumber.
 * Kode INVALID_TARGET (422) berasal dari katalog DOC-08.
 *
 * Di luar cakupan: upload file, tabel evidence, nomor migrasi (belum direservasi), kewenangan
 * dan retensi (OD-08).
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type EvidenceTarget =
  | { kind: 'STOCK_SNAPSHOT'; stock_snapshot_id: string }
  | { kind: 'COUNT_SESSION'; count_session_id: string };

export type EvidenceTargetResult = { ok: true; target: EvidenceTarget } | { ok: false; code: 'INVALID_TARGET' };

/** Menerima objek request; null atau field yang tidak ada dianggap tidak diisi. */
export function resolveEvidenceTarget(input: unknown): EvidenceTargetResult {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) return { ok: false, code: 'INVALID_TARGET' };
  const { stock_snapshot_id: snapshot, count_session_id: session } = input as Record<string, unknown>;
  const hasSnapshot = snapshot !== undefined && snapshot !== null;
  const hasSession = session !== undefined && session !== null;
  if (hasSnapshot === hasSession) return { ok: false, code: 'INVALID_TARGET' };
  if (hasSnapshot) {
    return typeof snapshot === 'string' && UUID.test(snapshot)
      ? { ok: true, target: { kind: 'STOCK_SNAPSHOT', stock_snapshot_id: snapshot } }
      : { ok: false, code: 'INVALID_TARGET' };
  }
  return typeof session === 'string' && UUID.test(session)
    ? { ok: true, target: { kind: 'COUNT_SESSION', count_session_id: session } }
    : { ok: false, code: 'INVALID_TARGET' };
}
