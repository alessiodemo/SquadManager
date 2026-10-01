import flowbiteReact from "flowbite-react/plugin/tailwindcss";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
    ".flowbite-react/class-list.json"
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
  plugins: [flowbiteReact],
}