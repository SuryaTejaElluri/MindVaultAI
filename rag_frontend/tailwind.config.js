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
          black:   '#000000',
          darkest: '#050709',
          dark:    '#0c141a',
          card:    '#111c24',
          panel:   '#16242e',
          slate:   '#274D60',
          primary: '#274D60',
          accent:  '#366882',
          light:   '#4c8cae',
          blue:    '#8daec0',
          border:  '#274D60',
        },
      },
    },
  },
  plugins: [],
}
