<script setup lang="ts">
import { computed } from 'vue';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-vue-next';

// Alert/banner SIRIS (design.md §5.7, profil keadaan P). Ikon bersifat dekoratif;
// makna disampaikan oleh judul dan teks. Danger/warning memakai role="alert",
// info/success memakai role="status" agar tidak menyela pembaca layar tanpa perlu.
const props = withDefaults(
  defineProps<{
    variant?: 'info' | 'success' | 'warning' | 'danger';
    title?: string;
    dismissible?: boolean;
    dismissLabel?: string;
  }>(),
  { variant: 'info', title: '', dismissible: false, dismissLabel: 'Tutup pemberitahuan' },
);

const emit = defineEmits<{ dismiss: [] }>();

const icons = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: AlertCircle,
} as const;

const icon = computed(() => icons[props.variant]);
const role = computed(() =>
  props.variant === 'danger' || props.variant === 'warning' ? 'alert' : 'status',
);
</script>

<template>
  <div
    class="siris-alert"
    :class="`siris-alert--${variant}`"
    :role="role"
  >
    <component
      :is="icon"
      class="siris-alert__icon"
      aria-hidden="true"
    />
    <div class="siris-alert__body">
      <p
        v-if="title"
        class="siris-alert__title"
      >
        {{ title }}
      </p>
      <div class="siris-alert__message">
        <slot />
      </div>
    </div>
    <button
      v-if="dismissible"
      type="button"
      class="siris-alert__dismiss"
      :aria-label="dismissLabel"
      @click="emit('dismiss')"
    >
      <X
        class="siris-alert__dismiss-icon"
        aria-hidden="true"
      />
    </button>
  </div>
</template>

<style scoped>
.siris-alert {
  display: flex;
  align-items: flex-start;
  gap: var(--space-s12);
  box-sizing: border-box;
  padding: var(--space-s12) var(--space-s16);
  border: var(--border-default) solid transparent;
  border-radius: var(--radius-surface);
  font-family: var(--font-body);
  font-size: var(--type-body-md-size);
  line-height: var(--type-body-md-line-height);
}

.siris-alert--info {
  background-color: var(--color-feedback-info-bg);
  border-color: var(--color-feedback-info-fg);
  color: var(--color-fg-default);
  --siris-alert-accent: var(--color-feedback-info-fg);
}

.siris-alert--success {
  background-color: var(--color-feedback-success-bg);
  border-color: var(--color-feedback-success-fg);
  color: var(--color-fg-default);
  --siris-alert-accent: var(--color-feedback-success-fg);
}

.siris-alert--warning {
  background-color: var(--color-feedback-warning-bg);
  border-color: var(--color-feedback-warning-fg);
  color: var(--color-fg-default);
  --siris-alert-accent: var(--color-feedback-warning-fg);
}

.siris-alert--danger {
  background-color: var(--color-feedback-danger-bg);
  border-color: var(--color-feedback-danger-fg);
  color: var(--color-fg-default);
  --siris-alert-accent: var(--color-feedback-danger-fg);
}

.siris-alert__icon {
  flex: none;
  inline-size: var(--icon-md);
  block-size: var(--icon-md);
  margin-block-start: var(--space-s4);
  stroke-width: var(--icon-stroke);
  color: var(--siris-alert-accent);
}

.siris-alert__body {
  flex: 1;
  min-inline-size: 0;
}

.siris-alert__title {
  margin: 0;
  font-weight: var(--type-label-weight);
  color: var(--siris-alert-accent);
}

.siris-alert__message {
  overflow-wrap: anywhere;
}

.siris-alert__dismiss {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  inline-size: var(--control-sm);
  block-size: var(--control-sm);
  margin-block: calc(var(--space-s4) * -1);
  margin-inline-end: calc(var(--space-s8) * -1);
  padding: 0;
  border: 0;
  border-radius: var(--radius-control);
  background-color: transparent;
  color: var(--color-fg-default);
  cursor: pointer;
}

.siris-alert__dismiss-icon {
  inline-size: var(--icon-md);
  block-size: var(--icon-md);
  stroke-width: var(--icon-stroke);
}

@media (hover: hover) {
  .siris-alert__dismiss:hover {
    background-color: var(--color-bg-hover);
  }
}
</style>
