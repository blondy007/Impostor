/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './index.tsx', './App.tsx', './components/**/*.{ts,tsx}', './screens/**/*.{ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [require('tailwindcss-animate')],
};
