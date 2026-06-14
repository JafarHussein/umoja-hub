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

type RequiredEnvVar = (typeof baseRequiredEnvVars)[number] | (typeof darajaEnvVars)[number];

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
