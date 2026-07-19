/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#132A46',
          50: '#EEF2F7',
          100: '#D6E0EB',
          400: '#3E5B7C',
          600: '#1E3A5C',
          900: '#0B1A2C',
        },
        signal: {
          DEFAULT: '#E88A2E',
          50: '#FDF3E7',
          400: '#F0A855',
          600: '#C96F1A',
        },
        moss: {
          DEFAULT: '#1F7A5C',
          50: '#E7F3EE',
          400: '#3E9A79',
        },
        paper: '#FAF8F4',
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
