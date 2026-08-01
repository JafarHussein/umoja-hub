import type { MetadataRoute } from 'next';
import { doorways } from '@/components/website/doorways';
import { siteUrl } from '@/lib/env';

/**
 * Sitemap for the public website (foundation §13 — findability for auditors,
 * researchers, and search/AI crawlers). Only the publicly indexable surfaces:
 * the Documentation Stream homepage and the five audience doorways. Dashboard,
 * API, and auth routes are private and excluded (see robots.ts). Base URL
 * shares the root layout's metadataBase resolution.
 */
const base = siteUrl();

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    ...doorways.map((d) => ({
      url: `${base}/for/${d.slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ];
}
