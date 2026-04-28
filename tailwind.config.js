/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#050505',
          900: '#0a0a0a',
          850: '#0f0f10',
          800: '#141416',
          700: '#1a1a1d',
          600: '#222226',
          500: '#2a2a2f',
          400: '#3a3a40',
        },
        ash: {
          500: '#6b6b73',
          400: '#8a8a92',
          300: '#a8a8b0',
          200: '#c8c8cf',
          100: '#e6e6ea',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'monospace'],
        display: ['"Fraunces"', 'Georgia', 'serif'],
      },
      keyframes: {
        'subtle-pulse': {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'caret': {
          '0%, 100%': { opacity: '0' },
          '50%': { opacity: '1' },
        },
      },
      animation: {
        'subtle-pulse': 'subtle-pulse 2.4s ease-in-out infinite',
        'slide-up': 'slide-up 0.5s ease-out',
        'caret': 'caret 1s steps(1) infinite',
      },
    },
  },
  plugins: [],
};
