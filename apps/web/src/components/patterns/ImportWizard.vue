<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue';
import AlertBanner from '../primitives/AlertBanner.vue';
import BaseButton from '../primitives/BaseButton.vue';
import BaseInput from '../primitives/BaseInput.vue';
import BaseSelect from '../primitives/BaseSelect.vue';
import FormField from '../primitives/FormField.vue';
import FileUpload from './FileUpload.vue';
import ValidationReport from './ValidationReport.vue';
import {
  IMPORT_STEPS,
  stepForPhase,
  warningId,
  warningMessage,
  type ImportContext,
  type ImportMode,
  type ImportWizardState,
} from '../../shared/import/import-wizard-types';

// Alur impor bersama empat tahap (design.md §5 ImportWizard, §6.3 state machine).
// Komponen ini murni presentasi: state masuk lewat props, niat pengguna keluar lewat event.
// Validasi, otorisasi, idempotency key, dan perubahan batch tetap pada layanan.
// - Commit terkunci sampai ada preview sah dan semua warning diakui.
// - Preview yang `expiresAt`-nya sudah lewat diperlakukan kedaluwarsa oleh komponen ini
//   (termasuk saat waktu habis ketika layar terbuka): Simpan hilang dan `confirm` tidak
//   dikirim. Ini hanya pengaman tampilan; layanan tetap otoritas atas kedaluwarsa.
// - INVALID adalah hasil validasi yang sah: tampil sebagai laporan temuan, bukan galat.
// - Hasil tidak pasti (commit/pembatalan/persiapan) tidak pernah ditampilkan sebagai sukses.
// - Status yang belum dikenal mengunci semua tindakan (status baru dapat ditambah pada
//   `ImportWizardState` dan `stepForPhase` tanpa mengubah komponen lain).
const props = withDefaults(
  defineProps<{
    context: ImportContext | null;
    state: ImportWizardState;
    file: File | null;
    uploadProgress: number | null;
    importLabel?: string;
    accept?: string[];
    maxSizeBytes?: number;
  }>(),
  { importLabel: 'Impor', accept: () => [], maxSizeBytes: undefined },
);

const emit = defineEmits<{
  selectFile: [file: File | null];
  changeContext: [context: ImportContext];
  submit: [];
  /** Berisi ID semua warning yang diakui pengguna. */
  confirm: [acknowledgedWarnings: string[]];
  /** Hanya niat pengguna; belum berarti batch CANCELLED. */
  cancel: [];
  back: [];
  revalidate: [];
  checkStatus: [];
  restart: [];
}>();

const phase = computed<string>(() => props.state.phase);
const recognizedStep = computed(() => stepForPhase(phase.value));
const unsupported = computed(() => recognizedStep.value === undefined);
const step = computed(() => recognizedStep.value ?? 1);
const stepName = computed(() => IMPORT_STEPS[step.value - 1]);

const busy = computed(() =>
  ['uploading', 'validating', 'committing', 'cancelling'].includes(phase.value),
);
const locked = computed(() => busy.value || unsupported.value);

const headingId = useId();
const heading = ref<HTMLElement | null>(null);

// Fokus pindah ke judul tahap setelah tahap berubah (bukan saat pertama kali tampil).
watch(step, async () => {
  await nextTick();
  heading.value?.focus();
});

// --- Konteks (gudang dan mode) ---
const currentContext = computed<ImportContext>(
  () => props.context ?? { warehouseId: '', mode: 'UJI' },
);
const warehouseModel = computed({
  get: () => currentContext.value.warehouseId,
  set: (value: string) => emit('changeContext', { ...currentContext.value, warehouseId: value }),
});
const modeModel = computed({
  get: () => currentContext.value.mode as string,
  set: (value: string) => {
    if (value === 'UJI' || value === 'ACTUAL') {
      emit('changeContext', { ...currentContext.value, mode: value as ImportMode });
    }
  },
});
const modeOptions = [
  { value: 'UJI', label: 'UJI (data simulasi)' },
  { value: 'ACTUAL', label: 'ACTUAL (data operasional)' },
];

const submitReason = computed(() => {
  if (!props.file) return 'Pilih berkas terlebih dahulu';
  if (currentContext.value.warehouseId.trim() === '') return 'Isi gudang terlebih dahulu';
  return '';
});

