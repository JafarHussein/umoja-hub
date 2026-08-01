import type { Metadata } from 'next';
import {
  Sora,
  IBM_Plex_Sans,
  JetBrains_Mono,
  Hanken_Grotesk,
  Spline_Sans_Mono,
} from 'next/font/google';
import { Providers } from '@/components/shared/Providers';
import '@/styles/globals.css';
import { cn } from "@/lib/utils";
import { siteUrl } from '@/lib/env';

// Platform typefaces (foundation §8): Sora (headings) / IBM Plex Sans (body) /
// JetBrains Mono (data). Latin-subset, weights trimmed to those in use.
// Geist / Geist Mono were loaded but unused — removed in Visual System V1 P4
// to cut font payload (2G constraint, §5/§6).
const sora = Sora({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sora',
  display: 'swap',
});

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-ibm-plex-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

// App design system typefaces (Phase 6, webapp-reset/DESIGN_SYSTEM_V1.md):
// Hanken Grotesk (UI) + Spline Sans Mono (data/figures, tabular numerals).
// Loaded as variable fonts so the ratified weights (450/550/650 …) render
// exactly. Additive — the website's three typefaces above are unchanged.
const hankenGrotesk = Hanken_Grotesk({
  subsets: ['latin'],
  variable: '--font-hanken',
  display: 'swap',
});

const splineSansMono = Spline_Sans_Mono({
  subsets: ['latin'],
  variable: '--font-spline-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'UmojaHub — Food Security & Education Hub',
    template: '%s · UmojaHub',
  },
  description:
    'Infrastructure for food security and technical talent in Kenya. A verified farmer marketplace and hands-on education platform for CS students.',
  keywords: ['Kenya', 'farmers', 'food security', 'education', 'marketplace', 'M-Pesa'],
  metadataBase: new URL(siteUrl()),
  openGraph: {
    type: 'website',
    locale: 'en_KE',
    siteName: 'UmojaHub',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        sora.variable,
        ibmPlexSans.variable,
        jetbrainsMono.variable,
        hankenGrotesk.variable,
        splineSansMono.variable,
        'font-sans'
      )}
    >
      <body suppressHydrationWarning className="bg-background text-fg font-body antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
