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
        // ── Unified semantic tokens (theme-aware via CSS vars) ───────────────
        // One set, two themes (:root dark / .theme-website light). See
        // src/styles/globals.css. Author all new UI against THESE. Solid
        // colours support alpha modifiers (bg-brand/15, border-danger/30);
        // state tints come from `/10`–`/15`, not separate `-bg` tokens.
        ring: 'rgb(var(--ring) / <alpha-value>)',
        background: 'rgb(var(--bg) / <alpha-value>)',
        border: {
          DEFAULT: 'var(--border)',
          strong: 'var(--border-strong)',
        },
        surface: {
          DEFAULT: 'rgb(var(--surface) / <alpha-value>)',
          raised: 'rgb(var(--surface-raised) / <alpha-value>)',
          sunken: 'rgb(var(--surface-sunken) / <alpha-value>)',
        },
        fg: {
          DEFAULT: 'rgb(var(--fg) / <alpha-value>)',
          muted: 'rgb(var(--fg-muted) / <alpha-value>)',
          subtle: 'rgb(var(--fg-subtle) / <alpha-value>)',
          disabled: 'rgb(var(--fg-disabled) / <alpha-value>)',
        },
        brand: {
          DEFAULT: 'rgb(var(--brand) / <alpha-value>)',
          hover: 'rgb(var(--brand-hover) / <alpha-value>)',
          fg: 'rgb(var(--brand-fg) / <alpha-value>)',
          text: 'rgb(var(--brand-text) / <alpha-value>)',
        },
        success: 'rgb(var(--success) / <alpha-value>)',
        warning: 'rgb(var(--warning) / <alpha-value>)',
        danger: 'rgb(var(--danger) / <alpha-value>)',
        info: 'rgb(var(--info) / <alpha-value>)',
        // NOTE: legacy accent.green / text.* / surface.primary|elevated|secondary
        // were removed in Visual System V1 P5 (migrated to semantic tokens). The
        // website palette (canvas/ws.*/copper/teal/violet) was removed in the
        // reset. Do not reintroduce legacy or website palettes here.

        // ── APP design system (Phase 6 mirror of webapp-reset/DESIGN_SYSTEM_V1.md)
        // Isolated `app` group → bg-app-canvas, text-app-ink, text-app-warning,
        // bg-app-warning-surface, border-app-hairline … Themed by `.theme-app`
        // (light) + `.theme-app.dark`/`[data-theme=dark]` in src/styles/globals.css.
        // Kept separate from the website tokens above by design.
        app: {
          canvas: 'rgb(var(--app-canvas) / <alpha-value>)',
          card: 'rgb(var(--app-card) / <alpha-value>)',
          sunken: 'rgb(var(--app-sunken) / <alpha-value>)',
          hairline: 'rgb(var(--app-hairline) / <alpha-value>)',
          'border-strong': 'rgb(var(--app-border-strong) / <alpha-value>)',
          ink: 'rgb(var(--app-ink) / <alpha-value>)',
          body: 'rgb(var(--app-body) / <alpha-value>)',
          muted: 'rgb(var(--app-muted) / <alpha-value>)',
          faint: 'rgb(var(--app-faint) / <alpha-value>)',
          'on-brand': 'rgb(var(--app-on-brand) / <alpha-value>)',
          ring: 'rgb(var(--app-ring) / <alpha-value>)',
          brand: {
            DEFAULT: 'rgb(var(--app-brand) / <alpha-value>)',
            hover: 'rgb(var(--app-brand-hover) / <alpha-value>)',
            surface: 'rgb(var(--app-brand-surface) / <alpha-value>)',
            border: 'rgb(var(--app-brand-border) / <alpha-value>)',
          },
          murram: {
            DEFAULT: 'rgb(var(--app-murram) / <alpha-value>)',
            surface: 'rgb(var(--app-murram-surface) / <alpha-value>)',
          },
          success: {
            DEFAULT: 'rgb(var(--app-success) / <alpha-value>)',
            surface: 'rgb(var(--app-success-surface) / <alpha-value>)',
          },
          warning: {
            DEFAULT: 'rgb(var(--app-warning) / <alpha-value>)',
            surface: 'rgb(var(--app-warning-surface) / <alpha-value>)',
          },
          danger: {
            DEFAULT: 'rgb(var(--app-danger) / <alpha-value>)',
            surface: 'rgb(var(--app-danger-surface) / <alpha-value>)',
          },
          info: {
            DEFAULT: 'rgb(var(--app-info) / <alpha-value>)',
            surface: 'rgb(var(--app-info-surface) / <alpha-value>)',
          },
        },
      },
      fontFamily: {
        // Dashboard fonts — Sora / IBM Plex Sans / JetBrains Mono
        heading: ['var(--font-sora)', 'sans-serif'],
        body: ['var(--font-ibm-plex-sans)', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'monospace'],
        // APP design system (Phase 6): Hanken Grotesk (UI) + Spline Sans Mono
        // (data/figures, tabular). font-app-sans / font-app-mono.
        'app-sans': ['var(--font-hanken)', 'sans-serif'],
        'app-mono': ['var(--font-spline-mono)', 'monospace'],
      },
      fontSize: {
        // Dashboard scale (6-point) — compact, data-dense product surfaces
        t1: ['32px', { lineHeight: '1.2', fontWeight: '600' }],
        t2: ['24px', { lineHeight: '1.3', fontWeight: '600' }],
        t3: ['20px', { lineHeight: '1.4', fontWeight: '500' }],
        t4: ['16px', { lineHeight: '1.5', fontWeight: '400' }],
        t5: ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        t6: ['12px', { lineHeight: '1.4', fontWeight: '400' }],
        // Website reading scale — long-form Documentation Stream. Same families:
        // display / read-h* pair with font-heading (Sora); read-* body copy with
        // font-body (IBM Plex Sans). Comfortable measure + generous line-height.
        display: ['3.5rem', { lineHeight: '1.05', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-sm': ['2.5rem', { lineHeight: '1.1', letterSpacing: '-0.015em', fontWeight: '700' }],
        'read-h2': ['1.75rem', { lineHeight: '1.25', letterSpacing: '-0.01em', fontWeight: '600' }],
        'read-h3': ['1.25rem', { lineHeight: '1.4', fontWeight: '600' }],
        'read-lead': ['1.375rem', { lineHeight: '1.6', fontWeight: '400' }],
        'read-body': ['1.125rem', { lineHeight: '1.7', fontWeight: '400' }],
        'read-meta': ['0.875rem', { lineHeight: '1.5', letterSpacing: '0.01em', fontWeight: '400' }],
      },
      maxWidth: {
        // Reading measure for the Documentation Stream (~68 characters)
        reading: '68ch',
      },
      borderRadius: {
        DEFAULT: '6px',
        sm: '4px',
        // APP design system (Phase 6) — App Radius collection.
        'app-card': '10px',
        'app-control': '8px',
        'app-pill': '999px',
        'app-cell': '6px',
      },
      // Functional motion only (foundation §10): the two durations actually in
      // use (150 micro / 250 panel) + one standard easing. The StoryWorld-era
      // instant/fast/standard/enter/exit durations and decelerate/accelerate/
      // sharp easings were unused and are removed.
      transitionDuration: {
        '150': '150ms',
        '250': '250ms',
      },
      transitionTimingFunction: {
        standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
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
