<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import { ChevronDown } from 'lucide-vue-next';

// Select native SIRIS (design.md §5.4, profil keadaan F). Memakai <select> native agar
// keyboard, pembaca layar, dan perangkat seluler bekerja tanpa pustaka tambahan.
defineOptions({ inheritAttrs: false });

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

const props = withDefaults(
  defineProps<{
    options: SelectOption[];
    placeholder?: string;
    loading?: boolean;
    invalid?: boolean;
    size?: 'md' | 'lg';
  }>(),
  { placeholder: '', loading: false, invalid: false, size: 'md' },
);

const model = defineModel<string>({ default: '' });
const attrs = useAttrs();

const isEmpty = computed(() => !props.loading && props.options.length === 0);
const isDisabled = computed(
  () => props.loading || isEmpty.value || (attrs.disabled !== undefined && attrs.disabled !== false),
);
</script>

<template>
  <div class="siris-select">
    <select
      v-bind="$attrs"
      v-model="model"
      class="siris-select__control"
      :class="[`siris-select__control--${size}`, { 'siris-select__control--invalid': invalid }]"
      :disabled="isDisabled"
      :aria-invalid="invalid ? 'true' : undefined"
      :aria-busy="loading ? 'true' : undefined"
    >
      <option
        v-if="loading"
        value=""
        disabled
      >
        Memuat opsi…
      </option>
      <option
        v-else-if="isEmpty"
        value=""
        disabled
      >
        Tidak ada opsi tersedia
      </option>
      <template v-else>
        <option
          v-if="placeholder"
          value=""
          disabled
        >
          {{ placeholder }}
        </option>
        <option
          v-for="option in options"
          :key="option.value"
          :value="option.value"
          :disabled="option.disabled"
        >
          {{ option.label }}
        </option>
      </template>
    </select>
    <ChevronDown
      class="siris-select__icon"
      aria-hidden="true"
    />
  </div>
</template>

<style scoped>
.siris-select {
  position: relative;
  display: block;
  inline-size: 100%;
}

.siris-select__control {
  box-sizing: border-box;
  inline-size: 100%;
  min-block-size: var(--input-height);
  padding-block: 0;
  padding-inline-start: var(--input-padding);
  padding-inline-end: var(--space-s40);
  border: var(--border-default) solid var(--control-border);
  border-radius: var(--input-radius);
  background-color: var(--control-bg);
  color: var(--control-fg);
  font-family: var(--font-body);
  font-size: var(--type-body-md-size);
  line-height: var(--type-body-md-line-height);
  appearance: none;
  cursor: pointer;
  transition: border-color var(--motion-fast) var(--motion-easing);
}

.siris-select__control--lg {
  min-block-size: var(--control-lg);
}

.siris-select__control--invalid {
  border-color: var(--control-error);
  border-width: var(--border-strong);
}

.siris-select__control:disabled {
  background-color: var(--color-bg-disabled);
  border-color: var(--color-border-default);
  color: var(--color-fg-disabled);
  -webkit-text-fill-color: var(--color-fg-disabled);
  cursor: not-allowed;
}

.siris-select__icon {
  position: absolute;
  inset-block-start: 50%;
  inset-inline-end: var(--space-s12);
  inline-size: var(--icon-md);
  block-size: var(--icon-md);
  translate: 0 -50%;
  stroke-width: var(--icon-stroke);
  color: var(--control-fg);
  pointer-events: none;
}
</style>
