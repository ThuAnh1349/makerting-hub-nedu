/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Roboto', 'system-ui', 'sans-serif'],
        body: ['Roboto', 'system-ui', 'sans-serif'],
        headline: ['Roboto', 'system-ui', 'sans-serif'],
      },
      colors: {
        'nedu-primary': {
          DEFAULT: '#2d9b6b',
          dark: '#1a5c46',
          light: 'rgba(45,155,107,0.1)',
          50: '#f0fdf6',
          100: '#dcfce8',
          200: '#bbf7d2',
          300: '#86efb0',
          400: '#4ade80',
          500: '#2d9b6b',
          600: '#22c575',
          700: '#1a5c46',
          800: '#166048',
          900: '#14532d',
        },
        'nedu-bg': '#F0F4F8',
        'nedu-border': 'rgba(0,0,0,0.09)',
        'nedu-orange': '#ea580c',
      },
      borderRadius: {
        card: '13px',
      },
      boxShadow: {
        card: '0 1px 4px rgba(0,0,0,0.05)',
        'card-hover': '0 4px 16px rgba(0,0,0,0.1)',
      },
      fontSize: {
        '10': '10px',
        '11': '11px',
        '13': '13px',
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
    },
  },
  plugins: [],
}
