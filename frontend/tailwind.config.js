/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1e40af',
        secondary: '#60a5fa',
        zinc: {
          100: '#f4f4f5',
          400: '#a1a1aa',
          600: '#52525b',
          800: '#27272a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
  darkMode: 'class', // For Header.jsx dark mode toggle
};
