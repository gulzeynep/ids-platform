/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        black: '#030303',
        glass: 'rgba(10, 10, 10, 0.7)',
        border: 'rgba(255, 255, 255, 0.05)',
        neonBlue: '#00d2ff',
        neonRed: '#ff0055',
      }
    },
  },
  backgroundImage: {
    'radial-gradient': 'radial-gradient(circle at 50% 50%, rgba(37, 99, 235, 0.1) 0%, transparent 50%)',
  },
  plugins: [],
}