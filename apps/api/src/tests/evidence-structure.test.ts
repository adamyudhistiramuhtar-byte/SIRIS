import { describe, expect, it } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';
import { validateEvidenceStructure } from '../modules/evidence/evidence-structure.js';
import { MAX_EVIDENCE_BYTES } from '../modules/evidence/evidence-policy.js';

describe('Validasi struktur evidence sintetis', () => {
  it('menerima PDF dengan halaman dan menolak signature palsu atau terpotong', async () => {
    const document = await PDFDocument.create();
    document.addPage([72, 72]);
    const bytes = await document.save();
    expect(await validateEvidenceStructure(bytes, 'application/pdf')).toBe(true);
    expect(await validateEvidenceStructure(Buffer.from('%PDF-1.7\nrusak'), 'application/pdf')).toBe(false);
    expect(await validateEvidenceStructure(bytes.subarray(0, 16), 'application/pdf')).toBe(false);
  });

  it.each(['jpeg', 'png'] as const)('memeriksa decode %s dan menolak data terpotong', async (format) => {
    const input = sharp({ create: { width: 2, height: 2, channels: 3, background: '#abcabc' } });
    const bytes = format === 'jpeg' ? await input.jpeg().toBuffer() : await input.png().toBuffer();
    const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    expect(await validateEvidenceStructure(bytes, mime)).toBe(true);
    expect(await validateEvidenceStructure(bytes.subarray(0, Math.floor(bytes.length / 2)), mime)).toBe(false);
    expect(await validateEvidenceStructure(bytes, format === 'jpeg' ? 'image/png' : 'image/jpeg')).toBe(false);
  });

  it('menolak input kosong dan yang melewati batas sebelum parsing', async () => {
    expect(await validateEvidenceStructure(new Uint8Array(), 'application/pdf')).toBe(false);
    expect(await validateEvidenceStructure(new Uint8Array(MAX_EVIDENCE_BYTES + 1), 'image/png')).toBe(false);
  });
});

it('menolak dimensi gambar yang melewati batas pixel UJI', async () => {
  const bytes = await sharp({ create: { width: 4001, height: 4000, channels: 3, background: '#fff' } }).png().toBuffer();
  expect(bytes.byteLength).toBeLessThan(MAX_EVIDENCE_BYTES);
  expect(await validateEvidenceStructure(bytes, 'image/png')).toBe(false);
});
