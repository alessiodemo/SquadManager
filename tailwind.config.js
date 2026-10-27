import flowbiteReact from "flowbite-react/plugin/tailwindcss";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
    ".flowbite-react/class-list.json",
    ".flowbite-react\\class-list.json"
  ],
  theme: {
    extend: {
      colors: {
        pitch: {
          green: '#1a7a3c',
          dark: '#0f4d25',
        },
        sofa: {
          bg: '#0b1320',        // Sofascore deep sports navy
          card: 'rgba(19, 31, 51, 0.68)',      // Glass card surface
          cardHover: 'rgba(30, 52, 83, 0.78)', // Hover surface
          border: 'rgba(108, 146, 202, 0.2)',  // Glass border
          borderLight: 'rgba(125, 166, 230, 0.38)',
          blue: '#1b64e0',      // Sofascore signature blue
          blueHover: '#1552bc',
          blueLight: '#3b82f6',
          blueMuted: 'rgba(27, 100, 224, 0.15)',
          win: '#16a34a',       // Win green
          draw: '#ca8a04',      // Draw amber
          loss: '#dc2626',      // Loss red
          live: '#ef4444',      // Live pulse red
          text: '#f8fafc',      // Primary text
          muted: '#94a3b8',     // Secondary text
          dim: '#64748b',       // Dim text
          dark: 'rgba(5, 11, 22, 0.78)',      // Deepest contrast (inputs, score boxes)
        },
      },
    },
  },
  plugins: [flowbiteReact],
}