import { describe, it, expect, vi, afterEach } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils';
import ImportWizard from '../components/patterns/ImportWizard.vue';
import {
  createSessionStore,
  DEFAULT_UJI_CONTEXT,
  type SessionContext,
} from '../shared/session/session-context';
import { useImportFlow, type ImportFlowService } from '../shared/import/use-import-flow';
import type { ImportWizardState } from '../shared/import/import-wizard-types';

// SRS-56 (T-22): uji integrasi komponen impor lewat DOM. ImportWizard, useImportFlow, dan
// store sesi nyata dipasang bersama; hanya transport (ImportFlowService) berupa fixture UJI.
// Ini BUKAN bukti E2E: tidak ada API, sesi, atau otorisasi nyata (SRS-47/48/51/52).

const SESSION: SessionContext = {
  ...DEFAULT_UJI_CONTEXT,
  warehouses: [
    { id: 'WH-01', code: 'WH-01', name: 'Gudang Bahan Baku' },
    { id: 'WH-02', code: 'WH-02', name: 'Gudang Barang Jadi' },
  ],
  activeWarehouseId: 'WH-01',
};

const PREVIEW: ImportWizardState = {
  phase: 'preview',
  preview: {
    batchId: 'b-1',
    fingerprint: 'fp-1',
    warnings: [{ id: 'w-1', message: 'Satuan KG dan KGM bercampur' }],
  },
};
const PREVIEW_CLEAN: ImportWizardState = {
  phase: 'preview',
  preview: { batchId: 'b-2', fingerprint: 'fp-2', warnings: [] },
};

