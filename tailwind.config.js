export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: { gold: { DEFAULT: '#C9A227', light: '#E6C55A', dark: '#9A7B12' }, ink: '#0A0A0A' },
      fontFamily: { serif: ['"Playfair Display"', 'serif'], sans: ['Inter', 'sans-serif'] },
    },
  },
  plugins: [],
}
