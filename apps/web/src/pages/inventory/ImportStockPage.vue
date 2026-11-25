<script setup lang="ts">
import { computed } from 'vue';
import AlertBanner from '../../components/primitives/AlertBanner.vue';
import ImportWizard from '../../components/patterns/ImportWizard.vue';
import StockBalancePreview from '../../components/patterns/StockBalancePreview.vue';
import { sessionStore, type SessionStore } from '../../shared/session/session-context';
import { useImportFlow, type ImportFlowService } from '../../shared/import/use-import-flow';
import {
  createStockFixtureService,
  type StockPreviewSource,
} from '../../shared/import/stock-fixture-service';

// SCR-09 /inventory/import-stock (UC-09, SRS-25). Halaman ini memasang ImportWizard (SRS-53)
// dan preview saldo/cutoff (SRS-83) pada adapter fixture QTY AKHIR.
// Batas:
// - Layanan bawaan adalah fixture UJI di sisi klien, bukan API. Tidak ada bukti integrasi.
// - Simpan tidak tersedia sampai commit atomik (SRS-52) dan audit (SRS-54) ada.
// - Mode ACTUAL ditahan; frontend tidak menggantikan otorisasi di server.
// `session`, `service`, dan `source` dapat diinjeksi agar halaman dapat diuji tanpa layanan nyata.
const props = defineProps<{
  session?: SessionStore;
  service?: ImportFlowService;
  source?: StockPreviewSource;
}>();

const fixture = props.service && props.source ? null : createStockFixtureService();
const flow = useImportFlow(
  props.session ?? sessionStore,
  props.service ?? (fixture as NonNullable<typeof fixture>).service,
);
const source = props.source ?? (fixture as NonNullable<typeof fixture>).source;

const parsed = computed(() =>
  flow.state.value.phase === 'preview' ? (source.get(flow.state.value.preview.batchId) ?? null) : null,
);
</script>

<template>
  <div class="siris-import-stock">
    <header class="siris-import-stock__header">
      <p class="siris-import-stock__uc">
        UC-09
      </p>
      <h1 class="siris-import-stock__title">
        Impor Data Stok
      </h1>
      <p class="siris-import-stock__lead">
        Impor snapshot saldo akhir stok (QTY AKHIR) gudang. Nilai saldo diambil dari QTY AKHIR dan
        tidak dijumlah dari pergerakan.
      </p>
    </header>

    <AlertBanner
      variant="info"
      title="Data simulasi (UJI)"
    >
      Halaman ini memakai adapter fixture UJI di sisi klien. Belum terhubung ke API, dan Simpan
      belum tersedia sampai commit atomik dan audit selesai. Mode ACTUAL belum diaktifkan.
    </AlertBanner>

    <AlertBanner
      v-if="flow.contextNotice.value"
      variant="warning"
      title="Perubahan konteks ditolak"
    >
      {{ flow.contextNotice.value }}
    </AlertBanner>

    <ImportWizard
      import-label="Saldo Stok (QTY AKHIR)"
      :accept="['.json']"
      :context="flow.context.value"
      :state="flow.state.value"
      :file="flow.file.value"
      :upload-progress="flow.uploadProgress.value"
      @select-file="flow.handlers.selectFile"
      @change-context="flow.handlers.changeContext"
      @submit="flow.handlers.submit"
      @confirm="flow.handlers.confirm"
      @cancel="flow.handlers.cancel"
      @back="flow.handlers.back"
      @revalidate="flow.handlers.revalidate"
      @check-status="flow.handlers.checkStatus"
      @restart="flow.handlers.restart"
    />

    <StockBalancePreview
      v-if="parsed"
      :rows="parsed.rows"
      :cutoff="parsed.cutoff"
      :mode="flow.context.value.mode"
      :row-count="parsed.rows.length"
    />
  </div>
</template>

<style scoped>
.siris-import-stock {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.siris-import-stock__uc {
  margin: 0;
  font-size: 0.75rem;
  font-weight: 700;
}
.siris-import-stock__title {
  margin: 0.25rem 0 0.5rem;
  font-size: 1.5rem;
  font-weight: 700;
}
.siris-import-stock__lead {
  margin: 0;
}
</style>
