/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        vacado: {
          red: '#FF0000',
          hover: '#CC0000',
          soft: '#FFF5F5',
          border: '#FFD0D0',
        },
        ink: '#0F0F0F',
        muted: '#606060',
        faint: '#909090',
      },
      fontFamily: {
        sans: ['Poppins', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
      },
    },
  },
  plugins: [],
};