function onSubmit() {
  if (locked.value || submitReason.value !== '' || phase.value !== 'initial') return;
  emit('submit');
}

// --- Preview dan warning ---
const preview = computed(() => (props.state.phase === 'preview' ? props.state.preview : null));
const warnings = computed(() => {
  const seen = new Set<string>();
  return (preview.value?.warnings ?? []).filter((warning) => {
    const id = warningId(warning);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
});
const acknowledged = ref<string[]>([]);
watch(
  () => (preview.value ? `${preview.value.batchId}:${preview.value.fingerprint}` : ''),
  () => {
    acknowledged.value = [];
  },
);

// --- Kedaluwarsa preview (pengaman tampilan; layanan tetap otoritas) ---
const MAX_TIMER_MS = 2 ** 31 - 1;
const now = ref(Date.now());
let expiryTimer: ReturnType<typeof setTimeout> | undefined;

// undefined = layanan tidak mengirim expiresAt; NaN = nilai tidak dapat dibaca.
function expiryTime(value: string | undefined): number | undefined {
  return value === undefined ? undefined : Date.parse(value);
}
function isPastExpiry(value: string | undefined, at: number): boolean {
  const time = expiryTime(value);
  if (time === undefined) return false;
  // Nilai yang tidak dapat dibaca tidak dapat dibuktikan masih berlaku: gagal tertutup.
  return !Number.isFinite(time) || at >= time;
}

function clearExpiryTimer() {
  if (expiryTimer !== undefined) clearTimeout(expiryTimer);
  expiryTimer = undefined;
}
function scheduleExpiry() {
  clearExpiryTimer();
  now.value = Date.now();
  const time = expiryTime(preview.value?.expiresAt);
  if (time === undefined || !Number.isFinite(time) || now.value >= time) return;
  expiryTimer = setTimeout(scheduleExpiry, Math.min(time - now.value, MAX_TIMER_MS));
}
watch(() => (preview.value ? `${preview.value.batchId}:${preview.value.expiresAt}` : ''), scheduleExpiry, {
  immediate: true,
});
onBeforeUnmount(clearExpiryTimer);

const previewExpired = computed(
  () => preview.value !== null && isPastExpiry(preview.value.expiresAt, now.value),
);

const allAcknowledged = computed(() =>
  warnings.value.every((warning) => acknowledged.value.includes(warningId(warning))),
);
const confirmReason = computed(() =>
  allAcknowledged.value ? '' : 'Akui semua warning sebelum menyimpan',
);

function setAcknowledged(id: string, checked: boolean) {
  const rest = acknowledged.value.filter((item) => item !== id);
  acknowledged.value = checked ? [...rest, id] : rest;
}

function onConfirm() {
  if (phase.value !== 'preview' || !allAcknowledged.value) return;
  // Periksa ulang dengan waktu saat klik; jangan bergantung pada timer yang mungkin tertunda.
  if (previewExpired.value || isPastExpiry(preview.value?.expiresAt, Date.now())) {
    now.value = Date.now();
    return;
  }
  emit('confirm', warnings.value.map(warningId));
}

function formatExpiry(value: string | undefined): string {
  if (!value) return 'Tidak tersedia';
  const time = Date.parse(value);
  if (!Number.isFinite(time)) return value;
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(time),
  );
}

const batchId = computed(() => {
  const state = props.state;
  if (state.phase === 'preview') return state.preview.batchId;
  if (state.phase === 'success') return state.receipt.batchId;
  if ('batchId' in state && state.batchId) return state.batchId;
  return '';
});
</script>

<template>
  <section
    class="siris-wizard"
    :aria-label="`Impor ${importLabel}`"
  >
    <p class="siris-wizard__progress">
      Tahap {{ step }} dari {{ IMPORT_STEPS.length }} — {{ stepName }}
    </p>
    <ol
      class="siris-wizard__steps"
      aria-label="Tahap impor"
    >
      <li
        v-for="(name, index) in IMPORT_STEPS"
        :key="name"
        class="siris-wizard__step"
        :class="{
          'siris-wizard__step--current': index + 1 === step,
          'siris-wizard__step--done': index + 1 < step,
        }"
        :aria-current="index + 1 === step ? 'step' : undefined"
      >
        <span
          class="siris-wizard__step-number"
          aria-hidden="true"
        >{{ index + 1 }}</span>
        <span class="siris-wizard__step-name">{{ name }}</span>
        <span class="sr-only">{{
          index + 1 < step ? ' — selesai' : index + 1 === step ? ' — tahap saat ini' : ' — belum'
        }}</span>
      </li>
    </ol>

    <h2
      :id="headingId"
      ref="heading"
      class="siris-wizard__heading"
      tabindex="-1"
    >
      {{ stepName }}
    </h2>

    <div class="siris-wizard__body">
      <!-- Status yang belum dikenal: semua tindakan dikunci. -->
      <AlertBanner
        v-if="unsupported"
        variant="warning"
        title="Status proses belum didukung"
      >
        Status “{{ phase }}” belum dikenal tampilan ini. Semua tindakan dikunci; periksa status
        proses di layanan.
      </AlertBanner>

      <!-- Tahap 1: Pilih File -->
      <template v-else-if="step === 1">
        <AlertBanner
          v-if="state.phase === 'error'"
          variant="danger"
          title="Impor belum siap"
        >
          {{ state.message }}
        </AlertBanner>
        <div class="siris-wizard__fields">
          <FormField
            v-slot="{ id, ariaDescribedby, invalid, required }"
            label="Gudang"
            required
          >
            <BaseInput
              :id="id"
              v-model="warehouseModel"
              :aria-describedby="ariaDescribedby"
              :invalid="invalid"
              :required="required"
              :disabled="locked"
              autocomplete="off"
            />
          </FormField>
          <FormField
            v-slot="{ id, ariaDescribedby }"
            label="Mode data"
            hint="UJI untuk data simulasi, ACTUAL untuk data operasional. Izin diperiksa oleh layanan."
          >
            <BaseSelect
              :id="id"
              v-model="modeModel"
              :options="modeOptions"
              :aria-describedby="ariaDescribedby"
              :disabled="locked"
            />
          </FormField>
        </div>
        <FileUpload
          :file="file"
          :label="`Berkas ${importLabel}`"
          :accept="accept"
          :max-size-bytes="maxSizeBytes"
          :progress="state.phase === 'uploading' ? uploadProgress : null"
          :disabled="locked"
          disabled-reason="Berkas tidak dapat diganti saat proses berjalan"
          @select="emit('selectFile', $event)"
        />
        <div class="siris-wizard__actions">
          <BaseButton
            :loading="state.phase === 'uploading'"
            loading-label="Mengunggah…"
            :disabled="locked || submitReason !== ''"
            :disabled-reason="submitReason"
            @click="onSubmit"
          >
            Validasi
          </BaseButton>
        </div>
      </template>

      <!-- Tahap 2: Hasil Validasi -->
      <template v-else-if="step === 2">
        <AlertBanner
          v-if="state.phase === 'validating'"
          variant="info"
          title="Memvalidasi berkas"
        >
          Tindakan ganda diblokir sampai layanan mengirim hasil.
        </AlertBanner>
        <template v-else-if="state.phase === 'invalid'">
          <AlertBanner
            variant="danger"
            title="Berkas belum valid"
          >
            Perbaiki berkas sesuai laporan, lalu validasi ulang. Preview dan Simpan dikunci.
          </AlertBanner>
          <ValidationReport :issues="state.issues" />
          <div class="siris-wizard__actions">
            <BaseButton @click="emit('back')">
              Ganti Berkas
            </BaseButton>
            <BaseButton
              variant="tertiary"
              @click="emit('cancel')"
            >
              Batal
            </BaseButton>
          </div>
        </template>
        <template v-else-if="state.phase === 'preparation-unknown'">
          <AlertBanner
            variant="warning"
            title="Hasil persiapan belum pasti"
          >
            Layanan belum memastikan hasil unggah atau validasi
            <template v-if="batchId">
              untuk batch {{ batchId }}
            </template>. Periksa status proses sebelum mencoba kembali.
          </AlertBanner>
          <div class="siris-wizard__actions">
            <BaseButton @click="emit('checkStatus')">
              Periksa Status
            </BaseButton>
          </div>
        </template>
      </template>

      <!-- Tahap 3: Preview -->
      <template v-else-if="step === 3">
        <template v-if="state.phase === 'expired' || (state.phase === 'preview' && previewExpired)">
          <AlertBanner
            variant="warning"
            title="Preview kedaluwarsa"
          >
            Batch {{ batchId }} perlu divalidasi ulang sebelum dapat disimpan.
          </AlertBanner>
          <div class="siris-wizard__actions">
            <BaseButton @click="emit('revalidate')">
              Validasi Ulang
            </BaseButton>
            <BaseButton
              variant="tertiary"
              @click="emit('cancel')"
            >
              Batal
            </BaseButton>
          </div>
        </template>
        <template v-else-if="preview || state.phase === 'committing'">
          <dl
            v-if="preview"
            class="siris-wizard__summary"
          >
            <div>
              <dt>Jenis impor</dt>
              <dd>{{ importLabel }}</dd>
            </div>
            <div>
              <dt>Gudang</dt>
              <dd>{{ currentContext.warehouseId || 'Tidak tersedia' }}</dd>
            </div>
            <div>
              <dt>Mode</dt>
              <dd>{{ currentContext.mode }}</dd>
            </div>
            <div>
              <dt>Berkas</dt>
              <dd>{{ file?.name ?? 'Tidak tersedia' }}</dd>
            </div>
            <div>
              <dt>Jumlah baris</dt>
              <dd>{{ preview.rowCount ?? 'Tidak tersedia' }}</dd>
            </div>
            <div>
              <dt>Sumber</dt>
              <dd>{{ preview.source ?? 'Tidak tersedia' }}</dd>
            </div>
            <div>
              <dt>Batch</dt>
              <dd>{{ preview.batchId }}</dd>
            </div>
            <div>
              <dt>Kedaluwarsa</dt>
              <dd>{{ formatExpiry(preview.expiresAt) }}</dd>
            </div>
          </dl>
          <fieldset
            v-if="warnings.length > 0"
            class="siris-wizard__warnings"
          >
            <legend>Warning perlu diakui sebelum menyimpan</legend>
            <label
              v-for="warning in warnings"
              :key="warningId(warning)"
              class="siris-wizard__warning"
            >
              <input
                type="checkbox"
                :checked="acknowledged.includes(warningId(warning))"
                :disabled="state.phase === 'committing'"
                @change="setAcknowledged(warningId(warning), ($event.target as HTMLInputElement).checked)"
              >
              <span>{{ warningMessage(warning) }}</span>
            </label>
          </fieldset>
          <div class="siris-wizard__actions">
            <BaseButton
              :loading="state.phase === 'committing'"
              loading-label="Menyimpan…"
              :disabled="state.phase !== 'preview' || !allAcknowledged"
              :disabled-reason="confirmReason"
              @click="onConfirm"
            >
              Simpan
            </BaseButton>
            <BaseButton
              variant="secondary"
              :disabled="state.phase === 'committing'"
              @click="emit('back')"
            >
              Kembali
            </BaseButton>
            <BaseButton
              variant="tertiary"
              :disabled="state.phase === 'committing'"
              @click="emit('cancel')"
            >
              Batal
            </BaseButton>
          </div>
        </template>
      </template>

      <!-- Tahap 4: Hasil Simpan -->
      <template v-else>
        <template v-if="state.phase === 'success'">
          <AlertBanner
            variant="success"
            title="Impor tersimpan"
          >
            Batch {{ state.receipt.batchId }} berstatus {{ state.receipt.state }}.
          </AlertBanner>
          <div class="siris-wizard__actions">
            <BaseButton @click="emit('restart')">
              Mulai Impor Baru
            </BaseButton>
          </div>
        </template>
        <template v-else-if="state.phase === 'unknown'">
          <AlertBanner
            variant="warning"
            title="Hasil penyimpanan belum dapat dikonfirmasi"
          >
            Batch {{ state.batchId }} belum dapat dinyatakan tersimpan atau gagal. Periksa status
            proses sebelum mencoba kembali.
          </AlertBanner>
          <div class="siris-wizard__actions">
            <BaseButton @click="emit('checkStatus')">
              Periksa Status
            </BaseButton>
          </div>
        </template>
        <AlertBanner
          v-else-if="state.phase === 'cancelling'"
          variant="info"
          title="Pembatalan sedang diproses"
        >
          Tunggu konfirmasi layanan untuk batch {{ state.batchId }}.
        </AlertBanner>
        <template v-else-if="state.phase === 'cancelled'">
          <AlertBanner
            variant="info"
            title="Batch dibatalkan"
          >
            Batch {{ state.batchId }} dibatalkan.
          </AlertBanner>
          <div class="siris-wizard__actions">
            <BaseButton @click="emit('restart')">
              Mulai Impor Baru
            </BaseButton>
          </div>
        </template>
        <template v-else-if="state.phase === 'cancel-unknown'">
          <AlertBanner
            variant="warning"
            title="Hasil pembatalan belum pasti"
          >
            Layanan belum memastikan pembatalan batch {{ state.batchId }}. Periksa status proses.
          </AlertBanner>
          <div class="siris-wizard__actions">
            <BaseButton @click="emit('checkStatus')">
              Periksa Status
            </BaseButton>
          </div>
        </template>
      </template>
    </div>
  </section>
