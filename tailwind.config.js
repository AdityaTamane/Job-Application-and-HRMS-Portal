/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Lighthouse brand — deep navy sea + warm beacon amber
        brand: {
          50: '#eef4fb',
          100: '#d6e4f5',
          200: '#adc9ea',
          300: '#7fa8db',
          400: '#4f83c8',
          500: '#2f63ad',
          600: '#234e8c',
          700: '#1d3f72',
          800: '#17325b',
          900: '#0f2444',
          950: '#0a1830',
        },
        beacon: {
          50: '#fff8eb',
          100: '#fdecc4',
          200: '#fbd88a',
          300: '#f9c04f',
          400: '#f7a825',
          500: '#f18f0c',
          600: '#d66f07',
          700: '#b1500a',
          800: '#8f3f10',
          900: '#763510',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(15,36,68,0.08), 0 1px 2px rgba(15,36,68,0.06)',
        lift: '0 10px 30px -10px rgba(15,36,68,0.25)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.25s ease-out',
      },
    },
  },
  plugins: [],
}
