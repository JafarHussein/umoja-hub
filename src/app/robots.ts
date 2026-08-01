import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/env';

/**
 * Robots policy. The public website is fully crawlable; the operational app,
 * API, and auth gateway are private and disallowed. Points crawlers at the
 * sitemap. Base URL shares the root layout's metadataBase resolution, so a
 * schemeless NEXTAUTH_URL cannot emit `umojahub.co.ke/sitemap.xml` here while
 * the layout reports something else.
 */
const base = siteUrl();

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard/', '/api/', '/auth/', '/onboarding/'],
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