</template>

<style scoped>
.siris-wizard {
  display: flex;
  flex-direction: column;
  gap: var(--space-s16);
  box-sizing: border-box;
  padding: var(--space-s24);
  border: var(--border-default) solid var(--color-border-default);
  border-radius: var(--radius-surface);
  background-color: var(--surface-bg);
  font-family: var(--font-body);
  color: var(--color-fg-default);
}

.siris-wizard__progress {
  margin: 0;
  font-size: var(--type-label-size);
  line-height: var(--type-label-line-height);
  font-weight: var(--type-label-weight);
  color: var(--color-fg-muted);
}

.siris-wizard__steps {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-s16);
  margin: 0;
  padding: 0;
  list-style: none;
}

.siris-wizard__step {
  display: inline-flex;
  align-items: center;
  gap: var(--space-s8);
  font-size: var(--type-body-sm-size);
  line-height: var(--type-body-sm-line-height);
  color: var(--color-fg-muted);
}

.siris-wizard__step-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  inline-size: var(--control-sm);
  block-size: var(--control-sm);
  border: var(--border-default) solid var(--color-border-strong);
  border-radius: var(--radius-pill);
  font-weight: var(--type-label-weight);
}

.siris-wizard__step--done .siris-wizard__step-number {
  border-color: var(--color-feedback-success-fg);
  color: var(--color-feedback-success-fg);
}

