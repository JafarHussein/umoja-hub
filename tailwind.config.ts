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
        // Website design system (V2) — prefix ws-* to avoid collision with dashboard tokens
        ws: {
          // Light surfaces
          surface: {
            base: '#FFFFFF',
            raised: '#F7F7F7',
            recessed: '#F0F0F0',
            // Dark surfaces (infrastructure/statistics sections)
            dark: '#0A0A09',
            'dark-2': '#151514',
            'dark-3': '#1E1E1C',
          },
          // Hub accent colors
          hub: {
            green: '#16A34A',
            'green-dark': '#15803D',
            'green-tint': '#F0FDF4',
            'green-border': '#86EFAC',
            blue: '#2563EB',
            'blue-dark': '#1D4ED8',
            'blue-tint': '#EFF6FF',
            'blue-border': '#93C5FD',
          },
          // Text on light surfaces
          text: {
            primary: '#111110',
            secondary: '#6B6B69',
            tertiary: '#9A9A98',
            // Text on dark surfaces
            bright: '#F5F5F3',
            dim: '#9B9B99',
            faint: '#5E5E5C',
          },
          // Status colors (shared across hubs)
          status: {
            pending: '#B45309',
            'pending-tint': '#FEF3C7',
            denied: '#DC2626',
            'denied-tint': '#FEF2F2',
          },
          // Borders
          border: {
            light: '#E5E5E3',
            medium: '#D4D4D2',
            dark: '#2A2A28',
            verified: '#86EFAC',
            'verified-edu': '#93C5FD',
          },
        },
      },
      fontFamily: {
        // Dashboard fonts — Sora / IBM Plex Sans / JetBrains Mono
        heading: ['var(--font-sora)', 'sans-serif'],
        body: ['var(--font-ibm-plex-sans)', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'monospace'],
        // Website fonts (V2 design system) — Plus Jakarta Sans / Geist / Geist Mono
        display: ['var(--font-jakarta)', 'sans-serif'],
        geist: ['var(--font-geist)', 'sans-serif'],
        'geist-mono': ['var(--font-geist-mono)', 'monospace'],
      },
      fontSize: {
        // Strict 6-point scale — dashboard components only
        t1: ['32px', { lineHeight: '1.2', fontWeight: '600' }],
        t2: ['24px', { lineHeight: '1.3', fontWeight: '600' }],
        t3: ['20px', { lineHeight: '1.4', fontWeight: '500' }],
        t4: ['16px', { lineHeight: '1.5', fontWeight: '400' }],
        t5: ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        t6: ['12px', { lineHeight: '1.4', fontWeight: '400' }],
        // Website display scale (V2) — never use in dashboard components
        'display-1': ['64px', { lineHeight: '70px', fontWeight: '800', letterSpacing: '-0.03em' }],
        'display-2': ['48px', { lineHeight: '54px', fontWeight: '700', letterSpacing: '-0.02em' }],
        'display-3': ['36px', { lineHeight: '42px', fontWeight: '700', letterSpacing: '-0.02em' }],
        'ws-section': ['28px', { lineHeight: '34px', fontWeight: '700', letterSpacing: '-0.01em' }],
        'ws-subsection': ['22px', { lineHeight: '28px', fontWeight: '600', letterSpacing: '0' }],
        'ws-body-lg': ['18px', { lineHeight: '28px', fontWeight: '400', letterSpacing: '0' }],
        'ws-body': ['16px', { lineHeight: '26px', fontWeight: '400', letterSpacing: '0' }],
        'ws-body-sm': ['14px', { lineHeight: '22px', fontWeight: '400', letterSpacing: '0' }],
        'ws-label': ['14px', { lineHeight: '20px', fontWeight: '500', letterSpacing: '0' }],
        'ws-caption': ['12px', { lineHeight: '16px', fontWeight: '400', letterSpacing: '0.06em' }],
        'ws-data': ['13px', { lineHeight: '20px', fontWeight: '500', letterSpacing: '0' }],
      },
      borderRadius: {
        DEFAULT: '6px',
        sm: '4px',
      },
      transitionDuration: {
        '150': '150ms',
        '250': '250ms',
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
