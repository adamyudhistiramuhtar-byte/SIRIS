<script setup lang="ts">
import { computed, useId } from 'vue';
import { AlertCircle } from 'lucide-vue-next';

// Pembungkus bidang formulir (design.md §5.2, profil keadaan F).
// Label selalu terlihat, hint dan error dikaitkan ke kontrol lewat aria-describedby.
// Kontrol (BaseInput/BaseSelect/native) diberikan lewat slot beserta atribut yang perlu dipasang.
const props = withDefaults(
  defineProps<{
    label: string;
    hint?: string;
    error?: string;
    required?: boolean;
    id?: string;
  }>(),
  { hint: '', error: '', required: false, id: undefined },
);

const uid = useId();
const controlId = computed(() => props.id ?? `${uid}-control`);
const hintId = computed(() => `${uid}-hint`);
const errorId = computed(() => `${uid}-error`);
const invalid = computed(() => props.error !== '');

const ariaDescribedby = computed(() => {
  const ids: string[] = [];
  if (props.hint !== '') ids.push(hintId.value);
  if (invalid.value) ids.push(errorId.value);
  return ids.length > 0 ? ids.join(' ') : undefined;
});
</script>

<template>
  <div class="siris-field">
    <label
      :for="controlId"
      class="siris-field__label"
    >
      {{ label }}
      <span
        v-if="required"
        class="siris-field__required"
      >(wajib diisi)</span>
    </label>
    <p
      v-if="hint"
      :id="hintId"
      class="siris-field__hint"
    >
      {{ hint }}
    </p>
    <slot
      :id="controlId"
      :aria-describedby="ariaDescribedby"
      :invalid="invalid"
      :required="required"
    />
    <p
      v-if="invalid"
      :id="errorId"
      class="siris-field__error"
      role="alert"
    >
      <AlertCircle
        class="siris-field__error-icon"
        aria-hidden="true"
      />
      <span>{{ error }}</span>
    </p>
  </div>
</template>

<style scoped>
.siris-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-s4);
  min-inline-size: var(--layout-field-min);
}

.siris-field__label {
  font-size: var(--type-label-size);
  line-height: var(--type-label-line-height);
  font-weight: var(--type-label-weight);
  color: var(--color-fg-default);
}

.siris-field__required {
  font-weight: var(--type-body-sm-weight);
  color: var(--color-fg-muted);
}

.siris-field__hint {
  margin: 0;
  font-size: var(--type-caption-size);
  line-height: var(--type-caption-line-height);
  color: var(--color-fg-muted);
}

.siris-field__error {
  display: flex;
  align-items: flex-start;
  gap: var(--space-s4);
  margin: 0;
  font-size: var(--type-caption-size);
  line-height: var(--type-caption-line-height);
  color: var(--control-error);
}

.siris-field__error-icon {
  flex: none;
  inline-size: var(--icon-sm);
  block-size: var(--icon-sm);
  margin-block-start: calc((var(--type-caption-line-height) * 1em - var(--icon-sm)) / 2);
  stroke-width: var(--icon-stroke);
}
</style>
