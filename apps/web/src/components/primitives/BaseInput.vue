<script setup lang="ts">
// Input native SIRIS (design.md §5.3, profil keadaan F).
// Elemen akar adalah <input>, sehingga id, aria-describedby, required, placeholder, disabled,
// readonly, dan autocomplete dari FormField/pemanggil langsung diteruskan ke elemen native.
withDefaults(
  defineProps<{
    type?: 'text' | 'password' | 'search';
    size?: 'md' | 'lg';
    invalid?: boolean;
  }>(),
  { type: 'text', size: 'md', invalid: false },
);

const model = defineModel<string>({ default: '' });
</script>

<template>
  <input
    v-model="model"
    :type="type"
    class="siris-input"
    :class="[`siris-input--${size}`, { 'siris-input--invalid': invalid }]"
    :aria-invalid="invalid ? 'true' : undefined"
  >
</template>

<style scoped>
.siris-input {
  box-sizing: border-box;
  inline-size: 100%;
  min-block-size: var(--input-height);
  padding-block: 0;
  padding-inline: var(--input-padding);
  border: var(--border-default) solid var(--control-border);
  border-radius: var(--input-radius);
  background-color: var(--control-bg);
  color: var(--control-fg);
  font-family: var(--font-body);
  font-size: var(--type-body-md-size);
  line-height: var(--type-body-md-line-height);
  transition: border-color var(--motion-fast) var(--motion-easing);
}

.siris-input--lg {
  min-block-size: var(--control-lg);
}

.siris-input::placeholder {
  color: var(--color-fg-muted);
}

/* Galat: border lebih tebal + teks galat di FormField, bukan hanya warna. */
.siris-input--invalid {
  border-color: var(--control-error);
  border-width: var(--border-strong);
}

.siris-input:disabled {
  background-color: var(--color-bg-disabled);
  border-color: var(--color-border-default);
  color: var(--color-fg-disabled);
  -webkit-text-fill-color: var(--color-fg-disabled);
  cursor: not-allowed;
}

.siris-input:read-only:not(:disabled) {
  background-color: var(--color-bg-subtle);
}
</style>