.siris-wizard__step--current {
  color: var(--color-fg-default);
  font-weight: var(--type-label-weight);
}

.siris-wizard__step--current .siris-wizard__step-number {
  border-color: var(--color-accent-default);
  border-width: var(--border-strong);
  background-color: var(--color-bg-active);
  color: var(--color-nav-selected);
}

/* Layar sempit: hanya tahap saat ini yang diberi nama; "Tahap n dari 4" tetap terbaca. */
@media (max-width: 48em) {
  .siris-wizard__step:not(.siris-wizard__step--current) .siris-wizard__step-name {
    display: none;
  }
}

.siris-wizard__heading {
  margin: 0;
  font-size: var(--type-h2-size);
  line-height: var(--type-h2-line-height);
  font-weight: var(--type-h2-weight);
}

.siris-wizard__heading:focus-visible {
  outline: var(--focus-width) solid var(--focus-ring);
  outline-offset: var(--focus-offset);
}

.siris-wizard__body {
  display: flex;
  flex-direction: column;
  gap: var(--space-s16);
}

.siris-wizard__fields {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(var(--layout-field-min), 1fr));
  gap: var(--space-s16);
}

.siris-wizard__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-s8);
}

.siris-wizard__summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(var(--layout-field-min), 1fr));
  gap: var(--space-s12);
  margin: 0;
}

.siris-wizard__summary dt {
  font-size: var(--type-caption-size);
  line-height: var(--type-caption-line-height);
  color: var(--color-fg-muted);
}

.siris-wizard__summary dd {
  margin: 0;
  overflow-wrap: anywhere;
}

.siris-wizard__warnings {
  display: flex;
  flex-direction: column;
  gap: var(--space-s8);
  margin: 0;
  padding: var(--space-s12) var(--space-s16);
  border: var(--border-default) solid var(--color-feedback-warning-fg);
  border-radius: var(--radius-surface);
  background-color: var(--color-feedback-warning-bg);
}

.siris-wizard__warnings legend {
  padding-inline: var(--space-s4);
  font-weight: var(--type-label-weight);
}

.siris-wizard__warning {
  display: flex;
  align-items: flex-start;
  gap: var(--space-s8);
  overflow-wrap: anywhere;
}
</style>
