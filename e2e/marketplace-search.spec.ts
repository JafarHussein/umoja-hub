import { test, expect } from '@playwright/test';

// ---------------------------------------------------------------------------
// Marketplace full-text search (Task 21).
//
// The public marketplace forwards ?q= to GET /api/marketplace, which runs a
// MongoDB $text search over title/cropName/description (text index on the
// model) sorted by relevance. Driven by the seeded AVAILABLE listing
// "E2E Sukuma Wiki — Grade A" (cropName "Sukuma Wiki"). No auth — the
// marketplace is public and whitelisted in middleware.
// ---------------------------------------------------------------------------

test('a matching query returns the listing and reflects the term', async ({ page }) => {
  await page.goto('/marketplace?q=sukuma');

  // The search box mirrors the active query.
  await expect(page.getByLabel('Search')).toHaveValue('sukuma');

  // The seeded listing matches the full-text query.
  await expect(page.getByText(/sukuma wiki/i).first()).toBeVisible({ timeout: 30_000 });
});

test('a non-matching query shows the empty state', async ({ page }) => {
  await page.goto('/marketplace?q=zzqnomatchxyz');
  await expect(page.getByText('No listings found')).toBeVisible({ timeout: 30_000 });
});
