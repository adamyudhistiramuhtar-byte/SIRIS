<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { ReferenceImportFlow } from '../../features/inbound/reference-import';
import { createUjiSimulator } from '../../features/inbound/uji-simulator';

// Kedua syarat diperlukan; build produksi tidak mengaktifkan simulator.
const enabled = import.meta.env.DEV && import.meta.env.VITE_ENABLE_IMPORT_SIMULATOR === 'true';
const flow = reactive(new ReferenceImportFlow(createUjiSimulator()));
const warehouse = ref('');
const file = ref<File>();
const acknowledged = ref(false);
const busy = computed(() => ['uploading', 'validating', 'committing'].includes(flow.state.phase));
const locked = computed(() => busy.value || flow.state.phase === 'unknown');
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
      <p
        class="mt-2"
        role="status"
      >
        MODE UJI — simulasi lokal; tidak ada data yang disimpan.
      </p>
      <p
        v-if="!enabled"
        class="mt-2"
        role="alert"
      >
        Sesi dan layanan impor belum tersedia. Simulasi hanya dapat digunakan pada lingkungan pengembangan.
      </p>
      <label
        for="warehouse"
        class="mt-4 block font-medium"
      >Kode gudang UJI</label>
      <input
        id="warehouse"
        v-model="warehouse"
        :disabled="!enabled || locked"
        class="mt-1 w-full rounded border border-siris-border-strong p-2 focus-visible:outline focus-visible:outline-2"
        @input="flow.reset(); acknowledged = false"
      >
      <label
        for="source-file"
        class="mt-4 block font-medium"
      >File UJI</label>
      <input
        id="source-file"
        type="file"
        :disabled="!enabled || locked"
        class="mt-1 block w-full"
        @change="selectFile"
      >
      <p class="mt-2 text-sm">
        Format, ukuran, dan isi file menunggu kontrak sumber. Pemilihan file tidak memvalidasi data.
      </p>
      <p
        v-if="file"
        class="mt-2"
      >
        File dipilih: {{ file.name }}
      </p>
      <button
        type="button"
        :disabled="!enabled || locked || !file || !warehouse.trim()"
        class="mt-4 rounded bg-siris-ink px-4 py-2 text-white disabled:opacity-50 focus-visible:outline focus-visible:outline-2"
        @click="prepare"
      >
        Jalankan simulasi validasi
      </button>
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
        <button
          type="button"
          :disabled="!acknowledged"
          class="mt-3 rounded bg-siris-ink px-4 py-2 text-white disabled:opacity-50"
          @click="commit"
        >
          Konfirmasi simulasi
        </button>
        <button
          type="button"
          class="ml-3 underline"
          @click="flow.reset(); acknowledged = false"
        >
          Batalkan
        </button>
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
        v-else-if="flow.state.phase === 'unknown'"
        role="alert"
      >
        Hasil belum diketahui. Periksa status batch; jangan mengirim ulang otomatis.
      </p>
    </section>
  </main>
</template>
