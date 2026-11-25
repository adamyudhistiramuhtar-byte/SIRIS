import { describe, it, expect, vi } from 'vitest';
import {
  createSessionStore,
  DEFAULT_UJI_CONTEXT,
  type SessionContext,
} from '../shared/session/session-context';
import { useImportFlow, type ImportFlowService } from '../shared/import/use-import-flow';
import type { ImportWizardState } from '../shared/import/import-wizard-types';

const TWO_WAREHOUSES: SessionContext = {
  ...DEFAULT_UJI_CONTEXT,
  warehouses: [
    { id: 'WH-01', code: 'WH-01', name: 'Gudang Bahan Baku' },
    { id: 'WH-02', code: 'WH-02', name: 'Gudang Barang Jadi' },
  ],
};

const PREVIEW: ImportWizardState = {
  phase: 'preview',
  preview: { batchId: 'b-1', fingerprint: 'fp-1', warnings: ['w-1'] },
};

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
}
function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function makeService(overrides: Partial<ImportFlowService> = {}): ImportFlowService {
  return {
    validate: vi.fn(async () => PREVIEW),
    commit: vi.fn(async () => ({
      phase: 'success',
      receipt: { batchId: 'b-1', state: 'COMMITTED' },
    })) as ImportFlowService['commit'],
    cancel: vi.fn(async () => ({ phase: 'cancelled', batchId: 'b-1' })) as ImportFlowService['cancel'],
    status: vi.fn(async () => PREVIEW),
    ...overrides,
  };
}

const FILE = new File(['x'], 'saldo.xlsx');

describe('Pengendali alur impor: reset konteks (SRS-36 §7 butir 8)', () => {
  it('pergantian gudang membatalkan request berjalan dan membuang respons lambat', async () => {
    const session = createSessionStore(TWO_WAREHOUSES);
    const pending = deferred<ImportWizardState>();
    let seenSignal: AbortSignal | undefined;
    const service = makeService({
      validate: vi.fn(({ signal }) => {
        seenSignal = signal;
        return pending.promise;
      }),
    });
    const flow = useImportFlow(session, service);
    flow.handlers.selectFile(FILE);
    const running = flow.handlers.submit();
    expect(flow.state.value.phase).toBe('uploading');

    session.setActiveWarehouse('WH-02');
    expect(seenSignal?.aborted).toBe(true);
    expect(flow.state.value).toEqual({ phase: 'initial' });
    expect(flow.file.value).toBeNull();

    pending.resolve(PREVIEW);
    await running;
    // Respons dari konteks lama tidak boleh muncul sebagai preview.
    expect(flow.state.value).toEqual({ phase: 'initial' });
  });

  it('preview, berkas, dan kunci simpan dibersihkan saat role atau akun berganti', async () => {
    const session = createSessionStore(TWO_WAREHOUSES);
    const flow = useImportFlow(session, makeService());
    flow.handlers.selectFile(FILE);
    await flow.handlers.submit();
    expect(flow.state.value.phase).toBe('preview');

    session.setRole('WAREHOUSE');
    expect(flow.state.value).toEqual({ phase: 'initial' });
    expect(flow.file.value).toBeNull();
  });

  it('respons simpan yang terlambat setelah reset tidak menjadi sukses', async () => {
    const session = createSessionStore(TWO_WAREHOUSES);
    const pending = deferred<ImportWizardState>();
    const service = makeService({ commit: vi.fn(() => pending.promise) });
    const flow = useImportFlow(session, service);
    flow.handlers.selectFile(FILE);
    await flow.handlers.submit();
    const running = flow.handlers.confirm(['w-1']);
    expect(flow.state.value.phase).toBe('committing');

    session.setActiveWarehouse('WH-02');
    pending.resolve({ phase: 'success', receipt: { batchId: 'b-1', state: 'COMMITTED' } });
    await running;
    expect(flow.state.value).toEqual({ phase: 'initial' });
  });

  it('setelah dilepas, pengendali tidak lagi bereaksi pada reset konteks', async () => {
    const session = createSessionStore(TWO_WAREHOUSES);
    const { effectScope } = await import('vue');
    const scope = effectScope();
    const flow = scope.run(() => useImportFlow(session, makeService()))!;
    flow.handlers.selectFile(FILE);
    scope.stop();
    session.setActiveWarehouse('WH-02');
    expect(flow.file.value).toBe(FILE);
  });
});

