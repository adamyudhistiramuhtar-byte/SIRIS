import { describe, expect, it } from 'vitest';
import { checkEvidenceUpload, MAX_EVIDENCE_BYTES, type EvidenceActor } from '../modules/evidence/evidence-policy.js';

const actor: EvidenceActor = { id: 'uji-actor', role: 'WAREHOUSE', warehouse_ids: ['gudang-1'] };
const target = { id: 'uji-target', warehouse_id: 'gudang-1', mode: 'UJI' as const };
const pdf = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31]);

describe('Kebijakan awal evidence UJI', () => {
  it.each([
    ['application/pdf', pdf],
    ['image/jpeg', new Uint8Array([0xff, 0xd8, 0xff, 0x00])],
    ['image/png', new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])],
  ])('menerima signature %s pada target berizin', (mime, bytes) => {
    expect(checkEvidenceUpload(actor, target, mime, bytes, true)).toEqual({ ok: true, mime });
  });

  it('menolak MIME yang tidak sesuai signature dan konten kosong', () => {
    expect(checkEvidenceUpload(actor, target, 'image/png', pdf, true)).toEqual({ ok: false, code: 'INVALID_FILE' });
    expect(checkEvidenceUpload(actor, target, 'application/pdf', new Uint8Array(), true)).toEqual({ ok: false, code: 'INVALID_FILE' });
  });

  it('menegakkan batas 5 MiB termasuk batas tepat', () => {
    const exact = new Uint8Array(MAX_EVIDENCE_BYTES);
    exact.set(pdf);
    expect(checkEvidenceUpload(actor, target, 'application/pdf', exact, true).ok).toBe(true);
    expect(checkEvidenceUpload(actor, target, 'application/pdf', new Uint8Array(MAX_EVIDENCE_BYTES + 1), true))
      .toEqual({ ok: false, code: 'LIMIT_EXCEEDED' });
  });

  it('menolak upload bila kebijakan backend belum mengizinkan mutasi', () => {
    expect(checkEvidenceUpload(actor, target, 'application/pdf', pdf, false)).toEqual({ ok: false, code: 'ACCESS_DENIED' });
  });

  it('menolak target hilang, gudang lain, ACTUAL, dan Management', () => {
    expect(checkEvidenceUpload(actor, null, 'application/pdf', pdf, true)).toEqual({ ok: false, code: 'INVALID_TARGET' });
    expect(checkEvidenceUpload(actor, { ...target, warehouse_id: 'gudang-2' }, 'application/pdf', pdf, true))
      .toEqual({ ok: false, code: 'ACCESS_DENIED' });
    expect(checkEvidenceUpload(actor, { ...target, mode: 'ACTUAL' }, 'application/pdf', pdf, true))
      .toEqual({ ok: false, code: 'ACCESS_DENIED' });
    expect(checkEvidenceUpload({ ...actor, role: 'MANAGEMENT' }, target, 'application/pdf', pdf, true))
      .toEqual({ ok: false, code: 'ACCESS_DENIED' });
  });
});
