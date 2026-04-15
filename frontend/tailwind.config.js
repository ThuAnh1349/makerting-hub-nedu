/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        headline: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.25s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      colors: {
        'nedu-primary': {
          DEFAULT: '#1B4332',
          50: '#E8F5EE',
          100: '#C5E4D2',
          200: '#9ECFB2',
          300: '#77BA92',
          400: '#50A572',
          500: '#1B4332',
          600: '#163828',
          700: '#112C1F',
          800: '#0C2116',
          900: '#07160D',
        },
        'nedu-accent': {
          DEFAULT: '#D4AF37',
          50: '#FBF5E0',
          100: '#F5E8B2',
          200: '#EDDA80',
          300: '#E5CB4E',
          400: '#DCBD1F',
          500: '#D4AF37',
          600: '#B8962F',
          700: '#9C7D27',
          800: '#80641F',
          900: '#644B17',
        },
      },
    },
  },
  plugins: [],
}
