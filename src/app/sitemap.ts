import type { MetadataRoute } from 'next';
import { doorways } from '@/components/website/doorways';

/**
 * Sitemap for the public website (foundation §13 — findability for auditors,
 * researchers, and search/AI crawlers). Only the publicly indexable surfaces:
 * the Documentation Stream homepage and the five audience doorways. Dashboard,
 * API, and auth routes are private and excluded (see robots.ts). Base URL
 * mirrors the root layout's metadataBase pattern.
 */
const base = (process.env.NEXTAUTH_URL ?? 'http://localhost:3000').replace(/\/$/, '');

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
