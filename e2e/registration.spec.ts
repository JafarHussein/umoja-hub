import { test, expect, type Page } from '@playwright/test';

// ---------------------------------------------------------------------------
// Email + password registration, driven the way a person drives it.
//
// Every other spec in this suite starts from a minted session cookie, because
// every other screen sits behind one. This spec is the exception on purpose: it
// is the one journey that begins with no account at all, so it runs with an
// explicitly empty storage state and walks the whole corridor —
//
//   /auth/login -> /auth/register -> account -> role -> details -> dashboard
//
// and then proves the account is real by signing out and signing back in.
// ---------------------------------------------------------------------------

test.use({ storageState: { cookies: [], origins: [] } });

const PASSWORD = 'Shamba2026!';

// A fresh address per test. The harness drops its database at global setup, but
// Playwright retries a failed test inside the same run — a fixed email would
// pass on the first attempt and hit "email already exists" on the retry, which
// looks like a product bug and is not one.
function uniqueEmail(label: string): string {
  return `e2e.reg.${label}.${Date.now()}.${Math.random().toString(36).slice(2, 7)}@example.com`;
}

async function fillRegistration(
  page: Page,
  values: { fullName: string; email: string; password: string; confirmPassword?: string }
): Promise<void> {
  await page.getByLabel('Full name').fill(values.fullName);
  await page.getByLabel('Email address').fill(values.email);
  await page.getByLabel('Password', { exact: true }).fill(values.password);
  await page.getByLabel('Confirm password').fill(values.confirmPassword ?? values.password);
}

// Sign out through the account menu the product actually ships, so this covers
// the control a user would reach for rather than NextAuth's built-in fallback.
async function signOut(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Account menu' }).first().click();
  await page.getByRole('menuitem', { name: 'Sign out' }).click();
  await expect(page).toHaveURL(/\/auth\/login/, { timeout: 20_000 });
}

// ---------------------------------------------------------------------------
// Navigation — registration must be findable, and neither page may dead-end.
// ---------------------------------------------------------------------------

test.describe('finding registration', () => {
  test('the login page offers a route to it, and it offers a route back', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByRole('link', { name: 'Create your account' }).click();

    await expect(page).toHaveURL(/\/auth\/register/);
    await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible();

    await page.getByRole('link', { name: 'Sign in', exact: true }).click();
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('opens correctly when typed straight into the address bar', async ({ page }) => {
    const response = await page.goto('/auth/register');
    expect(response?.ok()).toBe(true);
    await expect(page.getByLabel('Full name')).toBeVisible();
  });

  test('a guarded route still bounces a visitor with no account to login', async ({ page }) => {
    await page.goto('/dashboard/farmer/listings');
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});

// ---------------------------------------------------------------------------
// Validation. The server is authoritative; these assert the user is told what
// is wrong before paying for a round-trip to find out.
// ---------------------------------------------------------------------------

test.describe('registration validation', () => {
  test('says nothing until the first submit, then says all of it', async ({ page }) => {
    await page.goto('/auth/register');
    // Opening a form already covered in red is worse than a form that waits.
    // Measured by `aria-invalid`, which is what the field actually sets and what
    // a screen reader actually announces. (`role="alert"` is unusable as a probe
    // here: Next.js's route announcer permanently occupies one.)
    await expect(page.locator('[aria-invalid="true"]')).toHaveCount(0);

    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page.getByText('Enter your full name')).toBeVisible();
    await expect(page.getByText('Enter your email address')).toBeVisible();
    // Every empty field is marked, not just the first.
    await expect(page.locator('[aria-invalid="true"]')).toHaveCount(3);
  });

  test('rejects an invalid email without contacting the server', async ({ page }) => {
    await page.goto('/auth/register');
    await fillRegistration(page, {
      fullName: 'Mercy Wairimu',
      email: 'mercy.wairimu',
      password: PASSWORD,
    });
    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page.getByText('Enter a valid email address')).toBeVisible();
    await expect(page).toHaveURL(/\/auth\/register/);
  });

  test('rejects a weak password and names the missing rule', async ({ page }) => {
    await page.goto('/auth/register');
    await fillRegistration(page, {
      fullName: 'Mercy Wairimu',
      email: uniqueEmail('weak'),
      password: 'shamba',
    });
    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page.getByText('Password must be at least 8 characters')).toBeVisible();
  });

  test('reports a password mismatch on the field that can fix it', async ({ page }) => {
    await page.goto('/auth/register');
    await fillRegistration(page, {
      fullName: 'Mercy Wairimu',
      email: uniqueEmail('mismatch'),
      password: PASSWORD,
      confirmPassword: 'Shamba2027!',
    });
    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page.getByText('Both passwords must match')).toBeVisible();
  });

  test('clears a message as soon as the field is corrected', async ({ page }) => {
    await page.goto('/auth/register');
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page.getByText('Enter your full name')).toBeVisible();

    await page.getByLabel('Full name').fill('Mercy Wairimu');
    await expect(page.getByText('Enter your full name')).toHaveCount(0);
  });
});

