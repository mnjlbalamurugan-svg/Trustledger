/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        plum: {
          950: '#120919',
          900: '#1a0e23',
          850: '#20112c',
          800: '#24132F', // Main Deep Plum
          700: '#321a42',
          600: '#432359',
          border: '#382247',
        },
        charcoal: {
          950: '#0f0e13',
          900: '#141218',
          850: '#17151C', // Analytical surface
          800: '#1f1c26',
          750: '#26222f',
          700: '#302b3b',
          border: '#2a2536'
        },
        violet: {
          electric: '#8B5CF6',
          deep: '#7C3AED',
          subtle: 'rgba(139, 92, 246, 0.15)',
        },
        coral: {
          vibrant: '#F05A5A',
          dark: '#DC2626',
          subtle: 'rgba(240, 90, 90, 0.15)',
        },
        amber: {
          warm: '#F4A340',
          dark: '#D97706',
          subtle: 'rgba(244, 163, 64, 0.15)',
        },
        mint: {
          fresh: '#62D6A7',
          dark: '#059669',
          subtle: 'rgba(98, 214, 167, 0.15)',
        },
        cream: {
          50: '#FFFDF9',
          100: '#FFF7EA', // Cream card
          200: '#F7EEDB',
          border: '#E8DCBF'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'Consolas', 'monospace']
      }
    },
  },
  plugins: [],
}
