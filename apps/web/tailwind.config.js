/** @type {import('tailwindcss').Config} */
// Warna dan font dipetakan ke CSS custom properties hasil generate dari design.md §4.9
// (apps/web/src/styles/generated/tokens.css). Nama kelas `siris-*` dipertahankan agar halaman
// yang sudah ada tidak berubah; tidak ada registry warna kedua yang dikelola manual di sini.
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        siris: {
          primary: 'var(--color-accent-default)',
          'primary-hover': 'var(--color-accent-hover)',
          'primary-active': 'var(--color-accent-active)',
          'primary-light': 'var(--color-bg-active)',
          canvas: 'var(--color-bg-canvas)',
          card: 'var(--color-bg-surface)',
          ink: 'var(--color-fg-default)',
          muted: 'var(--color-fg-muted)',
          border: 'var(--color-border-default)',
          'border-strong': 'var(--color-border-strong)',
          success: 'var(--color-feedback-success-fg)',
          'success-bg': 'var(--color-feedback-success-bg)',
          warning: 'var(--color-feedback-warning-fg)',
          'warning-bg': 'var(--color-feedback-warning-bg)',
          danger: 'var(--color-feedback-danger-fg)',
          'danger-bg': 'var(--color-feedback-danger-bg)',
          info: 'var(--color-feedback-info-fg)',
          'info-bg': 'var(--color-feedback-info-bg)',
        },
      },
      fontFamily: {
        sans: 'var(--font-body)',
      },
    },
  },
  plugins: [],
};