describe('Pengendali alur impor: konteks dan batas', () => {
  it('perubahan gudang dari wizard hanya lewat assignment', () => {
    const session = createSessionStore(TWO_WAREHOUSES);
    const flow = useImportFlow(session, makeService());
    flow.handlers.changeContext({ warehouseId: 'WH-99', mode: 'UJI' });
    expect(session.state.activeWarehouseId).toBe('WH-01');
    expect(flow.contextNotice.value).toContain('assignment');

    flow.handlers.changeContext({ warehouseId: 'WH-02', mode: 'UJI' });
    expect(session.state.activeWarehouseId).toBe('WH-02');
    expect(flow.contextNotice.value).toBe('');
  });

  it('mode ACTUAL ditolak dan konteks tetap UJI', () => {
    const session = createSessionStore(TWO_WAREHOUSES);
    const flow = useImportFlow(session, makeService());
    flow.handlers.changeContext({ warehouseId: 'WH-01', mode: 'ACTUAL' });
    expect(session.state.mode).toBe('UJI');
    expect(flow.context.value.mode).toBe('UJI');
    expect(flow.contextNotice.value).toContain('ACTUAL');
  });

  it('submit tidak berjalan tanpa berkas atau tanpa gudang aktif', async () => {
    const session = createSessionStore({
      ...TWO_WAREHOUSES,
      warehouses: [],
      activeWarehouseId: null,
    });
    const service = makeService();
    const flow = useImportFlow(session, service);
    await flow.handlers.submit();
    flow.handlers.selectFile(FILE);
    await flow.handlers.submit();
    expect(service.validate).not.toHaveBeenCalled();
    expect(flow.state.value.phase).toBe('initial');
  });
});

describe('Pengendali alur impor: hasil tidak pasti', () => {
  it('kegagalan simpan menjadi unknown dengan kunci idempotensi, bukan sukses atau gagal', async () => {
    const session = createSessionStore(TWO_WAREHOUSES);
    const service = makeService({
      commit: vi.fn(async () => {
        throw new Error('network');
      }),
    });
    const flow = useImportFlow(session, service);
    flow.handlers.selectFile(FILE);
    await flow.handlers.submit();
    await flow.handlers.confirm(['w-1']);
    const result = flow.state.value;
    expect(result.phase).toBe('unknown');
    if (result.phase === 'unknown') {
      expect(result.batchId).toBe('b-1');
      expect(result.idempotencyKey.length).toBeGreaterThan(8);
    }
  });

  it('cek status memakai kunci yang sama dan tidak menimpa dengan sukses palsu bila gagal', async () => {
    const session = createSessionStore(TWO_WAREHOUSES);
    const status = vi.fn(async () => {
      throw new Error('network');
    });
    const service = makeService({
      commit: vi.fn(async () => {
        throw new Error('network');
      }),
      status,
    });
    const flow = useImportFlow(session, service);
    flow.handlers.selectFile(FILE);
    await flow.handlers.submit();
    await flow.handlers.confirm(['w-1']);
    const before = flow.state.value;
    await flow.handlers.checkStatus();
    expect(status).toHaveBeenCalledTimes(1);
    const arg = (status.mock.calls[0] as unknown[])[0] as { idempotencyKey?: string };
    expect(before.phase === 'unknown' && arg.idempotencyKey).toBe(
      before.phase === 'unknown' ? before.idempotencyKey : undefined,
    );
    expect(flow.state.value).toEqual(before);
  });

  it('kegagalan pembatalan menjadi cancel-unknown, bukan cancelled', async () => {
    const session = createSessionStore(TWO_WAREHOUSES);
    const service = makeService({
      cancel: vi.fn(async () => {
        throw new Error('network');
      }),
    });
    const flow = useImportFlow(session, service);
    flow.handlers.selectFile(FILE);
    await flow.handlers.submit();
    await flow.handlers.cancel();
    expect(flow.state.value).toEqual({ phase: 'cancel-unknown', batchId: 'b-1' });
  });

  it('kegagalan validasi mempertahankan ketidakpastian tanpa membocorkan pesan mentah', async () => {
    const session = createSessionStore(TWO_WAREHOUSES);
    const service = makeService({
      validate: vi.fn(async () => {
        throw new Error('SELECT * FROM secret');
      }),
    });
    const flow = useImportFlow(session, service);
    flow.handlers.selectFile(FILE);
    await flow.handlers.submit();
    const result = flow.state.value;
    expect(result.phase).toBe('preparation-unknown');
    expect(JSON.stringify(result)).not.toContain('SELECT');
  });

  it('warning hanya diteruskan sebagai ID yang dikirim wizard, tidak diakui otomatis', async () => {
    const session = createSessionStore(TWO_WAREHOUSES);
    const service = makeService();
    const flow = useImportFlow(session, service);
    flow.handlers.selectFile(FILE);
    await flow.handlers.submit();
    await flow.handlers.confirm([]);
    const call = (service.commit as ReturnType<typeof vi.fn>).mock.calls[0][0] as {
      acknowledgedWarnings: string[];
    };
    expect(call.acknowledgedWarnings).toEqual([]);
  });
});

