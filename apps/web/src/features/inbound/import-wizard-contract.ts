import type { ImportContext, ImportState } from './reference-import';

/** Status tambahan hanya untuk presentasi; receipt pembatalan tetap berasal dari API. */
export type ImportWizardState = ImportState
  | { phase: 'cancelling'; batchId: string }
  | { phase: 'cancelled'; batchId: string }
  | { phase: 'cancel-unknown'; batchId: string };

/** Usulan boundary presentasi untuk review SRS-53; bukan kontrak domain final. */
export interface ImportWizardProps {
  context: ImportContext | null;
  // Preview membawa batchId, fingerprint, warnings dan expiresAt; unknown membawa idempotencyKey.
  state: ImportWizardState;
  file: File | null;
  uploadProgress: number | null;
}

/** Aksi UI; validasi, otorisasi dan perubahan batch tetap pada layanan. */
export interface ImportWizardEvents {
  selectFile: [file: File | null];
  changeContext: [context: ImportContext];
  submit: [];
  confirm: [acknowledgedWarnings: string[]];
  cancel: []; // Hanya niat pengguna; belum berarti batch CANCELLED.
}
