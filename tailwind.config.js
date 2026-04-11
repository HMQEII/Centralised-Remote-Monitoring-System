/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Light mode colors
        background: {
          DEFAULT: '#ffffff',
          dark: '#080c14',
        },
        foreground: {
          DEFAULT: '#1a1a1a',
          dark: '#e8eaed',
        },
        card: {
          DEFAULT: '#f8f9fa',
          dark: '#0d1320',
        },
        'card-foreground': {
          DEFAULT: '#1a1a1a',
          dark: '#e8eaed',
        },
        primary: '#004B4B',
        'primary-foreground': '#ffffff',
        secondary: {
          DEFAULT: '#f1f3f5',
          dark: '#151d2e',
        },
        'secondary-foreground': {
          DEFAULT: '#1a1a1a',
          dark: '#e8eaed',
        },
        muted: {
          // DEFAULT: '#f1f3f5',
          DEFAULT: '#f1f3f5',
          dark: '#1a2332',
        },
        'muted-foreground': {
          DEFAULT: '#6c757d',
          dark: '#8b95a5',
        },
        accent: '#004B4B',
        'accent-foreground': '#ffffff',
        border: {
          DEFAULT: '#dee2e6',
          dark: '#1e2a3a',
        },
        input: {
          DEFAULT: '#f8f9fa',
          dark: '#1a2332',
        },
        ring: '#004B4B',
      },
      fontFamily: {
        sans: ['Syne', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
      borderRadius: {
        lg: '0.5rem',
        md: '0.375rem',
        sm: '0.25rem',
      },
    },
  },
  plugins: [],
}