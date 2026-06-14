import { test, expect } from '@playwright/test';
import { authFile } from './support/auth';

// ---------------------------------------------------------------------------
// UI-07 — Buyer checkout (corrected D01): quantity lock + 90-s poll ticker +
// explicit timeout / inventory-lock-failed paths.
//
// The real flow depends on Daraja STK push, which isn't reachable in the
// harness, so the order POST + payment-status are intercepted with page.route
// to drive each branch deterministically; page.clock drives the bounded poll.
// The listing itself is real (seeded) so the detail page renders the form.
// ---------------------------------------------------------------------------

const LISTING_ID = '000000000000000000000010';
const CHECKOUT_URL = `/marketplace/${LISTING_ID}`;

test.use({ storageState: authFile('buyer') });

async function fillPhoneAndPay(page: import('@playwright/test').Page): Promise<void> {
  await page.getByLabel(/M-Pesa phone number/i).fill('700000000');
  await page.getByRole('button', { name: /pay kes/i }).click();
}

test('checkout shows the quantity lock bound to available stock', async ({ page }) => {
  await page.goto(CHECKOUT_URL);

  await expect(page.getByRole('heading', { name: 'Pay with M-Pesa' })).toBeVisible({
    timeout: 30_000,
  });
  // Quantity is locked to the listing's available stock. The detail page can
  // render the checkout form more than once (responsive layout), so scope to
  // the first match.
  await expect(page.getByText('of 25 avail.').first()).toBeVisible();
});

test('inventory-lock-failed surfaces an explicit refresh path', async ({ page }) => {
  await page.route('**/api/orders', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'The requested quantity is no longer available.',
          code: 'ORDER_INSUFFICIENT_STOCK',
        }),
      });
      return;
    }
    await route.fallback();
  });

  await page.goto(CHECKOUT_URL);
  await expect(page.getByRole('heading', { name: 'Pay with M-Pesa' })).toBeVisible({
    timeout: 30_000,
  });
  await fillPhoneAndPay(page);

  await expect(page.getByText(/no longer available/i)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Refresh stock' })).toBeVisible();
});

test('awaiting payment shows the 90-s ticker and times out explicitly', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-01-01T00:00:00.000Z') });

  await page.route('**/api/orders', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            orderId: 'e2e-order-1',
            orderReferenceId: 'E2E-CHK-0001',
            totalAmountKES: 50,
            mpesaCheckoutRequestId: 'ws_CO_e2e',
          },
        }),
      });
      return;
    }
    await route.fallback();
  });
  // Payment never confirms → the bounded poll must time out.
  await page.route('**/api/orders/*/payment-status', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ paymentStatus: 'PENDING_PAYMENT' }),
    });
  });

  await page.goto(CHECKOUT_URL);
  await expect(page.getByRole('heading', { name: 'Pay with M-Pesa' })).toBeVisible({
    timeout: 30_000,
  });
  await fillPhoneAndPay(page);

  // Ticker visible and counting from the full 90-s window.
  await expect(page.getByText('Waiting for confirmation')).toBeVisible();
  await expect(page.getByText('90s', { exact: true })).toBeVisible();

  // Run out the bounded window → explicit timeout, never an indefinite lock.
  await page.clock.fastForward(91_000);
  await expect(page.getByText(/payment timed out/i)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible();
});
