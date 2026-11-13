<script setup lang="ts">
import { computed, ref, useId } from 'vue';
import { AlertCircle, CheckCircle2, FileText } from 'lucide-vue-next';
import BaseButton from '../primitives/BaseButton.vue';
import { formatFileSize } from '../../shared/import/import-wizard-types';

// Pemilih berkas SIRIS (design.md §5, FileUpload; state E-I/P-I/X-I pada §6).
// - Input native; tombol "Pilih Berkas" membukanya. Drag-drop tidak diperlukan.
// - Tipe dan ukuran hanya petunjuk di sisi klien; backend tetap otoritas validasi (DOC-09).
// - Keadaan sukses hanya muncul bila ada berkas. Tidak ada validasi sukses tanpa file.
// - Berkas yang sama dapat dipilih ulang setelah koreksi: nilai input dikosongkan tiap pemilihan.
const props = withDefaults(
  defineProps<{
    file: File | null;
    label?: string;
    hint?: string;
    accept?: string[];
    maxSizeBytes?: number;
    error?: string;
    progress?: number | null;
    disabled?: boolean;
    disabledReason?: string;
  }>(),
  {
    label: 'Berkas impor',
    hint: '',
    accept: () => [],
    maxSizeBytes: undefined,
    error: '',
    progress: null,
    disabled: false,
    disabledReason: '',
  },
);

const emit = defineEmits<{ select: [file: File | null] }>();

type RejectionKind = 'incompatible' | 'oversize' | 'error';
const rejection = ref<{ kind: RejectionKind; message: string } | null>(null);

const uid = useId();
const labelId = `${uid}-label`;
const hintId = `${uid}-hint`;
const statusId = `${uid}-status`;
const input = ref<HTMLInputElement | null>(null);

const hintText = computed(() => {
  if (props.hint !== '') return props.hint;
  const parts: string[] = [];
  if (props.accept.length > 0) parts.push(`Format: ${props.accept.join(', ')}.`);
  if (props.maxSizeBytes !== undefined) {
    parts.push(`Ukuran maksimum ${formatFileSize(props.maxSizeBytes)}.`);
  }
  return parts.join(' ');
});

const message = computed(() => props.error || rejection.value?.message || '');
const state = computed(() => {
  if (props.error !== '') return 'error';
  if (rejection.value) return rejection.value.kind;
  return props.file ? 'success' : 'empty';
});

const describedBy = computed(() => {
  const ids = [statusId];
  if (hintText.value !== '') ids.unshift(hintId);
  return ids.join(' ');
});

const progressValue = computed(() =>
  props.progress === null ? null : Math.min(100, Math.max(0, Math.round(props.progress))),
);

function openPicker() {
  input.value?.click();
}

function onChange(event: Event) {
  const element = event.target as HTMLInputElement;
  const picked = element.files?.[0] ?? null;
  // Dikosongkan agar memilih berkas yang sama setelah koreksi tetap memicu change.
  element.value = '';
  if (!picked) return;

  if (props.accept.length > 0) {
    const name = picked.name.toLowerCase();
    if (!props.accept.some((extension) => name.endsWith(extension.toLowerCase()))) {
      rejection.value = {
        kind: 'incompatible',
        message: `Jenis berkas tidak didukung. Pilih berkas ${props.accept.join(', ')}.`,
      };
      emit('select', null);
      return;
    }
  }
  if (picked.size === 0) {
    rejection.value = { kind: 'error', message: 'Berkas kosong. Pilih berkas yang berisi data.' };
    emit('select', null);
    return;
  }
  if (props.maxSizeBytes !== undefined && picked.size > props.maxSizeBytes) {
    rejection.value = {
      kind: 'oversize',
      message: `Ukuran berkas melebihi ${formatFileSize(props.maxSizeBytes)}. Pilih berkas yang lebih kecil.`,
    };
    emit('select', null);
    return;
  }
  rejection.value = null;
  emit('select', picked);
}

function remove() {
  rejection.value = null;
  emit('select', null);
}
</script>

