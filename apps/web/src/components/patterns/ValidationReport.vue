<script setup lang="ts">
import { computed, useId } from 'vue';
import type { ImportIssue } from '../../shared/import/import-wizard-types';

// Laporan baris hasil validasi (design.md §5, ValidationReport). Komponen hanya menampilkan
// temuan yang dikirim layanan: baris/kolom yang tidak ada ditulis "—", bukan dikarang.
// Hasil INVALID adalah hasil validasi yang sah, bukan kegagalan transport.
const props = withDefaults(defineProps<{ issues: ImportIssue[]; title?: string }>(), {
  title: 'Laporan validasi',
});

const headingId = useId();
const count = computed(() => props.issues.length);
</script>

<template>
  <section
    class="siris-report"
    :aria-labelledby="headingId"
  >
    <h3
      :id="headingId"
      class="siris-report__title"
    >
      {{ title }}
    </h3>
    <p
      v-if="count === 0"
      class="siris-report__empty"
    >
      Layanan tidak mengirim rincian baris. Berkas tidak dapat dianggap valid.
    </p>
    <template v-else>
      <p
        class="siris-report__summary"
        role="status"
      >
        {{ count }} temuan perlu diperbaiki.
      </p>
      <div
        class="siris-report__scroll"
        role="region"
        :aria-labelledby="headingId"
        tabindex="0"
      >
        <table class="siris-report__table">
          <caption class="sr-only">
            Daftar temuan validasi per baris
          </caption>
          <thead>
            <tr>
              <th scope="col">
                Baris
              </th>
              <th scope="col">
                Kolom
              </th>
              <th scope="col">
                Pesan
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(issue, index) in issues"
              :key="`${issue.row ?? 'x'}-${issue.field ?? 'x'}-${index}`"
            >
              <td>{{ issue.row ?? '—' }}</td>
              <td>{{ issue.field ?? '—' }}</td>
              <td>{{ issue.message }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </section>
</template>

<style scoped>
.siris-report {
  display: flex;
  flex-direction: column;
  gap: var(--space-s8);
  font-family: var(--font-body);
}

.siris-report__title {
  margin: 0;
  font-size: var(--type-h4-size);
  line-height: var(--type-h4-line-height);
  font-weight: var(--type-h4-weight);
  color: var(--color-fg-default);
}

.siris-report__summary,
.siris-report__empty {
  margin: 0;
  font-size: var(--type-body-md-size);
  line-height: var(--type-body-md-line-height);
  color: var(--color-fg-default);
}

.siris-report__scroll {
  overflow-x: auto;
  border: var(--border-default) solid var(--color-border-default);
  border-radius: var(--radius-surface);
}

.siris-report__table {
  inline-size: 100%;
  border-collapse: collapse;
  font-size: var(--type-body-sm-size);
  line-height: var(--type-body-sm-line-height);
}

.siris-report__table th,
.siris-report__table td {
  min-inline-size: var(--layout-table-cell-min);
  padding: var(--table-cell-padding);
  border-block-end: var(--border-default) solid var(--color-border-default);
  text-align: start;
  vertical-align: top;
  overflow-wrap: anywhere;
}

.siris-report__table th {
  background-color: var(--table-header);
  font-weight: var(--type-label-weight);
}
</style>
