import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          primary: '#FFFFFF',
          elevated: '#F8F9FA',
          secondary: '#EDF0F2',
        },
        track: {
          gold: '#A67E2E',
          'gold-bg': '#FDF9F0',
          blue: '#5566C2',
          'blue-bg': '#F2F4FC',
        },
        state: {
          verified: '#2C8A4E',
          terminated: '#B53625',
        },
        text: {
          primary: '#111115',
          secondary: '#4A4A52',
          disabled: '#7C7C85',
        },
        rule: '#D2D4DA',
      },
      fontFamily: {
        editorial: ['var(--font-playfair)', 'Georgia', 'serif'],
        institutional: ['var(--font-ibm-plex-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-ibm-plex-mono)', 'Menlo', 'monospace'],
      },
      fontSize: {
        // Editorial scale — Playfair Display
        d1: ['48px', { lineHeight: '64px', letterSpacing: '-0.01em' }],
        d2: ['38px', { lineHeight: '52px', letterSpacing: '-0.005em' }],
        d3: ['28px', { lineHeight: '40px' }],
        d4: ['22px', { lineHeight: '32px' }],
        // Institutional scale — IBM Plex Sans
        i1: ['16px', { lineHeight: '24px' }],
        i2: ['14px', { lineHeight: '22px' }],
        i3: ['12px', { lineHeight: '18px' }],
        i4: ['11px', { lineHeight: '17px' }],
        // Mono scale — IBM Plex Mono
        m1: ['13px', { lineHeight: '20px' }],
        m2: ['11px', { lineHeight: '16px' }],
        m3: ['9px', { lineHeight: '14px', letterSpacing: '0.06em' }],
      },
      maxWidth: {
        canvas: '1440px',
      },
      letterSpacing: {
        // Uppercase label tracking used on section eyebrows / column headers
        label: '0.18em',
        wide: '0.08em',
        tight: '0.04em',
      },
    },
  },
  plugins: [],
};

export default config;
