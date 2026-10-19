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
        sofa: {
          bg: '#0b1320',        // Sofascore deep sports navy
          card: '#131f33',      // Card surface
          cardHover: '#182740', // Hover surface
          border: '#1e2f4a',    // Subtle border
          borderLight: '#2a3f62',
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
          dark: '#080d16',      // Deepest contrast (inputs, score boxes)
        },
      },
    },
  },
  plugins: [flowbiteReact],
}