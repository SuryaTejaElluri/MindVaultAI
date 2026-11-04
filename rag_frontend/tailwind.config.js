/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        vault: {
          darkest: '#031716',
          dark:    '#032F30',
          teal:    '#0A7075',
          cyan:    '#0C969C',
          blue:    '#6BA3BE',
          slate:   '#274D60',
        },
      },
    },
  },
  plugins: [],
}
