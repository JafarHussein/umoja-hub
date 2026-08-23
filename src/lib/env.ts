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
 * The deployment's absolute base URL, derived from `NEXTAUTH_URL`, without a
 * trailing slash.
 *
 * `validateEnv` only checks that `NEXTAUTH_URL` is *present*, and every consumer
 * that merely concatenates strings accepts a malformed one silently. `new URL()`
 * does not: a schemeless value such as `umojahub.co.ke` throws
 * `ERR_INVALID_URL`. In the root layout's `metadataBase` that throw happens
 * while Next is collecting page configuration, which fails the whole production
 * build — this is exactly how production deploys broke. A cosmetic metadata URL
 * must never be able to take the build down, so resolution is total:
 *
 * - a well-formed http(s) URL is used as given;
 * - a bare host is upgraded to https, covering the missing-scheme case;
 * - anything else falls back to localhost.
 *
 * A wrong-but-usable base URL degrades metadata and sitemap links. It does not
 * stop the deploy, and the operator still has to correct the variable.
 */
export function siteUrl(): string {
  const fallback = 'http://localhost:3000';
  const raw = process.env['NEXTAUTH_URL']?.trim();
  if (!raw) return fallback;

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

  const direct = asUrl(raw);
  if (direct) return direct;

  // Only a value that named no scheme may be upgraded. Prefixing `https://` on
  // one that did (`ftp://host`) parses into nonsense — host `ftp`, path
  // `//host` — rather than failing, so an explicit non-http scheme is rejected
  // outright instead.
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(raw)) return fallback;

  return asUrl(`https://${raw}`) ?? fallback;
}
