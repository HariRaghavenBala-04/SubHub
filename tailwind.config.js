/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-deep':  '#080c10',
        'bg-panel': '#0f1318',
        'green':    '#00ff87',
        'amber':    '#ffb800',
        'red':      '#ff3d3d',
        'muted':    '#6b7a8d',
      },
      fontFamily: {
        heading: ['Rajdhani', 'sans-serif'],
        body:    ['DM Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
