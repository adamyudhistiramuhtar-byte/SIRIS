/**
 * Pengendali alur impor di sisi klien (SRS-53, handoff SRS-46). Status: PROPOSED.
 *
 * `ImportWizard` murni presentasi. Pengendali ini adalah konsumen pertama reset konteks
 * SRS-46 (baseline SRS-36 §7 butir 8, §8.3):
 * - Saat akun, role, gudang, atau mode berubah, request yang masih berjalan dibatalkan
 *   (AbortController), lalu berkas, progres, preview, dan hasil dibersihkan. Respons yang
 *   datang terlambat dari request lama diabaikan, bukan ditampilkan.
 * - Perubahan gudang/mode dari wizard tidak diterapkan langsung: pengendali meminta store
 *   sesi, yang menolak gudang di luar assignment dan mode ACTUAL.
 * - Pengendali tidak mengakui warning, tidak membuat preview, dan tidak menentukan
 *   kedaluwarsa. Warning hanya diteruskan sebagai ID yang sudah diakui pengguna di wizard.
 * - Layanan (`ImportFlowService`) belum ada. Bentuknya sengaja kecil dan menunggu kontrak
 *   final SRS-58; pemanggilan nyata ke API bukan bagian SRS-53.
 */
import { computed, getCurrentScope, onScopeDispose, ref, shallowRef } from 'vue';
import type { SessionStore } from '../session/session-context';
import type { ImportContext, ImportWizardState } from './import-wizard-types';

export interface ImportFlowService {
  validate(input: {
    file: File;
    context: ImportContext;
    signal: AbortSignal;
    onProgress: (percent: number) => void;
  }): Promise<ImportWizardState>;
  commit(input: {
    batchId: string;
    fingerprint: string;
    acknowledgedWarnings: string[];
    idempotencyKey: string;
    signal: AbortSignal;
  }): Promise<ImportWizardState>;
  cancel(input: { batchId: string; signal: AbortSignal }): Promise<ImportWizardState>;
  status(input: {
    batchId: string;
    idempotencyKey?: string;
    signal: AbortSignal;
  }): Promise<ImportWizardState>;
}

const MODE_NOT_ENABLED = 'Mode ACTUAL belum diaktifkan.';
const WAREHOUSE_NOT_ASSIGNED = 'Gudang tersebut bukan assignment akun ini.';

function isAbort(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { name?: unknown }).name === 'AbortError'
  );
}

