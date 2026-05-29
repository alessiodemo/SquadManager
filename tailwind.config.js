/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        pitch: {
          green: '#1a7a3c',
          dark: '#0f4d25',
        },
      },
    },
  },
  plugins: [],
}
