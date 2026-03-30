/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#080c14',
        foreground: '#e8eaed',
        card: '#0d1320',
        'card-foreground': '#e8eaed',
        primary: '#1B2F5E',
        'primary-foreground': '#ffffff',
        secondary: '#151d2e',
        'secondary-foreground': '#e8eaed',
        muted: '#1a2332',
        'muted-foreground': '#8b95a5',
        accent: '#1B2F5E',
        'accent-foreground': '#ffffff',
        border: '#1e2a3a',
        input: '#1a2332',
        ring: '#1B2F5E',
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