// ---------------------------------------------------------------------------
// The whole journey.
// ---------------------------------------------------------------------------

test.describe('a new farmer joins UmojaHub', () => {
  test('registers, completes setup, lands on the farmer dashboard, and persists', async ({
    page,
  }) => {
    const email = uniqueEmail('farmer');

    // --- Register ---------------------------------------------------------
    await page.goto('/auth/register');
    await fillRegistration(page, { fullName: 'Mercy Wairimu', email, password: PASSWORD });
    await page.getByRole('button', { name: 'Create account' }).click();

    // Signed in and dropped into the funnel at role selection — the account was
    // created with a password, so the OAuth-only PASSWORD_SETUP step is skipped.
    await expect(page).toHaveURL(/\/onboarding\/role-selection/, { timeout: 20_000 });
    await expect(page.getByRole('heading', { name: 'How will you use UmojaHub?' })).toBeVisible();

    // --- Role -------------------------------------------------------------
    // ADMIN is not on offer here and is not accepted by the route behind it.
    await expect(page.getByRole('radio', { name: /Admin/i })).toHaveCount(0);
    await expect(page.getByRole('radio', { name: /Institution/i })).toHaveCount(0);

    await page.getByRole('radio', { name: /Farmer/ }).click();
    await page.getByRole('button', { name: 'Continue' }).click();

    // --- Details ----------------------------------------------------------
    await expect(page).toHaveURL(/\/onboarding\/identity-input/, { timeout: 20_000 });
    await page.getByLabel('Last name').fill('Wairimu');
    await page.getByLabel('Phone number').fill('0722114466');
    await page.selectOption('#county', 'Nyeri');
    await page.getByRole('button', { name: 'Continue' }).click();

    // --- Landed -----------------------------------------------------------
    await expect(page).toHaveURL(/\/dashboard\/farmer\/listings/, { timeout: 20_000 });

    // --- The role is real, not cosmetic -----------------------------------
    // A farmer must not be able to reach another role's surface, and the admin
    // console must not even appear to exist.
    await page.goto('/dashboard/lecturer/reports');
    await expect(page).toHaveURL(/\/auth\/unauthorized/);

    const adminResponse = await page.goto('/dashboard/admin/verification-queue');
    expect(adminResponse?.status()).toBe(404);

    // --- Sign out, sign back in ------------------------------------------
    await page.goto('/dashboard/farmer/listings');
    await signOut(page);

    await page.getByLabel('Username or email').fill(email);
    await page.getByLabel('Password').fill(PASSWORD);
    await page.getByRole('button', { name: 'Sign in' }).click();

    // The account survived the session — same person, same role, same landing.
    await expect(page).toHaveURL(/\/dashboard\/farmer\/listings/, { timeout: 20_000 });
  });

  test('refuses a second account on the same email, and says how to proceed', async ({ page }) => {
    const email = uniqueEmail('dup');

    await page.goto('/auth/register');
    await fillRegistration(page, { fullName: 'Mercy Wairimu', email, password: PASSWORD });
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page).toHaveURL(/\/onboarding\/role-selection/, { timeout: 20_000 });

    // Sign out so the second attempt is made by a stranger, as it would be.
    // The funnel shell carries the same account menu the dashboard does.
    await signOut(page);

    await page.goto('/auth/register');
    await fillRegistration(page, { fullName: 'Someone Else', email, password: 'Nother2026!' });
    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page.getByText('That email is already registered.')).toBeVisible();
    // Told what to do about it, not just that it failed.
    await expect(page.getByRole('link', { name: 'Sign in instead' })).toBeVisible();
    await expect(page).toHaveURL(/\/auth\/register/);
  });

  test('a student can register with an email and password', async ({ page }) => {
    // GitHub is the only OAuth route to a student account. An email/password
    // account has no provider, so no provider rule applies to it — this is the
    // gate that silently barred STUDENT before registration existed.
    const email = uniqueEmail('student');

    await page.goto('/auth/register');
    await fillRegistration(page, { fullName: 'Dennis Kariuki', email, password: PASSWORD });
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page).toHaveURL(/\/onboarding\/role-selection/, { timeout: 20_000 });

    await page.getByRole('radio', { name: /Student/ }).click();
    await page.getByRole('button', { name: 'Continue' }).click();

    // Accepted — not bounced back with "not available for your sign-in method".
    await expect(page).toHaveURL(/\/onboarding\/identity-input/, { timeout: 20_000 });
  });
});

