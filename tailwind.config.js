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
        // App theme colors — warm espresso ramp so paper components
        // (buttons, checkboxes, progress, focus rings) sit inside the
        // Structured Serenity palette instead of scaffold indigo.
        primary: {
          50: '#F7F4F1',
          100: '#EDE7E1',
          200: '#DCD2C8',
          300: '#C2B2A4',
          400: '#9C8878',
          500: '#6E5C50',
          600: '#453931',
          700: '#382E28',
          800: '#2D2420',
          900: '#221B17',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
      },
      animation: {
        'bounce-slow': 'bounce 2s infinite',
        'pulse-slow': 'pulse 3s infinite',
      },
    },
  },
  plugins: [forms],
}
