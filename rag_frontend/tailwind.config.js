/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Magentix Studio — light tokens
        ink:            '#18181B',
        surface:        '#F8F8F9',
        'surface-raised': '#EDEDF0',
        'surface-strong': '#DCDCE0',
        hairline:       '#DCDCE0',
        'accent-link':  '#3563AD',
        muted:          '#6B6B70',
        // dark mode tokens
        'dark-surface': '#17171A',
        'dark-raised':  '#2B2B30',
        'dark-ink':     '#EDEDEF',
        'dark-muted':   '#98989F',
        'dark-border':  '#38383E',
        'dark-link':    '#86A8E6',
      },
      fontFamily: {
        fraunces:     ['Fraunces', 'Georgia', 'serif'],
        hanken:       ['"Hanken Grotesk"', 'system-ui', 'sans-serif'],
        'space-grotesk': ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        'space-mono': ['"Space Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        xs:   '7px',
        sm:   '12px',
        md:   '15px',
        lg:   '16px',
        xl:   '22px',
        '2xl': '24px',
        '3xl': '64px',
      },
      boxShadow: {
        ambient: '0px 4px 20px 0px rgba(10,10,12,0.06)',
        pill:    '0px 0.98px 11.74px 0px rgba(0,0,0,0.08)',
        card:    '0px 2px 12px 0px rgba(10,10,12,0.08)',
      },
    },
  },
  plugins: [],
}
