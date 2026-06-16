import type { MetadataRoute } from 'next';

/**
 * Robots policy. The public website is fully crawlable; the operational app,
 * API, and auth gateway are private and disallowed. Points crawlers at the
 * sitemap. Base URL mirrors the root layout's metadataBase pattern.
 */
const base = (process.env.NEXTAUTH_URL ?? 'http://localhost:3000').replace(/\/$/, '');

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
