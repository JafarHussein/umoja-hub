import { test, expect, type Locator, type Page } from '@playwright/test';
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

// The detail page is streamed: React ships the checkout markup inside a hidden
// holder (`<div hidden id="S:1">`) and only moves it into the Suspense boundary
// once that chunk is ready. Until the swap lands both copies are in the DOM, so
// a page-wide query resolves two identical controls and trips strict mode —
// which is exactly how this spec failed in CI. Scope every query to the visible
// form instead of the document.
function checkoutForm(page: Page): Locator {
  return page
    .locator('form')
    .filter({ has: page.getByRole('heading', { name: 'Pay with M-Pesa' }) })
    .filter({ visible: true });
}

async function fillPhoneAndPay(page: Page): Promise<void> {
  const form = checkoutForm(page);
  // A visible <label> now, rather than an aria-label on a placeholder-labelled
  // input. Same field, properly labelled.
  await form.getByLabel(/M-Pesa number/i).fill('700000000');
  await form.getByRole('button', { name: /pay ksh/i }).click();
}

test('checkout shows the quantity lock bound to available stock', async ({ page }) => {
  await page.goto(CHECKOUT_URL);

  const form = checkoutForm(page);
  await expect(form).toBeVisible({ timeout: 30_000 });
  // Quantity is locked to the listing's available stock.
  await expect(form.getByText('of 25 available')).toBeVisible();
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
  const form = checkoutForm(page);
  await expect(form).toBeVisible({ timeout: 30_000 });
  await fillPhoneAndPay(page);

  await expect(form.getByText(/no longer available/i)).toBeVisible();
  await expect(form.getByRole('button', { name: 'Refresh stock' })).toBeVisible();
});

test('a payment we cannot confirm is never reported as one that did not happen', async ({
  page,
}) => {
  // This test previously asserted the opposite, and asserted it on purpose:
  // when the 90-second poll window closed, checkout said "No confirmation
  // arrived from M-Pesa. Nothing has been charged" and offered Retry, and the
  // spec's own comment called that "what a buyer needs to know before deciding
  // to retry".
  //
  // Neither half was safe. The window closing is a fact about how long this
  // screen watches, not about the payment: the platform does not know whether
  // the buyer was charged, which is the entire reason UNRESOLVED and
  // reconciliation exist. And Retry returned to an empty form, so the next
  // submit created a SECOND order and a second STK push. A buyer who entered
  // their PIN at second eighty-nine could pay twice.
  //
  // What the screen must now do: say only what it knows, tell the buyer not to
  // pay again, and send them to the order, where the poll continues and
  // reconciliation runs.
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
  await expect(checkoutForm(page)).toBeVisible({ timeout: 30_000 });
  await fillPhoneAndPay(page);

  // The form is replaced by the waiting panel: what the buyer must do, and the
  // amount, with no depleting bar implying the payment itself expires.
  // .first() throughout: the streamed page keeps a hidden copy of this markup
  // until the Suspense swap lands, so page-wide text queries see two matches.
  await expect(page.getByText(/Enter your M-Pesa PIN/i).first()).toBeVisible();
  await expect(page.getByText('KSh 50').first()).toBeVisible();

  // Run out the bounded window.
  await page.clock.fastForward(91_000);

  // What it says now: that we do not know.
  await expect(
    page.getByText(/cannot say whether this payment went through/i).first()
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Do not pay again yet' }).first()).toBeVisible();
  await expect(page.getByText(/check your M-Pesa messages/i).first()).toBeVisible();

  // What it must never say, and must never offer.
  await expect(page.getByText(/nothing has been charged/i)).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Retry' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Start again' })).toHaveCount(0);

  // The way forward is the order, where the poll continues and reconciliation
  // runs, rather than a fresh checkout that would open a second payment.
  await expect(page.getByRole('link', { name: /go to this order/i }).first()).toBeVisible();
});

test('an established failure does say nothing was charged, and offers a way back', async ({
  page,
}) => {
  // The distinction the state above exists to protect. Here M-Pesa answered,
  // and the answer was no, so "nothing left your account" is a fact rather
  // than a hope, and returning to the form cannot cause a double payment.
  await page.route('**/api/orders', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            orderId: 'e2e-order-2',
            orderReferenceId: 'E2E-CHK-0002',
            totalAmountKES: 50,
            mpesaCheckoutRequestId: 'ws_CO_e2e_2',
          },
        }),
      });
      return;
    }
    await route.fallback();
  });
  await page.route('**/api/orders/*/payment-status', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        paymentStatus: 'FAILED',
        events: [
          {
            type: 'FAILED',
            label: 'Payment failed',
            detail: 'The buyer cancelled the prompt on their handset.',
            occurredAt: new Date().toISOString(),
          },
        ],
      }),
    });
  });

  await page.goto(CHECKOUT_URL);
  await expect(checkoutForm(page)).toBeVisible({ timeout: 30_000 });
  await fillPhoneAndPay(page);

  // The reason M-Pesa actually gave, not a generic decline.
  await expect(page.getByText(/cancelled the prompt on their handset/i).first()).toBeVisible();
  await expect(page.getByText(/Nothing has been charged/i).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start again' }).first()).toBeVisible();
});
