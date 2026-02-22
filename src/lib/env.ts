/**
 * Boot-time environment variable validation.
 * This module is imported by src/lib/db.ts and src/lib/utils.ts.
 * If any required variable is missing, the application throws at startup
 * rather than failing silently at runtime.
 */

const requiredEnvVars = [
  'MONGODB_URI',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
  'GROQ_API_KEY',
  'OPENAI_API_KEY',
  'GITHUB_APP_ID',
  'GITHUB_APP_PRIVATE_KEY',
  'GITHUB_APP_INSTALLATION_ID',
  'MPESA_CONSUMER_KEY',
  'MPESA_CONSUMER_SECRET',
  'MPESA_SHORTCODE',
  'MPESA_PASSKEY',
  'MPESA_CALLBACK_URL',
  'SENDGRID_API_KEY',
  'SENDGRID_FROM_EMAIL',
  'AFRICASTALKING_API_KEY',
  'AFRICASTALKING_USERNAME',
  'OPEN_WEATHER_MAP_API_KEY',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'CRON_SECRET',
] as const;

type RequiredEnvVar = (typeof requiredEnvVars)[number];

/**
 * Validates all required environment variables are present.
 * Call this at application startup (not at module load time in serverless).
 */
export function validateEnv(): void {
  const missing: string[] = [];

  for (const key of requiredEnvVars) {
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
