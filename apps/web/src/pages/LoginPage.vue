<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-vue-next';

const router = useRouter();

const username = ref('yudha');
const password = ref('password123');
const showPassword = ref(false);
const errorMessage = ref('');
const isLoading = ref(false);

function handleSubmit() {
  errorMessage.value = '';

  if (!username.value.trim() || !password.value.trim()) {
    errorMessage.value = 'Nama pengguna dan kata sandi wajib diisi.';
    return;
  }

  isLoading.value = true;
  // Simulasi autentikasi fondasi S1-02 (auth sesungguhnya pada task S1-03)
  setTimeout(() => {
    isLoading.value = false;
    router.push('/');
  }, 400);
}
</script>

<template>
  <div class="min-h-screen bg-siris-canvas flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md text-center">
      <!-- Teks SIRIS murni tanpa logo -->
      <h1 class="text-3xl font-bold tracking-tight text-siris-primary">
        SIRIS
      </h1>
      <p class="mt-1 text-sm font-medium text-siris-ink">
        Sistem Informasi Rekonsiliasi & Inbound
      </p>
      <p class="text-xs text-siris-muted">
        PT Harina Chemicals Industry — Capstone 42
      </p>
    </div>

    <div class="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
      <div class="bg-white py-8 px-6 shadow-sm rounded-lg border border-siris-border sm:px-8">
        <!-- Error Notice -->
        <div
          v-if="errorMessage"
          class="mb-4 p-3 rounded bg-red-50 border border-red-200 flex items-start gap-2 text-xs text-siris-danger"
        >
          <AlertCircle class="w-4 h-4 shrink-0 mt-0.5" />
          <span>{{ errorMessage }}</span>
        </div>

        <form
          class="space-y-4"
          @submit.prevent="handleSubmit"
        >
          <div>
            <label
              for="username"
              class="block text-xs font-semibold text-siris-ink uppercase tracking-wider"
            >
              Nama Pengguna
            </label>
            <div class="mt-1 relative rounded-md">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-siris-muted">
                <User class="h-4 w-4" />
              </div>
              <input
                id="username"
                v-model="username"
                type="text"
                required
                autocomplete="username"
                class="block w-full pl-9 pr-3 py-2 text-sm border border-siris-border rounded focus:outline-none focus:ring-2 focus:ring-siris-primary focus:border-siris-primary"
                placeholder="Masukkan username"
              >
            </div>
          </div>

          <div>
            <label
              for="password"
              class="block text-xs font-semibold text-siris-ink uppercase tracking-wider"
            >
              Kata Sandi
            </label>
            <div class="mt-1 relative rounded-md">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-siris-muted">
                <Lock class="h-4 w-4" />
              </div>
              <input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                required
                autocomplete="current-password"
                class="block w-full pl-9 pr-10 py-2 text-sm border border-siris-border rounded focus:outline-none focus:ring-2 focus:ring-siris-primary focus:border-siris-primary"
                placeholder="Masukkan kata sandi"
              >
              <button
                type="button"
                class="absolute inset-y-0 right-0 pr-3 flex items-center text-siris-muted hover:text-siris-ink"
                @click="showPassword = !showPassword"
              >
                <EyeOff
                  v-if="showPassword"
                  class="h-4 w-4"
                />
                <Eye
                  v-else
                  class="h-4 w-4"
                />
              </button>
            </div>
          </div>

          <div class="pt-2">
            <button
              type="submit"
              :disabled="isLoading"
              class="w-full flex justify-center py-2 px-4 border border-transparent rounded text-sm font-semibold text-white bg-siris-primary hover:bg-siris-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-siris-primary disabled:opacity-50 transition-colors"
            >
              <span v-if="isLoading">Memproses...</span>
              <span v-else>Masuk ke Aplikasi</span>
            </button>
          </div>
        </form>

        <div class="mt-6 pt-4 border-t border-slate-100 text-center">
          <p class="text-[11px] text-siris-muted">
            Mode fondasi S1-02: Autentikasi penuh dengan cookie-session diimplementasikan pada task S1-03.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