// ---------------------------------------------------------------------------
// Server-side authority. The form is guidance; this is the boundary.
// ---------------------------------------------------------------------------

test.describe('the registration endpoint', () => {
  // The per-IP registration cap is real and shared by everything in this file,
  // which all arrives from the same loopback address. These direct calls declare
  // their own source so the suite throttles nothing but itself in production
  // terms — and so a failure here means the endpoint is wrong, not that the
  // previous test used up the allowance.
  test.use({ extraHTTPHeaders: { 'x-forwarded-for': '203.0.113.7' } });

  test('ignores a role submitted in the request body', async ({ request }) => {
    const email = uniqueEmail('roleinject');
    const res = await request.post('/api/auth/register', {
      data: {
        fullName: 'Privilege Seeker',
        email,
        password: PASSWORD,
        confirmPassword: PASSWORD,
        // Not a field the schema has. Stripped, never stored.
        role: 'ADMIN',
        isEmailVerified: true,
      },
    });

    expect(res.status()).toBe(201);
    const body = await res.json();
    // The response describes an account with no role. The role is chosen at the
    // next step, against an enum with no ADMIN member — see the unit tests for
    // POST /api/onboarding/role, which assert the refusal directly.
    expect(JSON.stringify(body)).not.toContain('ADMIN');
    expect(body.data.onboardingStage).toBe('ROLE_SELECTION');
  });

  test('rejects an invalid body with field errors, not a stack trace', async ({ request }) => {
    const res = await request.post('/api/auth/register', {
      data: { fullName: '', email: 'nope', password: 'x', confirmPassword: 'y' },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.code).toBe('VALIDATION_FAILED');
    expect(body.details.fieldErrors).toBeTruthy();
    expect(JSON.stringify(body)).not.toContain('at Object');
  });

  test('never returns a password or a hash', async ({ request }) => {
    const res = await request.post('/api/auth/register', {
      data: {
        fullName: 'Mercy Wairimu',
        email: uniqueEmail('nosecret'),
        password: PASSWORD,
        confirmPassword: PASSWORD,
      },
    });
    expect(res.status()).toBe(201);
    const raw = JSON.stringify(await res.json());
    expect(raw).not.toContain(PASSWORD);
    expect(raw).not.toContain('hashedPassword');
    expect(raw).not.toContain('$2');
  });
});
