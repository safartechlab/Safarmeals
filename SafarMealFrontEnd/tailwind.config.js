/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff5ed',
          100: '#ffe6d3',
          200: '#ffcaaa',
          300: '#ffa374',
          400: '#ff723b',
          500: '#ff6b00', // Core theme primary color
          600: '#e64e00',
          700: '#bf3600',
          800: '#972800',
          900: '#7c2200',
          950: '#430d00',
        },
        dark: {
          50: '#f8fafc',
          100: '#f1f5f9',
          300: '#cbd5e1',
          500: '#64748b',
          800: '#1e293b',
          900: '#0f172a', // Background dark charcoal
          950: '#020617'
        }
      },
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
        inter: ['Inter', 'sans-serif']
      },
      boxShadow: {
        premium: '0 10px 30px -15px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        glow: '0 0 20px rgba(255, 107, 0, 0.15)',
        glass: '0 8px 32px 0 rgba(31, 38, 135, 0.07)'
      }
    },
  },
  plugins: [],
}
