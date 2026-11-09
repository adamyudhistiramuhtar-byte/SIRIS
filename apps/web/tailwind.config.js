/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        siris: {
          primary: '#0A6ED1',
          'primary-hover': '#0854A0',
          'primary-active': '#063D74',
          'primary-light': '#EBF3FB',
          canvas: '#F7F9FC',
          card: '#FFFFFF',
          ink: '#1D2D44',
          muted: '#526579',
          border: '#D8E2EC',
          'border-strong': '#8FA3B8',
          success: '#0E7C3A',
          'success-bg': '#E8F5E9',
          warning: '#B25900',
          'warning-bg': '#FFF3E0',
          danger: '#C5221F',
          'danger-bg': '#FDE8E8',
          info: '#0A6ED1',
          'info-bg': '#EBF3FB',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

