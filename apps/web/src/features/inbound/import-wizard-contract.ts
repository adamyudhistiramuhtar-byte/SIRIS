import type { ImportContext, ImportState } from './reference-import';

/** Usulan boundary presentasi untuk review SRS-53; bukan kontrak domain final. */
export interface ImportWizardProps {
  context: ImportContext | null;
  state: ImportState;
  file: File | null;
  uploadProgress: number | null;
}

/** Aksi UI; validasi, otorisasi dan perubahan batch tetap pada layanan. */
export interface ImportWizardEvents {
  selectFile: [file: File | null];
  submit: [];
  confirm: [];
  cancel: [];
}
