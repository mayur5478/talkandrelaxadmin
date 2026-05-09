/** @type {import('tailwindcss').Config} */
module.exports = {
  // Tailwind only scans the new shell + future v2 pages so it never
  // touches the existing react-bootstrap / scss classes.
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './public/index.html',
  ],
  darkMode: ['class'],
  // CRA's PostCSS prefixes Tailwind utilities so they don't fight bootstrap's
  // base reset. Switch off if you migrate the whole app.
  prefix: 'tw-',
  // We keep our own base styles in index.css; Tailwind preflight would
  // wipe react-bootstrap's reset.
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: {
        bg: {
          primary:   'var(--color-background-primary)',
          secondary: 'var(--color-background-secondary)',
          tertiary:  'var(--color-background-tertiary)',
          info:      'var(--color-background-info)',
          success:   'var(--color-background-success)',
          warning:   'var(--color-background-warning)',
          danger:    'var(--color-background-danger)',
        },
        fg: {
          primary:   'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          tertiary:  'var(--color-text-tertiary)',
          info:      'var(--color-text-info)',
          success:   'var(--color-text-success)',
          warning:   'var(--color-text-warning)',
          danger:    'var(--color-text-danger)',
        },
        border: {
          DEFAULT:  'var(--color-border-tertiary)',
          tertiary: 'var(--color-border-tertiary)',
        },
        chart: {
          1: 'var(--color-chart-1)',
          2: 'var(--color-chart-2)',
          3: 'var(--color-chart-3)',
          4: 'var(--color-chart-4)',
          5: 'var(--color-chart-5)',
        },
        tooltip: {
          DEFAULT: 'var(--color-tooltip-bg)',
          fg:      'var(--color-tooltip-fg)',
        },
      },
      borderRadius: {
        sm: 'var(--border-radius-sm)',
        md: 'var(--border-radius-md)',
        lg: 'var(--border-radius-lg)',
      },
      borderWidth: { hairline: '0.5px' },
      spacing: { 1: '4px', 2: '8px', 3: '12px', 4: '16px', 6: '24px', 8: '32px' },
      fontSize: {
        h1:    ['22px', { lineHeight: '28px', fontWeight: '500', letterSpacing: '-0.01em' }],
        h2:    ['18px', { lineHeight: '24px', fontWeight: '500' }],
        h3:    ['16px', { lineHeight: '22px', fontWeight: '500' }],
        body:  ['14px', { lineHeight: '20px', fontWeight: '400' }],
        small: ['13px', { lineHeight: '18px', fontWeight: '400' }],
        eyebrow: ['11px', { lineHeight: '14px', fontWeight: '500' }],
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      fontWeight: { normal: '400', medium: '500' },
      boxShadow: {
        xs: 'var(--shadow-xs)',
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
      },
      transitionDuration: {
        fast: 'var(--duration-fast)',
        base: 'var(--duration-base)',
        slow: 'var(--duration-slow)',
      },
      transitionTimingFunction: { 'out-soft': 'var(--ease-out-soft)' },
      keyframes: {
        'fade-in':  { from: { opacity: 0 }, to: { opacity: 1 } },
        'slide-in-left':  { from: { transform: 'translateX(-100%)' }, to: { transform: 'translateX(0)' } },
      },
      animation: {
        'fade-in': 'fade-in var(--duration-base) var(--ease-out-soft)',
        'slide-in-left': 'slide-in-left var(--duration-slow) var(--ease-out-soft)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
