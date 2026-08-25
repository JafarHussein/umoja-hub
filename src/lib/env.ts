/**
 * Boot-time environment variable validation.
 * This module is imported by src/lib/db.ts and src/lib/utils.ts.
 * If any required variable is missing, the application throws at startup
 * rather than failing silently at runtime.
 */

// Always required, regardless of the active payment provider.
const baseRequiredEnvVars = [
  'MONGODB_URI',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GITHUB_CLIENT_ID',
  'GITHUB_CLIENT_SECRET',
  'GROQ_API_KEY',
  'OPENAI_API_KEY',
  'AFRICASTALKING_API_KEY',
  'AFRICASTALKING_USERNAME',
  'OPEN_WEATHER_MAP_API_KEY',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME',
  'NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET',
  'CRON_SECRET',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'ADMIN_PHONE_NUMBER',
] as const;

// Required only when a real Daraja provider is active. With
// PAYMENT_PROVIDER=simulation (the default) the platform runs without any M-Pesa
// credentials — the simulator never calls Safaricom.
const darajaEnvVars = [
  'MPESA_CONSUMER_KEY',
  'MPESA_CONSUMER_SECRET',
  'MPESA_SHORTCODE',
  'MPESA_PASSKEY',
  'MPESA_CALLBACK_URL',
] as const;

export type RequiredEnvVar = (typeof baseRequiredEnvVars)[number] | (typeof darajaEnvVars)[number];

/** True when PAYMENT_PROVIDER selects a real Daraja provider. */
function darajaCredentialsRequired(): boolean {
  const provider = (process.env['PAYMENT_PROVIDER'] ?? 'simulation').toLowerCase();
  return provider === 'daraja-sandbox' || provider === 'daraja-production';
}

/**
 * Validates all required environment variables are present.
 * The M-Pesa credentials are required only when a Daraja provider is selected.
 * Call this at application startup (not at module load time in serverless).
 */
export function validateEnv(): void {
  const required: readonly string[] = darajaCredentialsRequired()
    ? [...baseRequiredEnvVars, ...darajaEnvVars]
    : baseRequiredEnvVars;

  const missing: string[] = [];

  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.map((k) => `  - ${k}`).join('\n')}\n\nSee .env.local.example for setup instructions.`
    );
  }
}

/**
 * Type-safe environment variable accessor.
 * Throws if the variable is missing (should not happen after validateEnv()).
 */
export function env(key: RequiredEnvVar): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} is not defined`);
  }
  return value;
}

/**
 * The platform's canonical, publicly reachable base URL, without a trailing
 * slash. Every absolute link the platform emits — page metadata, the sitemap,
 * and above all the links inside outbound email — must come from here and
 * nowhere else.
 *
 * WHY THIS IS NOT SIMPLY `NEXTAUTH_URL`
 * -------------------------------------
 * `NEXTAUTH_URL` is *the origin this server answers on*, because OAuth callbacks
 * have to come back to the process that started them. Running locally it is
 * therefore `http://localhost:3000`, and it has to be — pointing it anywhere
 * else breaks Google and GitHub sign-in on the development machine.
 *
 * "Where this server answers" and "where the public can reach UmojaHub" are two
 * different facts, and email is where the difference becomes a defect. A local
 * rehearsal sends real mail through the real SMTP account to real inboxes; when
 * those links were built from `NEXTAUTH_URL` every one of them read
 * `http://localhost:3000/...`. On the sender's own machine that resolves and
 * looks fine. On the recipient's phone — a different device, with its own
 * loopback — the browser has nothing to reach, and shows "This site can't be
 * reached". The link was never broken in transit or in the template; it was
 * addressed to the wrong computer.
 *
 * `PUBLIC_SITE_URL` states the public address explicitly, so a server whose own
 * origin is not publicly reachable can still emit links that are.
 *
 * Resolution order, first well-formed value wins:
 *
 * 1. `PUBLIC_SITE_URL` — the canonical public address, set deliberately.
 * 2. `NEXTAUTH_URL` — the deployment's own origin. Correct on Vercel, where the
 *    server *is* the public address.
 * 3. `VERCEL_PROJECT_PRODUCTION_URL` — Vercel's production alias for this
 *    project. A safety net: a preview deployment, or a production one whose
 *    `NEXTAUTH_URL` was never set, still links to the real application rather
 *    than to a URL that dies with the deployment.
 * 4. `http://localhost:3000` — last resort, so nothing here can throw.
 *
 * Resolution is total by design. `validateEnv` only checks that a variable is
 * *present*, and a consumer that concatenates strings accepts a malformed value
 * silently; `new URL()` does not — a schemeless `umojahub.co.ke` throws
 * `ERR_INVALID_URL`. In the root layout's `metadataBase` that throw happens
 * while Next is collecting page configuration, which fails the whole production
 * build. That is exactly how production deploys broke once already, so:
 *
 * - a well-formed http(s) URL is used as given;
 * - a bare host is upgraded to https, covering the missing-scheme case;
 * - anything else is skipped, and the next candidate is tried.
 *
 * A wrong-but-usable base URL degrades links. It does not stop the deploy, and
 * the operator still has to correct the variable.
 */
export function siteUrl(): string {
  const fallback = 'http://localhost:3000';

  // `new URL('localhost:3000')` parses with protocol `localhost:` rather than
  // throwing, so the protocol has to be checked and not just the parse.
  const asUrl = (candidate: string): string | null => {
    try {
      const parsed = new URL(candidate);
      const ok = parsed.protocol === 'http:' || parsed.protocol === 'https:';
      return ok ? parsed.toString().replace(/\/$/, '') : null;
    } catch {
      return null;
    }
  };

  const resolve = (raw: string | undefined): string | null => {
    const value = raw?.trim();
    if (!value) return null;

    const direct = asUrl(value);
    if (direct) return direct;

    // Only a value that named no scheme may be upgraded. Prefixing `https://`
    // on one that did (`ftp://host`) parses into nonsense — host `ftp`, path
    // `//host` — rather than failing, so an explicit non-http scheme is
    // rejected outright instead.
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(value)) return null;

    // `VERCEL_PROJECT_PRODUCTION_URL` is always supplied without a scheme, so
    // this branch is the normal path for it, not an error recovery.
    return asUrl(`https://${value}`);
  };

  for (const candidate of [
    process.env['PUBLIC_SITE_URL'],
    process.env['NEXTAUTH_URL'],
    process.env['VERCEL_PROJECT_PRODUCTION_URL'],
  ]) {
    const resolved = resolve(candidate);
    if (resolved) return resolved;
  }

  return fallback;
}

/**
 * True when `url` points at the machine that generated it.
 *
 * A loopback link is not merely unlikely to work for a recipient — it cannot
 * work, on any device other than the sender's own. Email is therefore the one
 * place that has to check, because it is the one place a link leaves the
 * machine that made it.
 */
export function isLoopbackUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace(/^\[|\]$/g, '');
    return host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '0.0.0.0';
  } catch {
    return false;
  }
}
