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
      {/* Activates body.is-hydrated gate for progressive enhancement animations.
          Content stays visible without JS; this script constrains then reveals
          elements via IntersectionObserver as they enter the viewport. */}
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){function i(){document.body.classList.add('is-hydrated');var o=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in-view');o.unobserve(e.target);}});},{threshold:0.1});document.querySelectorAll('.animate-on-scroll').forEach(function(e){o.observe(e);});}if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',i);}else{i();}})();`,
        }}
      />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-ws-surface-dark-2 focus:text-ws-text-bright focus:font-geist focus:text-ws-body-sm focus:rounded-sm focus:border focus:border-ws-hub-green"
      >
        Skip to content
      </a>
      <WebsiteNav />
      <main id="main-content" role="main" className="pt-16">
        {children}
      </main>
      <WebsiteFooter />
    </>
  );
}
