/** Kebijakan awal evidence UJI. Otorisasi dan target final harus dibuktikan oleh backend. */
export const MAX_EVIDENCE_BYTES = 5_242_880;
export type EvidenceMime = 'application/pdf' | 'image/jpeg' | 'image/png';
export type EvidenceRole = 'PURCHASING' | 'WAREHOUSE' | 'PRODUCTION' | 'MANAGEMENT';

export interface EvidenceTarget {
  id: string;
  warehouse_id: string;
  mode: 'UJI' | 'ACTUAL';
}

export interface EvidenceActor {
  id: string;
  role: EvidenceRole;
  warehouse_ids: readonly string[];
}

export type EvidenceDecision =
  | { ok: true; mime: EvidenceMime }
  | { ok: false; code: 'ACCESS_DENIED' | 'INVALID_TARGET' | 'LIMIT_EXCEEDED' | 'INVALID_FILE' };

const signatures: ReadonlyArray<{ mime: EvidenceMime; bytes: readonly number[] }> = [
  { mime: 'application/pdf', bytes: [0x25, 0x50, 0x44, 0x46, 0x2d] },
  { mime: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
  { mime: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
];

/** Penerima wajib memberikan target final yang diperoleh dari repository berotorisasi. */
export function checkEvidenceUpload(
  actor: EvidenceActor,
  target: EvidenceTarget | null,
  declaredMime: string,
  content: Uint8Array,
  uploadAuthorized: boolean,
): EvidenceDecision {
  if (!target || !target.id || !target.warehouse_id) return { ok: false, code: 'INVALID_TARGET' };
  if (!uploadAuthorized || actor.role !== 'WAREHOUSE' || target.mode !== 'UJI' || !actor.warehouse_ids.includes(target.warehouse_id)) {
    return { ok: false, code: 'ACCESS_DENIED' };
  }
  if (content.byteLength > MAX_EVIDENCE_BYTES) return { ok: false, code: 'LIMIT_EXCEEDED' };
  const signature = signatures.find((entry) =>
    entry.mime === declaredMime && entry.bytes.every((byte, index) => content[index] === byte),
  );
  if (!signature) return { ok: false, code: 'INVALID_FILE' };
  return { ok: true, mime: signature.mime };
}
