<script setup lang="ts">
// Lencana status (design.md §5.6, profil keadaan P). Status selalu disampaikan lewat teks;
// warna hanya penguat, tidak pernah menjadi satu-satunya penanda.
withDefaults(
  defineProps<{
    variant?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
  }>(),
  { variant: 'neutral' },
);
</script>

<template>
  <span
    class="siris-badge"
    :class="`siris-badge--${variant}`"
  >
    <slot />
  </span>
</template>

<style scoped>
.siris-badge {
  display: inline-flex;
  align-items: center;
  box-sizing: border-box;
  min-block-size: var(--space-s24);
  padding-block: 0;
  padding-inline: var(--space-s8);
  border: var(--border-default) solid transparent;
  border-radius: var(--radius-pill);
  font-family: var(--font-body);
  font-size: var(--type-caption-size);
  line-height: var(--type-caption-line-height);
  font-weight: var(--type-label-weight);
  white-space: nowrap;
}

.siris-badge--neutral {
  background-color: var(--color-bg-subtle);
  border-color: var(--color-border-strong);
  color: var(--color-fg-default);
}

.siris-badge--success {
  background-color: var(--color-feedback-success-bg);
  border-color: var(--color-feedback-success-fg);
  color: var(--color-feedback-success-fg);
}

.siris-badge--warning {
  background-color: var(--color-feedback-warning-bg);
  border-color: var(--color-feedback-warning-fg);
  color: var(--color-feedback-warning-fg);
}

.siris-badge--danger {
  background-color: var(--color-feedback-danger-bg);
  border-color: var(--color-feedback-danger-fg);
  color: var(--color-feedback-danger-fg);
}

.siris-badge--info {
  background-color: var(--color-feedback-info-bg);
  border-color: var(--color-feedback-info-fg);
  color: var(--color-feedback-info-fg);
}
</style>
