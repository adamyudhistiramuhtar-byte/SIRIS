import type { ImportContext, ReferenceImportAdapter } from './reference-import';

/** Fixture sintetis untuk demo lokal; bukan penyimpanan transaksi atau API. */
export function createUjiSimulator(): ReferenceImportAdapter {
  function requireUji(context: ImportContext) {
    if (context.mode !== 'UJI') throw new Error('Simulator hanya untuk UJI');
  }
  return {
    async upload(_file, context) { requireUji(context); return { batchId: 'UJI-SIMULASI' }; },
    async validate(batchId, context) {
      requireUji(context);
      return { batchId, fingerprint: 'UJI-SIMULASI', warnings: ['Simulasi saja; isi file belum divalidasi server.'] };
    },
    async commit(preview, context) { requireUji(context); return { batchId: preview.batchId, state: 'COMMITTED' }; },
  };
}
