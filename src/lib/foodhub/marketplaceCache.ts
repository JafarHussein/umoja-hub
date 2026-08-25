import { revalidatePath } from 'next/cache';
import { logger } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Invalidating the public marketplace after a write.
//
// `/marketplace` and `/marketplace/[listingId]` are deliberately cached —
// `revalidate = 60` on both pages, recorded as an architectural decision in
// `context/WEBSITE_WEBAPP_BOUNDARY.md`. That decision is not in question here;
// anonymous browsing of a listing grid is exactly the read that should be
// served from cache.
//
// What was missing is the other half of any ISR design: a write has to
// invalidate the page that reads it. Without that, a farmer publishing produce
// watched it appear in "My Produce" and *not* on the marketplace for up to a
// minute — and because Next serves stale-while-revalidating, the reload that a
// person's instinct reaches for returns the stale page one more time before the
// new one arrives. Measured on a running build: a listing live in
// `GET /api/marketplace` was absent from the rendered page for the rest of the
// window. The same gap let a listing detail page advertise stock that an order
// had already taken.
//
// So: the cache stays, and every path that changes what the marketplace shows
// says so here. Failures are swallowed — an invalidation that cannot run must
// degrade to the old 60-second staleness, never to a failed write whose data is
// already committed.
// ---------------------------------------------------------------------------

/**
 * Drops the cached public marketplace feed, and the detail page for `listingId`
 * when one is named.
 *
 * Call it *after* the database write has succeeded, from any route that
 * publishes, edits, pauses, reactivates, or changes the available stock of a
 * listing.
 */
export function revalidateMarketplace(listingId?: string): void {
  try {
    revalidatePath('/marketplace');
    if (listingId) {
      revalidatePath(`/marketplace/${listingId}`);
    }
  } catch (err) {
    // Reached when there is no render context to invalidate — a script, a test,
    // a background job. The write itself is done and correct; the reader simply
    // waits out the ordinary revalidate window.
    logger.warn('marketplace', 'Cache invalidation skipped', { listingId, err });
  }
}
