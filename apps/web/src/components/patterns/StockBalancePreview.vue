<script setup lang="ts">
import { computed, useId } from 'vue';
import {
  formatCutoffDate,
  formatQuantity,
  type StockPreviewCutoff,
  type StockPreviewMode,
  type StockPreviewRow,
} from '../../shared/import/stock-preview-types';

// Preview saldo dan cutoff impor stok (SRS-83, UC-09 / SCR-09). Komponen murni presentasi:
// - Nilai, satuan, dan cutoff tampil persis seperti dikirim layanan.
// - Tidak menghitung movement dan tidak menjumlah (tidak ada baris total).
// - Nilai kosong (`null`) ditulis "Tidak tersedia", bukan 0; nilai yang tidak sesuai pola
//   ditandai tidak valid dan tidak dikoreksi.
// - Jam cutoff tidak dikarang dari tanggal (CF-04 OPEN).
const props = withDefaults(
  defineProps<{
    rows: StockPreviewRow[];
    cutoff: StockPreviewCutoff | null;
    mode: StockPreviewMode;
    /** Jumlah baris menurut layanan; bila berbeda dari rows, komponen menyatakannya. */
    rowCount?: number;
    loading?: boolean;
    title?: string;
  }>(),
  { rowCount: undefined, loading: false, title: 'Preview saldo stok' },
);

const headingId = useId();
const cutoffDate = computed(() => formatCutoffDate(props.cutoff?.date));
const cutoffHasDateText = computed(() => props.cutoff?.date !== undefined);
const cutoffTime = computed(() => {
  const time = props.cutoff?.time;
  if (!time) return null;
  return props.cutoff?.timezone ? `pukul ${time} ${props.cutoff.timezone}` : `pukul ${time}`;
});
const modeLabel = computed(() =>
  props.mode === 'UJI' ? 'UJI (data simulasi)' : 'ACTUAL (data operasional)',
);
const partial = computed(
  () => props.rowCount !== undefined && props.rowCount !== props.rows.length,
);
const cells = computed(() =>
  props.rows.map((row) => ({ row, quantity: formatQuantity(row.systemQuantity) })),
);
</script>

<template>
  <section
    class="siris-stock-preview"
    :aria-labelledby="headingId"
    :aria-busy="loading"
  >
    <h3
      :id="headingId"
      class="siris-stock-preview__title"
    >
      {{ title }}
    </h3>

    <dl class="siris-stock-preview__meta">
      <div>
        <dt>Mode</dt>
        <dd data-testid="mode">
          {{ modeLabel }}
        </dd>
      </div>
      <div>
        <dt>Cutoff</dt>
        <dd data-testid="cutoff">
          <template v-if="cutoff === null">
            Belum tersedia dari layanan
          </template>
          <template v-else>
            <span v-if="cutoffDate">{{ cutoffDate }}</span>
            <span v-else-if="cutoffHasDateText">Tanggal tidak dapat dibaca</span>
            <span v-else>Tanggal tidak dikirim</span>
            <span v-if="cutoffTime">{{ ' ' }}{{ cutoffTime }}</span>
            <span v-else>{{ ' ' }}(jam tidak ditentukan)</span>
          </template>
        </dd>
      </div>
    </dl>

    <p
      v-if="cutoff === null && !loading"
      class="siris-stock-preview__notice"
      role="alert"
    >
      Cutoff belum tersedia, sehingga saldo ini belum dapat dibaca sebagai posisi pada tanggal tertentu.
    </p>

    <p
      v-if="loading"
      class="siris-stock-preview__note"
      role="status"
    >
      Memuat preview saldo.
    </p>
    <p
      v-else-if="rows.length === 0"
      class="siris-stock-preview__note"
    >
      Belum ada baris saldo yang dapat ditampilkan.
    </p>
    <template v-else>
      <p
        v-if="partial"
        class="siris-stock-preview__note"
        role="status"
      >
        Menampilkan {{ rows.length }} dari {{ rowCount }} baris menurut layanan.
      </p>
      <div
        class="siris-stock-preview__scroll"
        role="region"
        :aria-labelledby="headingId"
        tabindex="0"
      >
        <table class="siris-stock-preview__table">
          <caption class="sr-only">
            Saldo sistem per material pada cutoff yang dipilih
          </caption>
          <thead>
            <tr>
              <th scope="col">
                Baris
              </th>
              <th scope="col">
                Kode material
              </th>
              <th scope="col">
                Satuan
              </th>
              <th
                scope="col"
                class="siris-stock-preview__num"
              >
                Saldo sistem
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in cells"
              :key="`${item.row.rowNumber}-${item.row.materialCode}`"
            >
              <td>{{ item.row.rowNumber }}</td>
              <td>{{ item.row.materialCode }}</td>
              <td>{{ item.row.uom }}</td>
              <td class="siris-stock-preview__num">
                <template v-if="item.quantity.kind === 'value'">
                  {{ item.quantity.text }}
                </template>
                <span
                  v-else-if="item.quantity.kind === 'absent'"
                  class="siris-stock-preview__muted"
                >Tidak tersedia</span>
                <span
                  v-else
                  class="siris-stock-preview__invalid"
                >Nilai tidak valid: {{ item.quantity.raw }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </section>
</template>

<style scoped>
.siris-stock-preview {
  display: flex;
  flex-direction: column;
  gap: var(--space-s8);
  font-family: var(--font-body);
}

.siris-stock-preview__title {
  margin: 0;
  font-size: var(--type-h4-size);
  line-height: var(--type-h4-line-height);
  font-weight: var(--type-h4-weight);
  color: var(--color-fg-default);
}

.siris-stock-preview__meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-s8) var(--space-s24);
  margin: 0;
  font-size: var(--type-body-md-size);
  line-height: var(--type-body-md-line-height);
  color: var(--color-fg-default);
}

.siris-stock-preview__meta dt {
  font-size: var(--type-body-sm-size);
  color: var(--color-fg-muted);
}

.siris-stock-preview__meta dd {
  margin: 0;
}

.siris-stock-preview__notice,
.siris-stock-preview__note {
  margin: 0;
  font-size: var(--type-body-md-size);
  line-height: var(--type-body-md-line-height);
  color: var(--color-fg-default);
}

.siris-stock-preview__notice {
  padding: var(--space-s8) var(--space-s12);
  border: var(--border-default) solid var(--color-border-default);
  border-radius: var(--radius-surface);
  background-color: var(--color-feedback-warning-bg);
  color: var(--color-feedback-warning-fg);
}

.siris-stock-preview__scroll {
  overflow-x: auto;
  border: var(--border-default) solid var(--color-border-default);
  border-radius: var(--radius-surface);
}

.siris-stock-preview__table {
  inline-size: 100%;
  border-collapse: collapse;
  font-size: var(--type-body-sm-size);
  line-height: var(--type-body-sm-line-height);
}

.siris-stock-preview__table th,
.siris-stock-preview__table td {
  min-inline-size: var(--layout-table-cell-min);
  padding: var(--table-cell-padding);
  border-block-end: var(--border-default) solid var(--color-border-default);
  text-align: start;
  vertical-align: top;
  overflow-wrap: anywhere;
}

.siris-stock-preview__table th {
  background-color: var(--table-header);
  font-weight: var(--type-label-weight);
}

.siris-stock-preview__table .siris-stock-preview__num {
  text-align: end;
  font-variant-numeric: tabular-nums;
}

.siris-stock-preview__muted {
  color: var(--color-fg-muted);
}

.siris-stock-preview__invalid {
  color: var(--color-feedback-danger-fg);
  font-weight: var(--type-label-weight);
}
</style>
