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
          midnight: '#03122F',
          navy:     '#19305C',
          slate:    '#413B61',
          mauve:    '#AE7DAC',
          blush:    '#F3DADF',
          coral:    '#F1916D',
        },
      },
    },
  },
  plugins: [],
}