function newIdempotencyKey(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  return `idem-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export function useImportFlow(session: SessionStore, service: ImportFlowService) {
  const state = shallowRef<ImportWizardState>({ phase: 'initial' });
  const file = shallowRef<File | null>(null);
  const uploadProgress = ref<number | null>(null);
  const contextNotice = ref('');

  let generation = 0;
  let controller: AbortController | null = null;
  // Kunci idempotensi per upaya simpan; dipakai ulang untuk cek status hasil tidak pasti.
  let commitKey: string | null = null;

  const context = computed<ImportContext>(() => ({
    warehouseId: session.state.activeWarehouseId ?? '',
    mode: session.state.mode,
  }));

  function abortInFlight() {
    controller?.abort();
    controller = null;
  }

  function reset() {
    generation += 1;
    abortInFlight();
    state.value = { phase: 'initial' };
    file.value = null;
    uploadProgress.value = null;
    commitKey = null;
  }

  /** Jalankan satu operasi; hasil dibuang bila konteks sudah berganti selama menunggu. */
  async function run(
    pending: ImportWizardState,
    task: (signal: AbortSignal) => Promise<ImportWizardState>,
    onFailure: (error: unknown) => ImportWizardState,
  ) {
    abortInFlight();
    const mine = ++generation;
    const own = new AbortController();
    controller = own;
    state.value = pending;
    try {
      const next = await task(own.signal);
      if (mine !== generation) return;
      state.value = next;
    } catch (error) {
      if (mine !== generation || isAbort(error)) return;
      state.value = onFailure(error);
    } finally {
      if (mine === generation) {
        controller = null;
        uploadProgress.value = null;
      }
    }
  }

  const stopReset = session.onContextReset(() => reset());
  if (getCurrentScope()) {
    onScopeDispose(() => {
      stopReset();
      generation += 1;
      abortInFlight();
    });
  }

  function selectFile(next: File | null) {
    if (state.value.phase !== 'initial' && state.value.phase !== 'error') return;
    file.value = next;
    if (state.value.phase === 'error') state.value = { phase: 'initial' };
  }

  function changeContext(next: ImportContext) {
    contextNotice.value = '';
    if (next.warehouseId !== context.value.warehouseId) {
      const result = session.setActiveWarehouse(next.warehouseId);
      if (!result.ok) contextNotice.value = WAREHOUSE_NOT_ASSIGNED;
    }
    if (next.mode !== context.value.mode) {
      const result = session.setMode(next.mode);
      if (!result.ok) contextNotice.value = MODE_NOT_ENABLED;
    }
  }

  function submit() {
    const current = file.value;
    if (state.value.phase !== 'initial' || current === null) return Promise.resolve();
    if (context.value.warehouseId.trim() === '') return Promise.resolve();
    return run(
      { phase: 'uploading' },
      (signal) =>
        service.validate({
          file: current,
          context: context.value,
          signal,
          onProgress: (percent) => {
            uploadProgress.value = percent;
          },
        }),
      () => ({ phase: 'error', message: 'Berkas belum dapat diproses. Coba lagi.' }),
    );
  }

  function revalidate() {
    const current = state.value;
    if (current.phase !== 'preview' && current.phase !== 'expired' && current.phase !== 'invalid') {
      return Promise.resolve();
    }
    const kept = file.value;
    if (kept === null) {
      state.value = { phase: 'initial' };
      return Promise.resolve();
    }
    state.value = { phase: 'initial' };
    return submit();
  }

  function confirm(acknowledgedWarnings: string[]) {
    const current = state.value;
    if (current.phase !== 'preview') return Promise.resolve();
    const { batchId, fingerprint } = current.preview;
    const key = newIdempotencyKey();
    commitKey = key;
    return run(
      { phase: 'committing' },
      (signal) =>
        service.commit({
          batchId,
          fingerprint,
          acknowledgedWarnings,
          idempotencyKey: key,
          signal,
        }),
      // Hasil simpan tidak pasti tidak boleh tampil sebagai sukses maupun gagal.
      () => ({ phase: 'unknown', batchId, idempotencyKey: key }),
    );
  }

  function cancel() {
    const current = state.value;
    const batchId =
      current.phase === 'preview'
        ? current.preview.batchId
        : 'batchId' in current && current.batchId
          ? current.batchId
          : null;
    if (batchId === null) {
      reset();
      return Promise.resolve();
    }
    return run(
      { phase: 'cancelling', batchId },
      (signal) => service.cancel({ batchId, signal }),
      () => ({ phase: 'cancel-unknown', batchId }),
    );
  }

  function checkStatus() {
    const current = state.value;
    if (
      current.phase !== 'unknown' &&
      current.phase !== 'cancel-unknown' &&
      current.phase !== 'preparation-unknown'
    ) {
      return Promise.resolve();
    }
    const batchId = current.batchId;
    if (!batchId) return Promise.resolve();
    const idempotencyKey = current.phase === 'unknown' ? current.idempotencyKey : commitKey ?? undefined;
    return run(
      current,
      (signal) => service.status({ batchId, idempotencyKey, signal }),
      () => current,
    );
  }

  function back() {
    if (state.value.phase === 'initial') return;
    generation += 1;
    abortInFlight();
    state.value = { phase: 'initial' };
    uploadProgress.value = null;
  }

  return {
    // Computed (bukan readonly dalam) agar tipe cocok dengan props ImportWizard.
    state: computed(() => state.value),
    file: computed(() => file.value),
    uploadProgress: computed(() => uploadProgress.value),
    context,
    contextNotice: computed(() => contextNotice.value),
    handlers: {
      selectFile,
      changeContext,
      submit,
      confirm,
      cancel,
      back,
      revalidate,
      checkStatus,
      restart: reset,
    },
  };
}
