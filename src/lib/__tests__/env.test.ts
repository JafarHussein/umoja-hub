import { validateEnv, siteUrl } from '../env';

// Every always-required var, set to a placeholder. The M-Pesa vars are
// deliberately omitted so we can assert the conditional requirement.
const BASE_VARS = [
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
];

const MPESA_VARS = [
  'MPESA_CONSUMER_KEY',
  'MPESA_CONSUMER_SECRET',
  'MPESA_SHORTCODE',
  'MPESA_PASSKEY',
  'MPESA_CALLBACK_URL',
];

function baseEnv(): Record<string, string> {
  const env: Record<string, string> = { NODE_ENV: 'test' };
  for (const key of BASE_VARS) env[key] = 'x';
  return env;
}

describe('validateEnv — conditional M-Pesa requirement', () => {
  const saved = process.env;
  afterEach(() => {
    process.env = saved;
  });

  it('does not require M-Pesa credentials in simulation mode', () => {
    process.env = { ...baseEnv(), PAYMENT_PROVIDER: 'simulation' } as unknown as NodeJS.ProcessEnv;
    expect(() => validateEnv()).not.toThrow();
  });

  it('treats a missing PAYMENT_PROVIDER as simulation (no M-Pesa needed)', () => {
    process.env = baseEnv() as unknown as NodeJS.ProcessEnv;
    expect(() => validateEnv()).not.toThrow();
  });

  it('requires M-Pesa credentials when a Daraja provider is selected', () => {
    process.env = { ...baseEnv(), PAYMENT_PROVIDER: 'daraja-sandbox' } as unknown as NodeJS.ProcessEnv;
    expect(() => validateEnv()).toThrow(/MPESA_SHORTCODE/);
  });

  it('passes for Daraja when the credentials are present', () => {
    const env: Record<string, string> = { ...baseEnv(), PAYMENT_PROVIDER: 'daraja-production' };
    for (const key of MPESA_VARS) env[key] = 'x';
    process.env = env as unknown as NodeJS.ProcessEnv;
    expect(() => validateEnv()).not.toThrow();
  });
});

describe('siteUrl — NEXTAUTH_URL resolution', () => {
  const saved = process.env;

  beforeEach(() => {
    process.env = { ...saved };
  });

  afterEach(() => {
    process.env = saved;
  });

  function withUrl(value: string | undefined): string {
    if (value === undefined) delete process.env['NEXTAUTH_URL'];
    else process.env['NEXTAUTH_URL'] = value;
    return siteUrl();
  }

  it('uses a well-formed https URL as given', () => {
    expect(withUrl('https://umojahub.co.ke')).toBe('https://umojahub.co.ke');
  });

  it('keeps a non-default port and an http scheme', () => {
    expect(withUrl('http://localhost:3000')).toBe('http://localhost:3000');
  });

  it('strips a trailing slash so callers can concatenate paths', () => {
    expect(withUrl('https://umojahub.co.ke/')).toBe('https://umojahub.co.ke');
  });

  it('preserves a base path', () => {
    expect(withUrl('https://umojahub.co.ke/app')).toBe('https://umojahub.co.ke/app');
  });

  // The production defect: `new URL()` throws ERR_INVALID_URL on this, which
  // failed the whole build from the root layout's metadataBase.
  it('upgrades a schemeless host to https rather than throwing', () => {
    expect(withUrl('umojahub.co.ke')).toBe('https://umojahub.co.ke');
  });

  it('resolves a bare host:port, which URL parses as a bogus protocol', () => {
    expect(withUrl('localhost:3000')).toBe('https://localhost:3000');
  });

  it('falls back when the variable is unset', () => {
    expect(withUrl(undefined)).toBe('http://localhost:3000');
  });

  it('falls back on an empty or whitespace-only value', () => {
    expect(withUrl('')).toBe('http://localhost:3000');
    expect(withUrl('   ')).toBe('http://localhost:3000');
  });

  it('rejects a non-http protocol', () => {
    expect(withUrl('ftp://umojahub.co.ke')).toBe('http://localhost:3000');
  });

  it('always returns something new URL() accepts', () => {
    for (const value of ['umojahub.co.ke', '', 'ftp://x', 'localhost:3000', '://']) {
      expect(() => new URL(withUrl(value))).not.toThrow();
    }
  });
});
