import type { Metadata } from 'next';
import { Sora, IBM_Plex_Sans, JetBrains_Mono } from 'next/font/google';
import '@/styles/globals.css';

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

export const metadata: Metadata = {
  title: {
    default: 'UmojaHub — Food Security & Education Hub',
    template: '%s · UmojaHub',
  },
  description:
    'Infrastructure for food security and technical talent in Kenya. A verified farmer marketplace and hands-on education platform for CS students.',
  keywords: ['Kenya', 'farmers', 'food security', 'education', 'marketplace', 'M-Pesa'],
  metadataBase: new URL(process.env.NEXTAUTH_URL ?? 'http://localhost:3000'),
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
      className={`${sora.variable} ${ibmPlexSans.variable} ${jetbrainsMono.variable}`}
    >
      <body className="bg-surface-primary text-text-primary font-body antialiased">
        {children}
      </body>
    </html>
  );
}
