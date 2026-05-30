import type { Metadata } from 'next';
import { playfair, ibmPlexSans, ibmPlexMono } from '@/lib/fonts';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'UmojaHub — Agricultural & Academic Infrastructure',
    template: '%s — UmojaHub',
  },
  description:
    'UmojaHub builds the verification infrastructure for East African agricultural markets and academic institutions.',
  metadataBase: new URL('https://umojahub.co.ke'),
  openGraph: {
    siteName: 'UmojaHub',
    locale: 'en_KE',
    type: 'website',
  },
};

export default function RootLayout({ children }: { readonly children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${ibmPlexSans.variable} ${ibmPlexMono.variable}`}
      suppressHydrationWarning
    >
      <body className="bg-surface-primary text-text-primary" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
