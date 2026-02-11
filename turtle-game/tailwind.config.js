/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'matrix-green': '#00FF41',
        'game-bg': '#0b0f0f',
        'card-bg': '#1a1f1f',
      },
    },
  },
  plugins: [],
}
