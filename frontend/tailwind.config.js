/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // SOC Teması için özel renklerimizi buraya ekleyebiliriz
        background: "#050505",
        card: "#0a0a0a",
      }
    },
  },
  plugins: [],
}