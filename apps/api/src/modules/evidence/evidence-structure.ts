import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';
import { MAX_EVIDENCE_BYTES, type EvidenceMime } from './evidence-policy.js';

const MAX_IMAGE_PIXELS = 16_000_000;

/** Pemeriksaan struktur UJI; pemanggil tetap wajib melakukan otorisasi dan pembatasan stream. */
export async function validateEvidenceStructure(content: Uint8Array, mime: EvidenceMime): Promise<boolean> {
  if (content.byteLength === 0 || content.byteLength > MAX_EVIDENCE_BYTES) return false;
  try {
    if (mime === 'application/pdf') {
      if (Buffer.from(content.subarray(0, 5)).toString('ascii') !== '%PDF-') return false;
      const document = await PDFDocument.load(content, { throwOnInvalidObject: true, updateMetadata: false });
      return document.getPageCount() > 0;
    }
    const image = sharp(content, { failOn: 'warning', limitInputPixels: MAX_IMAGE_PIXELS });
    const metadata = await image.metadata();
    const format = mime === 'image/jpeg' ? 'jpeg' : 'png';
    if (metadata.format !== format || !metadata.width || !metadata.height) return false;
    await image.raw().toBuffer();
    return true;
  } catch {
    return false;
  }
}
