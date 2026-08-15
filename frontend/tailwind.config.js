/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Portal label palette
        ground: '#0A0C0E',
        'ground-secondary': '#101317',
        ink: '#EDE7DC',
        'ink-secondary': '#9EA5A8',
        muted: '#6C7378',
        amber: '#E8913C',
        teal: '#2E6B72',
        // Legacy colors for dashboard
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          900: '#1e1b4b',
        },
        dark: {
          800: '#1e293b',
          850: '#172033',
          900: '#0f172a',
          950: '#020617',
        }
      },
      fontFamily: {
        syne: ['Syne', 'sans-serif'],
        sora: ['Sora', 'sans-serif'],
        sans: ['Sora', 'Inter', 'sans-serif'],
      },
      letterSpacing: {
        'wordmark-tight': '-0.03em',
        'wordmark': '-0.02em',
        'label-wide': '0.15em',
        'label': '0.12em',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
