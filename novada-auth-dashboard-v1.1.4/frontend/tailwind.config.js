/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        nova: {
          50: '#f3f0ff',
          100: '#e5deff',
          200: '#cdbbff',
          300: '#ae8dff',
          400: '#8b5cf6',
          500: '#7c3aed',
          600: '#6d28d9',
          700: '#5b21b6',
          800: '#4c1d95',
          900: '#3b0f7a',
          950: '#1e0a3e',
        },
        surface: {
          50: '#f8f9fc',
          100: '#f1f3f8',
          200: '#e2e5ed',
          300: '#c8cdd9',
          400: '#9ba3b5',
          500: '#6b7280',
          600: '#4b5563',
          700: '#1e2235',
          800: '#171b2d',
          900: '#111425',
          950: '#0b0e1a',
        },
        amber: {
          400: '#fbbf24',
          500: '#f59e0b',
        }
      },
      fontFamily: {
        display: ['"DM Sans"', 'sans-serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(124, 58, 237, 0.15)',
        'glow-sm': '0 0 10px rgba(124, 58, 237, 0.1)',
        'card': '0 1px 3px rgba(0,0,0,0.3), 0 4px 20px rgba(0,0,0,0.2)',
        'card-hover': '0 4px 30px rgba(0,0,0,0.4), 0 0 20px rgba(124, 58, 237, 0.08)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'slide-right': 'slideRight 0.35s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideRight: {
          '0%': { opacity: '0', transform: 'translateX(24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      }
    },
  },
  plugins: [],
}