function service(overrides: Partial<ImportFlowService> = {}): ImportFlowService {
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

function setup(svc: ImportFlowService) {
  const session = createSessionStore(SESSION);
  const flow = useImportFlow(session, svc);
  const Host = defineComponent({
    setup: () => () =>
      h(ImportWizard, {
        context: flow.context.value,
        state: flow.state.value,
        file: flow.file.value,
        uploadProgress: flow.uploadProgress.value,
        accept: ['.xlsx', '.csv'],
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
  const wrapper = mount(Host, { attachTo: document.body });
  return { wrapper, session, flow };
}

function tombol(wrapper: VueWrapper, label: string) {
  return wrapper
    .findAll('button')
    .find((b) => b.element.querySelector('.siris-button__layer')?.textContent?.trim() === label);
}

async function pilihBerkas(wrapper: VueWrapper, name = 'saldo.csv') {
  const file = new File(['kode,qty\nA,1'], name, { type: 'text/csv' });
  const input = wrapper.get('input[type="file"]');
  Object.defineProperty(input.element, 'files', { value: [file], configurable: true });
  await input.trigger('change');
  await flushPromises();
  return file;
}

async function klik(wrapper: VueWrapper, label: string) {
  const button = tombol(wrapper, label);
  expect(button, `tombol ${label}`).toBeDefined();
  await button!.trigger('click');
  await flushPromises();
}

let mounted: VueWrapper | null = null;
function track<T extends { wrapper: VueWrapper }>(value: T): T {
  mounted = value.wrapper;
  return value;
}
afterEach(() => {
  mounted?.unmount();
  mounted = null;
  vi.restoreAllMocks();
});

describe('Integrasi impor: file gate (AC "tanpa file validasi diblokir")', () => {
  it('tanpa berkas: Validasi nonaktif dan klik tidak memanggil layanan', async () => {
    const svc = service();
    const { wrapper } = track(setup(svc));
    const validasi = tombol(wrapper, 'Validasi')!;
    expect(validasi.attributes('aria-disabled')).toBe('true');
    await validasi.trigger('click');
    await flushPromises();
    expect(svc.validate).not.toHaveBeenCalled();
    expect(tombol(wrapper, 'Simpan')).toBeUndefined();
  });

  it('alasan nonaktif tersedia untuk teknologi bantu dan tombol tetap dapat difokuskan', () => {
    const { wrapper } = track(setup(service()));
    const validasi = tombol(wrapper, 'Validasi')!;
    expect(validasi.attributes('disabled')).toBeUndefined();
    const describedBy = validasi.attributes('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!.split(' ')[0])?.textContent?.trim()).toBeTruthy();
  });

  it('berkas berekstensi tidak didukung ditolak di komponen dan tidak mencapai layanan', async () => {
    const svc = service();
    const { wrapper } = track(setup(svc));
    await pilihBerkas(wrapper, 'saldo.exe');
    expect(wrapper.find('[role="alert"]').exists()).toBe(true);
    await klik(wrapper, 'Validasi');
    expect(svc.validate).not.toHaveBeenCalled();
  });
});

describe('Integrasi impor: alur sukses (fixture transport)', () => {
  it('pilih berkas, validasi, akui warning, simpan, COMMITTED, mulai baru', async () => {
    const svc = service();
    const { wrapper } = track(setup(svc));
    await pilihBerkas(wrapper);
    await klik(wrapper, 'Validasi');
    expect(svc.validate).toHaveBeenCalledTimes(1);
    expect(wrapper.text()).toContain('Satuan KG dan KGM bercampur');

    const simpan = tombol(wrapper, 'Simpan')!;
    expect(simpan.attributes('aria-disabled')).toBe('true');
    await simpan.trigger('click');
    await flushPromises();
    expect(svc.commit).not.toHaveBeenCalled();

    await wrapper.get('input[type="checkbox"]').setValue(true);
    await klik(wrapper, 'Simpan');
    expect(svc.commit).toHaveBeenCalledTimes(1);
    const arg = (svc.commit as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(arg.batchId).toBe('b-1');
    expect(arg.fingerprint).toBe('fp-1');
    expect(arg.acknowledgedWarnings).toEqual(['w-1']);
    expect(typeof arg.idempotencyKey).toBe('string');
    expect(arg.idempotencyKey.length).toBeGreaterThan(8);
    expect(wrapper.text()).toContain('b-1');

    await klik(wrapper, 'Mulai Impor Baru');
    expect(wrapper.text()).toContain('Validasi');
    expect(wrapper.text()).not.toContain('b-1');
  });

  it('konteks yang dikirim ke layanan memuat gudang aktif dan mode UJI', async () => {
    const svc = service({ validate: vi.fn(async () => PREVIEW_CLEAN) });
    const { wrapper } = track(setup(svc));
    await pilihBerkas(wrapper);
    await klik(wrapper, 'Validasi');
    const arg = (svc.validate as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(arg.context).toEqual({ warehouseId: 'WH-01', mode: 'UJI' });
    expect(arg.signal).toBeInstanceOf(AbortSignal);
  });
});

describe('Integrasi impor: state gagal dan tidak pasti', () => {
  it('INVALID menampilkan temuan dan tidak menawarkan Simpan', async () => {
    const svc = service({
      validate: vi.fn(async () => ({
        phase: 'invalid',
        batchId: 'b-9',
        issues: [{ row: 3, field: 'qty', message: 'Kuantitas bukan angka' }],
      })) as ImportFlowService['validate'],
    });
    const { wrapper } = track(setup(svc));
    await pilihBerkas(wrapper);
    await klik(wrapper, 'Validasi');
    expect(wrapper.text()).toContain('Kuantitas bukan angka');
    expect(tombol(wrapper, 'Simpan')).toBeUndefined();
    expect(wrapper.text()).not.toContain('berhasil');
  });

  it('kegagalan transport saat validasi menjadi galat umum tanpa pesan mentah', async () => {
    const svc = service({
      validate: vi.fn(async () => {
        throw new Error('ECONNRESET 10.0.0.5:5432 password=rahasia');
      }),
    });
    const { wrapper } = track(setup(svc));
    await pilihBerkas(wrapper);
    await klik(wrapper, 'Validasi');
    expect(wrapper.text()).not.toContain('ECONNRESET');
    expect(wrapper.text()).not.toContain('rahasia');
    expect(tombol(wrapper, 'Simpan')).toBeUndefined();
  });

  it('simpan timeout menjadi unknown: bukan sukses, tidak ada Simpan ulang, cek status memakai kunci sama', async () => {
    const svc = service({
      validate: vi.fn(async () => PREVIEW_CLEAN),
      commit: vi.fn(async () => {
        throw new Error('timeout');
      }),
      status: vi.fn(async () => ({
        phase: 'success',
        receipt: { batchId: 'b-2', state: 'COMMITTED' },
      })) as ImportFlowService['status'],
    });
    const { wrapper } = track(setup(svc));
    await pilihBerkas(wrapper);
    await klik(wrapper, 'Validasi');
    await klik(wrapper, 'Simpan');
    expect(tombol(wrapper, 'Simpan')).toBeUndefined();
    expect(tombol(wrapper, 'Periksa Status')).toBeDefined();
    const commitKey = (svc.commit as ReturnType<typeof vi.fn>).mock.calls[0][0].idempotencyKey;

    await klik(wrapper, 'Periksa Status');
    const statusArg = (svc.status as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(statusArg.batchId).toBe('b-2');
    expect(statusArg.idempotencyKey).toBe(commitKey);
    expect(svc.commit).toHaveBeenCalledTimes(1);
  });

  it('pembatalan: cancelled bila layanan mengonfirmasi, cancel-unknown bila gagal', async () => {
    const ok = track(setup(service()));
    await pilihBerkas(ok.wrapper);
    await klik(ok.wrapper, 'Validasi');
    await klik(ok.wrapper, 'Batal');
    expect(ok.flow.state.value.phase).toBe('cancelled');
    ok.wrapper.unmount();

    const gagal = track(
      setup(
        service({
          cancel: vi.fn(async () => {
            throw new Error('putus');
          }),
        }),
      ),
    );
    await pilihBerkas(gagal.wrapper);
    await klik(gagal.wrapper, 'Validasi');
    await klik(gagal.wrapper, 'Batal');
    expect(gagal.flow.state.value.phase).toBe('cancel-unknown');
    expect(tombol(gagal.wrapper, 'Periksa Status')).toBeDefined();
  });
});

describe('Integrasi impor: context reset (SRS-36 §7 butir 8)', () => {
  it('ganti role saat validasi berjalan: request di-abort, UI kembali ke Pilih File, respons lambat dibuang', async () => {
    let resolveValidate!: (s: ImportWizardState) => void;
    let seenSignal!: AbortSignal;
    const svc = service({
      validate: vi.fn(
        ({ signal }) =>
          new Promise<ImportWizardState>((resolve) => {
            seenSignal = signal;
            resolveValidate = resolve;
          }),
      ),
    });
    const { wrapper, session, flow } = track(setup(svc));
    await pilihBerkas(wrapper);
    const running = flow.handlers.submit();
    await flushPromises();
    expect(flow.state.value.phase).toBe('uploading');

    expect(session.state.role).toBe('PURCHASING');
    expect(session.setRole('WAREHOUSE').ok).toBe(true);
    await flushPromises();
    expect(seenSignal.aborted).toBe(true);
    expect(flow.state.value).toEqual({ phase: 'initial' });

    resolveValidate(PREVIEW);
    await running;
    await flushPromises();
    expect(flow.state.value).toEqual({ phase: 'initial' });
    expect(wrapper.text()).not.toContain('Satuan KG dan KGM bercampur');
    expect(flow.file.value).toBeNull();
  });

  it('ganti gudang pada tahap preview membuang preview dan berkas', async () => {
    const { wrapper, session, flow } = track(setup(service()));
    await pilihBerkas(wrapper);
    await klik(wrapper, 'Validasi');
    expect(wrapper.text()).toContain('Satuan KG dan KGM bercampur');

    session.setActiveWarehouse('WH-02');
    await flushPromises();
    expect(flow.state.value).toEqual({ phase: 'initial' });
    expect(flow.file.value).toBeNull();
    expect(wrapper.text()).not.toContain('Satuan KG dan KGM bercampur');
  });

  it('gudang di luar assignment dan mode ACTUAL ditolak, preview tidak terbuang', async () => {
    const { wrapper, session, flow } = track(setup(service()));
    await pilihBerkas(wrapper);
    await klik(wrapper, 'Validasi');
    expect(session.setActiveWarehouse('WH-99').ok).toBe(false);
    expect(session.setMode('ACTUAL').ok).toBe(false);
    await flushPromises();
    expect(flow.state.value.phase).toBe('preview');
    expect(flow.context.value.mode).toBe('UJI');
  });
});

describe('Integrasi impor: keyboard dan fokus', () => {
  it('semua aksi berupa <button type="button"> asli, urutan fokus mengikuti urutan DOM', async () => {
    const { wrapper } = track(setup(service()));
    await pilihBerkas(wrapper);
    await klik(wrapper, 'Validasi');
    const buttons = wrapper.findAll('button');
    expect(buttons.length).toBeGreaterThan(0);
    buttons.forEach((b) => expect(b.attributes('type')).toBe('button'));
    const tabbable = wrapper
      .findAll('button, input, [tabindex="0"], select')
      .filter((el) => el.attributes('tabindex') !== '-1' && el.attributes('disabled') === undefined);
    expect(tabbable.length).toBeGreaterThanOrEqual(buttons.length);
  });

  it('fokus pindah ke judul tahap setelah validasi selesai', async () => {
    const { wrapper } = track(setup(service()));
    await pilihBerkas(wrapper);
    await klik(wrapper, 'Validasi');
    await flushPromises();
    const active = document.activeElement as HTMLElement | null;
    expect(active).not.toBeNull();
    expect(active!.tagName).toMatch(/^H[1-6]$/);
    expect(wrapper.element.contains(active)).toBe(true);
  });
});
