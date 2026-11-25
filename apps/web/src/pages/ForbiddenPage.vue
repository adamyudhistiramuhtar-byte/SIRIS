<script setup lang="ts">
import { ShieldAlert } from 'lucide-vue-next';
</script>

<template>
  <div
    class="p-6 rounded-lg bg-white border border-siris-border space-y-3"
    role="alert"
  >
    <div class="flex items-center gap-2 text-siris-ink">
      <ShieldAlert class="w-5 h-5 text-siris-danger" />
      <h2 class="text-base font-semibold">
        Halaman tidak tersedia untuk peran atau mode saat ini
      </h2>
    </div>
    <p class="text-sm text-siris-muted max-w-xl">
      Anda tidak memiliki akses ke halaman yang diminta pada konteks saat ini.
      Gunakan menu di samping untuk membuka halaman yang tersedia.
    </p>
    <router-link
      to="/"
      class="inline-flex text-sm font-medium text-siris-primary hover:underline"
    >
      Kembali ke Beranda
    </router-link>
  </div>
</template>
