import type { Metadata } from 'next';
import { WebsiteNav } from '@/components/website/WebsiteNav';
import { WebsiteFooter } from '@/components/website/WebsiteFooter';

export const metadata: Metadata = {
  title: {
    default: 'UmojaHub — Verified Agricultural Marketplace for East Africa',
    template: '%s — UmojaHub',
  },
  description:
    'A verified farmer marketplace and education platform for CS students. Powered by M-Pesa. Built for East Africa.',
};

export default function WebsiteLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-surface-elevated focus:text-text-primary focus:font-body focus:text-t5 focus:rounded-sm focus:border focus:border-accent-green"
      >
        Skip to content
      </a>
      <WebsiteNav />
      <main id="main-content" className="pt-16">
        {children}
      </main>
      <WebsiteFooter />
    </>
  );
}