describe('Pengendali alur impor terpasang pada ImportWizard', () => {
  it('wizard kembali ke tahap Pilih File setelah konteks gudang berganti', async () => {
    const { mount, flushPromises } = await import('@vue/test-utils');
    const { defineComponent, h } = await import('vue');
    const { default: ImportWizard } = await import('../components/patterns/ImportWizard.vue');

    const session = createSessionStore(TWO_WAREHOUSES);
    const flow = useImportFlow(session, makeService());
    flow.handlers.selectFile(FILE);

    const Host = defineComponent({
      setup: () => () =>
        h(ImportWizard, {
          context: flow.context.value,
          state: flow.state.value,
          file: flow.file.value,
          uploadProgress: flow.uploadProgress.value,
          onSubmit: flow.handlers.submit,
          onConfirm: flow.handlers.confirm,
          onCancel: flow.handlers.cancel,
          onBack: flow.handlers.back,
          onRevalidate: flow.handlers.revalidate,
          onCheckStatus: flow.handlers.checkStatus,
          onRestart: flow.handlers.restart,
          onChangeContext: flow.handlers.changeContext,
          onSelectFile: flow.handlers.selectFile,
        }),
    });
    const wrapper = mount(Host);
    await flow.handlers.submit();
    await flushPromises();
    expect(wrapper.text()).toContain('Preview');

    session.setActiveWarehouse('WH-02');
    await flushPromises();
    expect(flow.state.value).toEqual({ phase: 'initial' });
    expect(wrapper.text()).not.toContain('b-1');
    wrapper.unmount();
  });
});


describe('Regresi review PM: operasi terlambat dan hasil tidak pasti', () => {
  it('progress lama tidak mengisi ulang progres setelah reset konteks', async () => {
    const pending = deferred<ImportWizardState>();
    let progress!: (value: number) => void;
    const session = createSessionStore(TWO_WAREHOUSES);
    const flow = useImportFlow(session, makeService({validate: ({onProgress}) => {progress=onProgress;return pending.promise;}}));
    flow.handlers.selectFile(FILE);const running=flow.handlers.submit();
    progress(20);expect(flow.uploadProgress.value).toBe(20);
    session.setActiveWarehouse('WH-02');progress(99);
    expect(flow.uploadProgress.value).toBeNull();
    pending.resolve(PREVIEW);await running;
  });
  it('AbortError dari transport simpan tidak meninggalkan fase committing', async () => {
    const flow=useImportFlow(createSessionStore(TWO_WAREHOUSES),makeService({commit:async()=>{throw new DOMException('timeout','AbortError');}}));
    flow.handlers.selectFile(FILE);await flow.handlers.submit();await flow.handlers.confirm([]);
    expect(flow.state.value.phase).toBe('unknown');
  });
  it('validasi terputus tidak mengizinkan unggah ulang otomatis', async () => {
    const flow=useImportFlow(createSessionStore(TWO_WAREHOUSES),makeService({validate:async()=>{throw new Error('network');}}));
    flow.handlers.selectFile(FILE);await flow.handlers.submit();
    expect(flow.state.value.phase).toBe('preparation-unknown');
  });
});
