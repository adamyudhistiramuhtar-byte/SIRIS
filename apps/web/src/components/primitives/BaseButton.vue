<script setup lang="ts">
import { computed, useId } from 'vue';
import { Loader2 } from 'lucide-vue-next';

// Tombol dasar SIRIS (design.md §5.1, profil keadaan A).
// - `type` selalu eksplisit (default "button") agar tidak mengirim form secara tidak sengaja.
// - Keadaan nonaktif memakai aria-disabled, bukan atribut disabled, sehingga tombol tetap
//   dapat difokuskan dan alasan nonaktifnya dapat dibacakan.
// - Keadaan loading menampilkan spinner + kata kerja, lebar tombol stabil, dan klik diblokir.
const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'tertiary' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    type?: 'button' | 'submit' | 'reset';
    loading?: boolean;
    loadingLabel?: string;
    disabled?: boolean;
    disabledReason?: string;
  }>(),
  {
    variant: 'primary',
    size: 'md',
    type: 'button',
    loading: false,
    loadingLabel: 'Memproses…',
    disabled: false,
    disabledReason: '',
  },
);

const emit = defineEmits<{ click: [event: MouseEvent] }>();

const reasonId = useId();
const inert = computed(() => props.disabled || props.loading);
const hasReason = computed(() => props.disabled && props.disabledReason !== '');

function onClick(event: MouseEvent) {
  if (inert.value) {
    // Cegah submit form dan klik ganda saat tombol nonaktif atau sedang memuat.
    event.preventDefault();
    return;
  }
  emit('click', event);
}
</script>

<template>
  <button
    :type="type"
    class="siris-button"
    :class="[
      `siris-button--${variant}`,
      `siris-button--${size}`,
      { 'siris-button--disabled': disabled, 'siris-button--loading': loading },
    ]"
    :aria-disabled="inert ? 'true' : undefined"
    :aria-busy="loading ? 'true' : undefined"
    :aria-describedby="hasReason ? reasonId : undefined"
    :title="hasReason ? disabledReason : undefined"
    @click="onClick"
  >
    <span
      class="siris-button__layer"
      :class="{ 'siris-button__layer--hidden': loading }"
    >
      <slot />
    </span>
    <span
      class="siris-button__layer"
      :class="{ 'siris-button__layer--hidden': !loading }"
      :aria-hidden="loading ? undefined : 'true'"
    >
      <Loader2
        class="siris-button__spinner"
        aria-hidden="true"
      />
      <span>{{ loadingLabel }}</span>
    </span>
    <span
      v-if="hasReason"
      :id="reasonId"
      class="sr-only"
    >{{ disabledReason }}</span>
  </button>
</template>

<style scoped>
.siris-button {
  display: inline-grid;
  align-items: center;
  justify-items: center;
  box-sizing: border-box;
  min-block-size: var(--button-height);
  padding-block: 0;
  padding-inline: var(--button-padding);
  border: var(--border-default) solid transparent;
  border-radius: var(--button-radius);
  font-family: var(--font-body);
  font-size: var(--type-label-size);
  line-height: var(--type-label-line-height);
  letter-spacing: var(--type-label-tracking);
  font-weight: var(--type-label-weight);
  cursor: pointer;
  transition:
    background-color var(--motion-fast) var(--motion-easing),
    border-color var(--motion-fast) var(--motion-easing);
}

.siris-button--sm {
  min-block-size: var(--control-sm);
  padding-inline: var(--space-s12);
}

.siris-button--lg {
  min-block-size: var(--control-lg);
}

/* Dua lapisan ditumpuk pada sel grid yang sama agar lebar tidak berubah saat loading. */
.siris-button__layer {
  grid-area: 1 / 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-s8);
}

.siris-button__layer--hidden {
  visibility: hidden;
}

.siris-button__spinner {
  inline-size: var(--icon-md);
  block-size: var(--icon-md);
  stroke-width: var(--icon-stroke);
  animation: siris-button-spin calc(var(--motion-slow) * 4) linear infinite;
}

.siris-button--sm .siris-button__spinner {
  inline-size: var(--icon-sm);
  block-size: var(--icon-sm);
}

@keyframes siris-button-spin {
  to {
    transform: rotate(360deg);
  }
}

/* Varian */
.siris-button--primary {
  background-color: var(--button-primary-bg);
  color: var(--button-primary-fg);
}

.siris-button--secondary {
  background-color: var(--color-bg-surface);
  border-color: var(--color-accent-default);
  color: var(--color-accent-default);
}

.siris-button--tertiary {
  background-color: transparent;
  color: var(--color-accent-default);
}

.siris-button--danger {
  background-color: var(--color-feedback-danger-bg);
  border-color: var(--color-feedback-danger-fg);
  color: var(--color-feedback-danger-fg);
}

/* Hover hanya pada perangkat yang mendukung hover; pressed selalu berlaku. */
@media (hover: hover) {
  .siris-button--primary:hover:not([aria-disabled='true']) {
    background-color: var(--button-primary-hover);
  }

  .siris-button--secondary:hover:not([aria-disabled='true']),
  .siris-button--tertiary:hover:not([aria-disabled='true']) {
    background-color: var(--color-bg-hover);
  }

  /* Penanda tidak bergantung pada warna saja. */
  .siris-button--danger:hover:not([aria-disabled='true']) {
    text-decoration: underline;
  }
}

.siris-button--primary:active:not([aria-disabled='true']) {
  background-color: var(--button-primary-active);
}

.siris-button--secondary:active:not([aria-disabled='true']),
.siris-button--tertiary:active:not([aria-disabled='true']) {
  background-color: var(--color-bg-active);
}

.siris-button--loading {
  cursor: progress;
}

/* Nonaktif tetap terbaca: kontras dijaga oleh token, bukan opacity. */
.siris-button--disabled {
  background-color: var(--button-disabled-bg);
  border-color: var(--color-border-default);
  color: var(--button-disabled-fg);
  cursor: not-allowed;
}
</style>
