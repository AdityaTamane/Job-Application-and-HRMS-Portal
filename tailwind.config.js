/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
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
        lift: '0 18px 40px -16px rgba(15,36,68,0.35)',
        glow: '0 0 0 1px rgba(47,99,173,0.12), 0 12px 32px -12px rgba(47,99,173,0.45)',
        'glow-beacon': '0 10px 30px -10px rgba(241,143,12,0.55)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #2f63ad 0%, #4f83c8 100%)',
        'beacon-gradient': 'linear-gradient(135deg, #f7a825 0%, #f18f0c 100%)',
        'hero-glow': 'radial-gradient(60% 60% at 20% 10%, rgba(79,131,200,0.22) 0%, rgba(79,131,200,0) 60%), radial-gradient(50% 50% at 90% 20%, rgba(247,168,37,0.18) 0%, rgba(247,168,37,0) 55%)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.97)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.25s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
        float: 'float 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
