/**
 * EMBER NOIR — design tokens (Phase 0)
 *
 * System rules:
 *  - one accent ramp (`ember`) + muted semantics (olive/clay/sand/steel)
 *  - warm neutrals only: no cool slate/indigo anywhere
 *  - 3 radii: 0 (panels/rows) · 2px (`rounded-xs`/`rounded-sm`) · 999px (`rounded-pill`)
 *  - no shadows on dark surfaces: `shadow-xl`/`shadow-2xl` are neutralised below
 *
 * Migration note: the legacy `slate`/`red`/`green`/`yellow`/`indigo`/`primary`/`dark`
 * ramps are re-mapped in place, so ~1100 existing class usages across pages/ and
 * components/ are re-toned with zero JSX changes.
 */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        /* ---------- Ember Noir core ---------- */
        canvas: '#0A0807',
        surface: {
          DEFAULT: '#100C0B',
          2: '#16100E',
          3: '#1C1513',
        },

        /* ---------- Portal tokens (names kept on purpose) ---------- */
        ground: '#0A0807',
        'ground-secondary': '#100C0B',
        ink: {
          DEFAULT: '#EDE7DC',
          2: '#A79F95',
          3: '#847B74',
        },
        'ink-secondary': '#A79F95',
        muted: '#847B74',
        line: 'rgb(242 236 228 / 0.10)',

        /* ---------- ONE accent ramp ---------- */
        ember: {
          100: '#F7E3C4',
          300: '#F0A85C',
          500: '#E2703A',
          600: '#C2452A',
          700: '#8E2A20',
        },
        amber: '#E2703A', // was #E8913C — ~100 usages now get the terracotta accent
        teal: '#7E9C6B',  // was cool #2E6B72 — 53 usages now muted olive

        /* ---------- Muted semantics ---------- */
        olive: '#7E9C6B',
        clay: '#B3392B',
        sand: '#D9A05B',
        steel: '#8A9AA8',

        /* ---------- Dark-theme inverted legacy ramps ----------
           Low keys (100) = dark tint backgrounds · high keys (800) = light readable text.
           So `bg-red-100 text-red-800` (stock badges, form messages) stays legible
           on a dark canvas instead of rendering pastel light-mode blocks. */
        red: {
          50: '#170C09',
          100: '#2A1512',
          200: '#3A1C16',
          300: '#D98A74',
          400: '#CE6A50',
          500: '#B3392B',
          600: '#8E2A20',
          700: '#6B2019',
          800: '#E0A08F',
          900: '#F0C8BC',
        },
        green: {
          50: '#101508',
          100: '#16200F',
          200: '#1F2C16',
          300: '#9CBB88',
          400: '#8FB07A',
          500: '#7E9C6B',
          600: '#5F7A50',
          700: '#485E3C',
          800: '#BFD8AC',
          900: '#DCEBD1',
        },
        emerald: {
          50: '#101508',
          100: '#16200F',
          200: '#1F2C16',
          300: '#9CBB88',
          400: '#8FB07A',
          500: '#7E9C6B',
          600: '#5F7A50',
          700: '#485E3C',
          800: '#BFD8AC',
          900: '#DCEBD1',
        },
        yellow: {
          50: '#1A1308',
          100: '#241A0D',
          200: '#33240F',
          300: '#E4B87C',
          400: '#D9A05B',
          500: '#C08A44',
          600: '#9A6D34',
          700: '#745226',
          800: '#EBCB9B',
          900: '#F5E2C4',
        },
        blue: {
          50: '#121619',
          100: '#1A1F23',
          200: '#242A2F',
          300: '#B4C0CA',
          400: '#8A9AA8',
          500: '#71828F',
          600: '#5A6A76',
          700: '#44515A',
          800: '#C8D3DA',
          900: '#E2E9ED',
        },
        indigo: {
          50: '#1A1109',
          100: '#241708',
          200: '#33200C',
          300: '#F0A85C',
          400: '#E88A4E',
          500: '#E2703A',
          600: '#C2452A',
          700: '#8E2A20',
          800: '#F7E3C4',
          900: '#FBEFDC',
        },
        purple: {
          400: '#F0A85C',
          500: '#E2703A',
          600: '#C2452A',
        },

        /* ---------- Warm neutrals + legacy aliases ---------- */
        slate: {
          50: '#F7F3EE',
          100: '#EDE7DC',
          200: '#D9D1C6',
          300: '#C4BAB0',
          400: '#A79F95',
          500: '#8B8279',
          600: '#847B74',
          700: '#3A3330',
          800: '#16100E',
          900: '#100C0B',
          950: '#0A0807',
        },
        dark: {
          800: '#16100E',
          850: '#120E0D',
          900: '#100C0B',
          950: '#0A0807',
        },
        primary: {
          50: '#241708',
          100: '#33200C',
          500: '#E2703A',
          600: '#C2452A',
          700: '#8E2A20',
          900: '#1C1513',
        },

      },
      fontFamily: {
        display: ['"Inter Tight"', 'Inter', 'sans-serif'],
        sans: ['"Inter Tight"', 'Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        // legacy aliases — existing font-syne / font-sora classes keep working
        syne: ['"Inter Tight"', 'Inter', 'sans-serif'],
        sora: ['"Inter Tight"', 'Inter', 'sans-serif'],
      },
      fontSize: {
        micro: ['12px', { lineHeight: '1.45', letterSpacing: '0.14em' }],
        label: ['12.5px', { lineHeight: '1.4', letterSpacing: '0.12em' }],
        statement: ['clamp(3rem, 9vw, 9rem)', { lineHeight: '0.92', letterSpacing: '-0.035em' }],
        section: ['clamp(2rem, 5vw, 4.5rem)', { lineHeight: '0.95', letterSpacing: '-0.03em' }],
      },
      letterSpacing: {
        'wordmark-tight': '-0.03em',
        'wordmark': '-0.02em',
        'label-wide': '0.15em',
        'label': '0.12em',
        'micro': '0.16em',
        'zero': '0',
      },
      borderRadius: {
        xs: '2px',
        pill: '999px',
      },
      boxShadow: {
        // dark surfaces: elevation is a hairline + one surface step, never a shadow
        xl: 'none',
        '2xl': 'none',
        panel: '0 24px 64px -24px rgb(0 0 0 / 0.8)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'drift': 'drift 42s ease-in-out infinite',
        'drift-slow': 'drift 68s ease-in-out infinite reverse',
        'shimmer': 'shimmer 1.6s ease-in-out infinite',
        'rise-in': 'riseIn 0.5s cubic-bezier(.16,1,.3,1) both',
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
        drift: {
          '0%, 100%': { transform: 'translate3d(0, 0, 0) scale(1)' },
          '50%': { transform: 'translate3d(-2%, 1.5%, 0) scale(1.06)' },
        },
        shimmer: {
          '0%': { opacity: '0.25' },
          '50%': { opacity: '0.6' },
          '100%': { opacity: '0.25' },
        },
        riseIn: {
          'from': { opacity: '0', transform: 'translateY(8px)' },
          'to': { opacity: '1', transform: 'none' },
        },
      },
    },
  },
  plugins: [],
}
