<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import AlertBanner from '../../components/primitives/AlertBanner.vue';
import BaseSelect from '../../components/primitives/BaseSelect.vue';
import FormField from '../../components/primitives/FormField.vue';
import StatusBadge from '../../components/primitives/StatusBadge.vue';
import expectedFixture from '../../../../../database/fixtures/uji/expected.proposed-0.1.json';
import commitmentFixture from '../../../../../database/fixtures/uji/commitment.proposed-0.1.json';
import {
  buildInboundHistory,
  formatDate,
  formatEventAt,
  type CommitmentInput,
  type ExpectedInput,
  type InboundHistory,
} from '../../shared/inbound/inbound-history';

// SCR-07 /inbound/history (UC-07, SRS-67). Menampilkan histori janji supplier (INITIAL dan CHANGE)
// per inbound, berdampingan dengan tanggal kebutuhan yang tidak pernah tertimpa janji.
// Batas:
// - Sumber bawaan adalah fixture UJI proposed-0.1 di sisi klien, bukan API. Tidak ada bukti integrasi.
// - Halaman hanya baca. Tidak menghitung keterlambatan atau mismatch (OD-06 masih OPEN).
// - Urutan event menurut event_at; aturan urutan resmi (CF-06) masih OPEN.
// `history` dapat diinjeksi agar halaman dapat diuji tanpa layanan nyata.
const props = defineProps<{ history?: InboundHistory }>();

const defaultHistory = buildInboundHistory(
  (expectedFixture.rows as { normalized: ExpectedInput }[]).map((row) => row.normalized),
  (commitmentFixture.rows as { normalized: CommitmentInput }[]).map((row) => row.normalized),
);

const history = computed(() => props.history ?? defaultHistory);
const selected = ref('');

watch(
  history,
  (value) => {
    if (!value.entries.some((entry) => entry.sourceRef === selected.value)) {
      selected.value = value.entries[0]?.sourceRef ?? '';
    }
  },
  { immediate: true },
);

const options = computed(() =>
  history.value.entries.map((entry) => ({ value: entry.sourceRef, label: entry.sourceRef })),
);
const entry = computed(() => history.value.entries.find((item) => item.sourceRef === selected.value) ?? null);
</script>

