/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // AI purple accent color
        accent: {
          purple: '#8B5CF6',
          light: '#A78BFA',
          dark: '#7C3AED',
        },
        // Neutral tones for minimal design
        neutral: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
      },
      animation: {
        'stream': 'stream 0.03s linear',
        'fade-in': 'fadeIn 0.5s ease-out',
      },
      keyframes: {
        stream: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};