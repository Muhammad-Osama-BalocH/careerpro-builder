import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      /* ── Color System ── */
      colors: {
        surface: {
          DEFAULT: 'var(--cp-surface)',
          raised: 'var(--cp-surface-raised)',
          overlay: 'var(--cp-surface-overlay)',
        },
        accent: {
          DEFAULT: 'var(--cp-accent)',
          hover: 'var(--cp-accent-hover)',
          subtle: 'var(--cp-accent-subtle)',
          border: 'var(--cp-accent-border)',
          text: 'var(--cp-accent-text)',
        },
      },

      /* ── Typography ── */
      fontFamily: {
        sans: [
          '-apple-system', 'BlinkMacSystemFont', 'SF Pro Text', 'Segoe UI',
          'system-ui', 'sans-serif',
        ],
      },
      fontSize: {
        display: ['clamp(2.25rem, 5vw, 3.25rem)', { lineHeight: '1.05', letterSpacing: '-0.03em' }],
        h1:     ['1.75rem',  { lineHeight: '1.2',  letterSpacing: '-0.025em' }],
        h2:     ['1.375rem', { lineHeight: '1.3',  letterSpacing: '-0.02em' }],
        h3:     ['1.125rem', { lineHeight: '1.4',  letterSpacing: '-0.01em' }],
      },
      letterSpacing: {
        label: '0.1em',
      },

      /* ── Radii ── */
      borderRadius: {
        'cp-sm': '0.375rem',
        cp:      '0.5rem',
        'cp-lg': '0.75rem',
        'cp-xl': '1rem',
      },

      /* ── Shadows ── */
      boxShadow: {
        'cp':    '0 1px 2px 0 rgb(0 0 0 / 0.03)',
        'cp-md': '0 2px 4px -1px rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.03)',
        'cp-lg': '0 4px 12px -2px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.03)',
      },

      /* ── Easing ── */
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      transitionDuration: {
        cp: '150ms',
      },
    },
  },
  plugins: [],
} satisfies Config;
