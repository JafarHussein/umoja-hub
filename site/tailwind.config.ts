import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          primary: '#0C0C0E',
          elevated: '#131318',
          secondary: '#1A1A1F',
        },
        track: {
          gold: '#C19C42',
          'gold-bg': '#1E1709',
          blue: '#7788DD',
          'blue-bg': '#0E1223',
        },
        state: {
          verified: '#40B26D',
          terminated: '#C84B39',
        },
        text: {
          primary: '#EAEAEA',
          secondary: '#8B8B8B',
          disabled: '#5C5C5C',
        },
        rule: '#303034',
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
