/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: { orange: { DEFAULT: '#FF581C', 600: '#E84A10' }, ink: '#0B0B0B', gold: '#E9A322', cream: '#FFF5E5', charcoal: '#222222', wa: '#25D366', obsidian: '#111111' },
      fontFamily: { display: ['Anton', 'Barlow Condensed', 'Impact', 'sans-serif'], sans: ['Manrope', 'system-ui', 'sans-serif'], ar: ['Cairo', 'Manrope', 'sans-serif'] },
    },
  },
  plugins: [],
}
