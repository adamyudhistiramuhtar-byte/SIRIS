<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import AlertBanner from '../../components/primitives/AlertBanner.vue';
import BaseButton from '../../components/primitives/BaseButton.vue';
import BaseInput from '../../components/primitives/BaseInput.vue';
import FormField from '../../components/primitives/FormField.vue';
import { ReferenceImportFlow } from '../../features/inbound/reference-import';
import { createUjiSimulator } from '../../features/inbound/uji-simulator';

// Kedua syarat diperlukan; build produksi tidak mengaktifkan simulator.
const enabled = import.meta.env.DEV && import.meta.env.VITE_ENABLE_IMPORT_SIMULATOR === 'true';
const flow = reactive(new ReferenceImportFlow(createUjiSimulator()));
const warehouse = ref('');
const file = ref<File>();
const acknowledged = ref(false);
const busy = computed(() => ['uploading', 'validating', 'committing'].includes(flow.state.phase));
const locked = computed(() => busy.value || flow.state.phase === 'unknown' || flow.state.phase === 'preparation-unknown');
function selectFile(event: Event) {
  file.value = (event.target as HTMLInputElement).files?.[0];
  flow.reset(); acknowledged.value = false;
}
async function prepare() {
  if (!enabled) return;
  // Konteks ini hanya simulasi eksplisit, bukan bukti session atau otorisasi ACTUAL.
  await flow.prepare(file.value, { warehouseId: warehouse.value.trim(), mode: 'UJI' }, true);
}
async function commit() {
  if (!enabled || !acknowledged.value || flow.state.phase !== 'preview') return;
  await flow.confirm(crypto.randomUUID());
}
</script>

<template>
  <main class="mx-auto max-w-6xl p-6">
    <nav
      aria-label="Breadcrumb"
      class="mb-3 text-sm text-siris-muted"
    >
      Supplier Inbound / Impor Referensi
    </nav>
    <h1 class="text-2xl font-semibold">
      Impor Referensi Inbound
    </h1>
    <p class="mt-2 text-siris-muted">
      Siapkan referensi kebutuhan inbound dan periksa hasil validasi sebelum konfirmasi.
    </p>
    <section
      class="mt-6 rounded-lg border border-siris-border bg-siris-card p-5"
      aria-labelledby="context-title"
    >
      <h2
        id="context-title"
        class="text-lg font-semibold"
      >
        Konteks dan file
      </h2>
      <AlertBanner
        class="mt-2"
        variant="info"
      >
        MODE UJI — simulasi lokal; tidak ada data yang disimpan.
      </AlertBanner>
      <AlertBanner
        v-if="!enabled"
        class="mt-2"
        variant="warning"
      >
        Sesi dan layanan impor belum tersedia. Simulasi hanya dapat digunakan pada lingkungan pengembangan.
      </AlertBanner>
      <FormField
        id="warehouse"
        v-slot="field"
        class="mt-4"
        label="Kode gudang UJI"
        required
      >
        <BaseInput
          v-model="warehouse"
          v-bind="field"
          :disabled="!enabled || locked"
          @input="flow.reset(); acknowledged = false"
        />
      </FormField>
      <FormField
        id="source-file"
        v-slot="field"
        class="mt-4"
        label="File UJI"
        required
        hint="Format, ukuran, dan isi file menunggu kontrak sumber. Pemilihan file tidak memvalidasi data."
      >
        <input
          v-bind="field"
          type="file"
          :disabled="!enabled || locked"
          class="block w-full"
          @change="selectFile"
        >
      </FormField>
      <p
        v-if="file"
        class="mt-2"
      >
        File dipilih: {{ file.name }}
      </p>
      <BaseButton
        class="mt-4"
        :disabled="!enabled || locked || !file || !warehouse.trim()"
        disabled-reason="Aktifkan simulasi dan pilih gudang serta file UJI sebelum melanjutkan."
        :loading="busy"
        loading-label="Memproses simulasi…"
        @click="prepare"
      >
        Jalankan simulasi validasi
      </BaseButton>
    </section>
    <section
      class="mt-4 rounded-lg border border-siris-border bg-siris-card p-5"
      aria-labelledby="result-title"
      aria-live="polite"
    >
      <h2
        id="result-title"
        class="text-lg font-semibold"
      >
        Validasi dan preview
      </h2>
      <p v-if="flow.state.phase === 'initial'">
        Pilih gudang dan file UJI untuk memulai simulasi.
      </p>
      <p v-else-if="busy">
        Memproses simulasi…
      </p>
      <p
        v-else-if="flow.state.phase === 'error'"
        role="alert"
      >
        {{ flow.state.message }}
      </p>
      <template v-else-if="flow.state.phase === 'preview'">
        <p>Batch simulasi: {{ flow.state.preview.batchId }}</p>
        <p
          v-for="warning in flow.state.preview.warnings"
          :key="warning"
          role="status"
        >
          {{ warning }}
        </p>
        <p>Tidak ada data baris untuk ditampilkan. Kontrak preview masih menunggu review.</p>
        <label class="mt-3 block"><input
          v-model="acknowledged"
          type="checkbox"
        > Saya memahami bahwa ini hanya simulasi UJI.</label>
        <BaseButton
          class="mt-3"
          :disabled="!acknowledged"
          disabled-reason="Akui bahwa ini simulasi UJI sebelum konfirmasi."
          @click="commit"
        >
          Konfirmasi simulasi
        </BaseButton>
        <BaseButton
          class="ml-3"
          variant="tertiary"
          @click="flow.reset(); acknowledged = false"
        >
          Batalkan
        </BaseButton>
      </template>
      <p v-else-if="flow.state.phase === 'success'">
        Simulasi selesai untuk {{ flow.state.receipt.batchId }}. Tidak ada transaksi database.
      </p>
      <p
        v-else-if="flow.state.phase === 'expired'"
        role="alert"
      >
        Preview kedaluwarsa. Jalankan validasi ulang sebelum konfirmasi.
      </p>
      <p
        v-else-if="flow.state.phase === 'preparation-unknown'"
        role="alert"
      >
        Hasil persiapan belum diketahui<span v-if="flow.state.batchId"> untuk batch {{ flow.state.batchId }}</span>. Periksa status melalui petugas; jangan mengirim ulang otomatis.
      </p>
      <p
        v-else-if="flow.state.phase === 'unknown'"
        role="alert"
      >
        Hasil belum diketahui. Periksa status batch; jangan mengirim ulang otomatis.
      </p>
    </section>
  </main>
</template>