<template>
  <div
    class="siris-upload"
    role="group"
    :aria-labelledby="labelId"
    :data-state="state"
  >
    <p
      :id="labelId"
      class="siris-upload__label"
    >
      {{ label }}
    </p>
    <p
      v-if="hintText"
      :id="hintId"
      class="siris-upload__hint"
    >
      {{ hintText }}
    </p>
    <input
      ref="input"
      type="file"
      class="sr-only"
      tabindex="-1"
      aria-hidden="true"
      :accept="accept.join(',') || undefined"
      :disabled="disabled"
      @change="onChange"
    >
    <div class="siris-upload__actions">
      <BaseButton
        variant="secondary"
        :disabled="disabled"
        :disabled-reason="disabledReason"
        :aria-describedby="describedBy"
        @click="openPicker"
      >
        {{ file ? 'Ganti Berkas' : 'Pilih Berkas' }}
      </BaseButton>
      <BaseButton
        v-if="file && !disabled"
        variant="tertiary"
        size="sm"
        @click="remove"
      >
        Hapus Berkas
      </BaseButton>
    </div>
    <div
      :id="statusId"
      class="siris-upload__status"
      aria-live="polite"
    >
      <p
        v-if="message"
        class="siris-upload__message siris-upload__message--error"
        role="alert"
      >
        <AlertCircle
          class="siris-upload__icon"
          aria-hidden="true"
        />
        <span>{{ message }}</span>
      </p>
      <p
        v-else-if="file"
        class="siris-upload__message siris-upload__message--ok"
      >
        <CheckCircle2
          class="siris-upload__icon"
          aria-hidden="true"
        />
        <span class="siris-upload__file">
          <FileText
            class="siris-upload__icon"
            aria-hidden="true"
          />
          <span>Berkas dipilih: {{ file.name }} ({{ formatFileSize(file.size) }})</span>
        </span>
      </p>
      <p
        v-else
        class="siris-upload__message"
      >
        Belum ada berkas dipilih.
      </p>
    </div>
    <div
      v-if="progressValue !== null"
      class="siris-upload__progress"
    >
      <progress
        max="100"
        :value="progressValue"
        aria-label="Progres unggah"
      />
      <span>{{ progressValue }}%</span>
    </div>
  </div>
</template>

<style scoped>
.siris-upload {
  display: flex;
  flex-direction: column;
  gap: var(--space-s8);
  box-sizing: border-box;
  padding: var(--space-s24);
  border: var(--border-strong) dashed var(--control-border);
  border-radius: var(--radius-control);
  background-color: var(--color-bg-subtle);
  font-family: var(--font-body);
}

.siris-upload__label {
  margin: 0;
  font-size: var(--type-label-size);
  line-height: var(--type-label-line-height);
  font-weight: var(--type-label-weight);
  color: var(--color-fg-default);
}

.siris-upload__hint {
  margin: 0;
  font-size: var(--type-caption-size);
  line-height: var(--type-caption-line-height);
  color: var(--color-fg-muted);
}

.siris-upload__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-s8);
}

.siris-upload__message {
  display: flex;
  align-items: flex-start;
  gap: var(--space-s8);
  margin: 0;
  font-size: var(--type-body-sm-size);
  line-height: var(--type-body-sm-line-height);
  color: var(--color-fg-default);
  overflow-wrap: anywhere;
}

.siris-upload__message--error {
  color: var(--control-error);
}

.siris-upload__message--ok {
  color: var(--color-feedback-success-fg);
}

.siris-upload__file {
  display: inline-flex;
  align-items: flex-start;
  gap: var(--space-s4);
  min-inline-size: 0;
  color: var(--color-fg-default);
}

.siris-upload__icon {
  flex: none;
  inline-size: var(--icon-sm);
  block-size: var(--icon-sm);
  margin-block-start: var(--space-s4);
  stroke-width: var(--icon-stroke);
}

.siris-upload__progress {
  display: flex;
  align-items: center;
  gap: var(--space-s8);
  font-size: var(--type-caption-size);
  color: var(--color-fg-default);
}

.siris-upload__progress progress {
  flex: 1;
  accent-color: var(--color-accent-default);
}
</style>
