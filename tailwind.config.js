import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Emotion colors
        emotion: {
          happy: '#FFD93D',
          sad: '#74B9FF',
          angry: '#FF6B6B',
          scared: '#A29BFE',
          surprised: '#FDCB6E',
        },
        // Domain colors
        domain: {
          math: '#FF6B6B',
          reading: '#4ECDC4',
          coding: '#A29BFE',
          writing: '#FFD93D',
        },
        // App theme colors
        primary: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'bounce-slow': 'bounce 2s infinite',
        'pulse-slow': 'pulse 3s infinite',
      },
    },
  },
  plugins: [forms],
}