<template>
  <div class="siris-inbound-history">
    <header>
      <p class="siris-inbound-history__uc">
        UC-07
      </p>
      <h1 class="siris-inbound-history__title">
        Riwayat Inbound
      </h1>
      <p class="siris-inbound-history__lead">
        Penelusuran kronologis janji supplier (INITIAL dan CHANGE) untuk inbound terpilih. Tanggal
        kebutuhan tidak pernah tertimpa oleh janji.
      </p>
    </header>

    <AlertBanner
      variant="info"
      title="Data simulasi (UJI), hanya lihat"
    >
      Halaman ini memakai fixture UJI di sisi klien dan belum terhubung ke API. Tidak ada aksi
      mengubah data. Keterlambatan dan selisih tidak dihitung karena aturannya belum diputuskan.
      Mode ACTUAL belum diaktifkan.
    </AlertBanner>

    <AlertBanner
      v-if="history.orphanEvents.length > 0"
      variant="warning"
      title="Event tanpa referensi inbound"
    >
      {{ history.orphanEvents.length }} event janji merujuk inbound yang tidak ada pada data
      EXPECTED (MISSING_REFERENCE) dan tidak ditampilkan pada riwayat:
      {{ history.orphanEvents.map((event) => event.event_ref).join(', ') }}.
    </AlertBanner>

    <p
      v-if="history.entries.length === 0"
      class="siris-inbound-history__empty"
    >
      Belum ada data inbound untuk ditampilkan.
    </p>

    <template v-else>
      <FormField
        label="Inbound"
        hint="Pilih referensi inbound untuk melihat riwayat janjinya."
      >
        <template #default="slotProps">
          <BaseSelect
            v-bind="slotProps"
            v-model="selected"
            :options="options"
          />
        </template>
      </FormField>

      <section
        v-if="entry"
        class="siris-inbound-history__detail"
        aria-label="Ringkasan inbound terpilih"
      >
        <dl class="siris-inbound-history__summary">
          <div>
            <dt>Material</dt>
            <dd>{{ entry.materialCode }}</dd>
          </div>
          <div>
            <dt>Supplier</dt>
            <dd>{{ entry.supplierCode }}</dd>
          </div>
          <div>
            <dt>Kuantitas diharapkan</dt>
            <dd>{{ entry.expectedQuantity }} {{ entry.uom }}</dd>
          </div>
          <div>
            <dt>Tanggal kebutuhan</dt>
            <dd data-testid="requested-date">
              {{ formatDate(entry.requestedDate) }}
            </dd>
          </div>
          <div>
            <dt>Janji saat ini</dt>
            <dd data-testid="current-promise">
              {{ entry.currentPromisedDate ? formatDate(entry.currentPromisedDate) : 'Belum ada janji' }}
            </dd>
          </div>
        </dl>

        <AlertBanner
          v-if="entry.sequenceIssue === 'CHANGE_WITHOUT_INITIAL'"
          variant="warning"
          title="Urutan janji tidak sah"
        >
          Riwayat dimulai dari event CHANGE tanpa INITIAL sebelumnya. Event ditampilkan apa adanya
          dan perlu diperiksa pada sumber.
        </AlertBanner>

        <p
          v-if="entry.events.length === 0"
          class="siris-inbound-history__empty"
        >
          Belum ada janji supplier untuk inbound ini.
        </p>

        <table
          v-else
          class="siris-inbound-history__table"
        >
          <caption>
            Riwayat janji untuk {{ entry.sourceRef }}, urut menurut waktu event
          </caption>
          <thead>
            <tr>
              <th scope="col">
                Referensi event
              </th>
              <th scope="col">
                Jenis
              </th>
              <th scope="col">
                Tanggal janji
              </th>
              <th scope="col">
                Waktu event
              </th>
              <th scope="col">
                Keterangan
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="event in entry.events"
              :key="event.eventRef"
            >
              <td>{{ event.eventRef }}</td>
              <td>{{ event.eventType }}</td>
              <td>{{ formatDate(event.promisedDate) }}</td>
              <td>{{ formatEventAt(event.eventAt) }}</td>
              <td>
                <StatusBadge :variant="event.isCurrent ? 'info' : 'neutral'">
                  {{ event.isCurrent ? 'Janji saat ini' : 'Riwayat' }}
                </StatusBadge>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </template>
  </div>
</template>

<style scoped>
.siris-inbound-history {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.siris-inbound-history__uc {
  margin: 0;
  font-size: 0.75rem;
  font-weight: 700;
}
.siris-inbound-history__title {
  margin: 0.25rem 0 0.5rem;
  font-size: 1.5rem;
  font-weight: 700;
}
.siris-inbound-history__lead,
.siris-inbound-history__empty {
  margin: 0;
}
.siris-inbound-history__detail {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.siris-inbound-history__summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: 0.75rem 1.5rem;
  margin: 0;
}
.siris-inbound-history__summary dt {
  font-size: 0.75rem;
  font-weight: 600;
}
.siris-inbound-history__summary dd {
  margin: 0.125rem 0 0;
}
.siris-inbound-history__table {
  width: 100%;
  border-collapse: collapse;
}
.siris-inbound-history__table caption {
  text-align: start;
  padding-block-end: 0.5rem;
  font-weight: 600;
}
.siris-inbound-history__table th,
.siris-inbound-history__table td {
  padding: 0.5rem 0.75rem;
  text-align: start;
  border-block-end: 1px solid var(--color-border-strong, #cbd5e1);
}
@media (max-width: 40rem) {
  .siris-inbound-history__table {
    display: block;
    overflow-x: auto;
  }
}
</style>
