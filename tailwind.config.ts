import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Shadcn remapping
        border: 'var(--border)',
        ring: 'var(--ring)',
        // Dashboard surfaces (dark-only)
        surface: {
          primary: '#0D1117',
          elevated: '#161B22',
          secondary: '#1F2937',
        },
        accent: {
          green: '#007F4E',
        },
        text: {
          primary: '#E6EDF3',
          secondary: '#8B949E',
          disabled: '#484F58',
        },
        // ── Website design system (FRONTEND.md) ──────────────────────────────
        canvas: {
          base: '#F5F4F0',
          elevated: '#F0EEE9',
        },
        ws: {
          surface: {
            primary: '#ECE8E1',
            secondary: '#E5E1DA',
            success: '#E5ECE8',
            warning: '#EFE7DA',
            review: '#E9E2DF',
            technical: '#E3E6E8',
          },
          text: {
            heading: '#1D232A',
            body: '#353C45',
            secondary: '#636C76',
            meta: '#8A919A',
          },
          border: {
            soft: '#D8D3CC',
            default: '#C8C2BA',
            divider: '#BDB7AF',
          },
        },
        copper: { DEFAULT: '#B86A3D', dark: '#D88A5A' },
        teal: { DEFAULT: '#2E7D78', dark: '#56A8A2' },
        violet: { DEFAULT: '#6B5A9A', dark: '#9581CC' },
      },
      fontFamily: {
        // Dashboard fonts — Sora / IBM Plex Sans / JetBrains Mono
        heading: ['var(--font-sora)', 'sans-serif'],
        body: ['var(--font-ibm-plex-sans)', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'monospace'],
        // Website fonts — Plus Jakarta Sans / IBM Plex Mono
        jakarta: ['"Plus Jakarta Sans"', 'var(--font-jakarta)', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        'ibm-mono': ['"IBM Plex Mono"', 'var(--font-ibm-plex-mono)', 'SFMono-Regular', 'Consolas', 'monospace'],
      },
      fontSize: {
        // Dashboard scale (6-point)
        t1: ['32px', { lineHeight: '1.2', fontWeight: '600' }],
        t2: ['24px', { lineHeight: '1.3', fontWeight: '600' }],
        t3: ['20px', { lineHeight: '1.4', fontWeight: '500' }],
        t4: ['16px', { lineHeight: '1.5', fontWeight: '400' }],
        t5: ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        t6: ['12px', { lineHeight: '1.4', fontWeight: '400' }],
        // Website type scale (FRONTEND.md)
        'ws-display': ['5rem', { lineHeight: '1.05', letterSpacing: '-0.03em', fontWeight: '700' }],
        'ws-h1': ['2.75rem', { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '600' }],
        'ws-h2': ['1.5rem', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '500' }],
        'ws-body': ['1.125rem', { lineHeight: '1.6', letterSpacing: '0' }],
        'ws-meta': ['0.875rem', { lineHeight: '1.4', letterSpacing: '0.02em', fontWeight: '500' }],
        'ws-mono': ['0.875rem', { lineHeight: '1.5', letterSpacing: '0' }],
      },
      borderRadius: {
        DEFAULT: '6px',
        sm: '4px',
      },
      transitionDuration: {
        '150': '150ms',
        '250': '250ms',
        instant: '80ms',
        fast: '150ms',
        standard: '250ms',
        enter: '350ms',
        exit: '200ms',
      },
      transitionTimingFunction: {
        standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
        decelerate: 'cubic-bezier(0, 0, 0.2, 1)',
        accelerate: 'cubic-bezier(0.4, 0, 1, 1)',
        sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
