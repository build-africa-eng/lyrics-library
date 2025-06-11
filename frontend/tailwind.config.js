/** @type {import('tailwindcss').Config} */
import { zinc } from 'tailwindcss/colors'
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        zinc,
        primary: '#1e40af',
        secondary: '#60a5fa',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
  darkMode: 'class', // For Header.jsx dark mode toggle
};