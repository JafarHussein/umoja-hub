import { Playfair_Display, IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google';

export const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
  display: 'swap',
});

export const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal'],
  variable: '--font-ibm-plex-sans',
  display: 'swap',
});

export const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  style: ['normal'],
  variable: '--font-ibm-plex-mono',
  display: 'swap',
});
