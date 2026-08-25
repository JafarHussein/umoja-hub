import { validateEnv, siteUrl, isLoopbackUrl } from '../env';

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
    process.env = {
      ...baseEnv(),
      PAYMENT_PROVIDER: 'daraja-sandbox',
    } as unknown as NodeJS.ProcessEnv;
    expect(() => validateEnv()).toThrow(/MPESA_SHORTCODE/);
  });

  it('passes for Daraja when the credentials are present', () => {
    const env: Record<string, string> = { ...baseEnv(), PAYMENT_PROVIDER: 'daraja-production' };
    for (const key of MPESA_VARS) env[key] = 'x';
    process.env = env as unknown as NodeJS.ProcessEnv;
    expect(() => validateEnv()).not.toThrow();
  });
});

describe('siteUrl — canonical public URL resolution', () => {
  const saved = process.env;

  beforeEach(() => {
    process.env = { ...saved };
    // next/jest loads .env.local, where PUBLIC_SITE_URL is deliberately set to
    // the deployed address so a local rehearsal cannot email localhost links.
    // These cases are about the NEXTAUTH_URL rung of the ladder, so the rungs
    // above and below it are cleared first.
    delete process.env['PUBLIC_SITE_URL'];
    delete process.env['VERCEL_PROJECT_PRODUCTION_URL'];
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

describe('siteUrl — precedence between the three sources', () => {
  const saved = process.env;

  beforeEach(() => {
    process.env = { ...saved };
    delete process.env['PUBLIC_SITE_URL'];
    delete process.env['VERCEL_PROJECT_PRODUCTION_URL'];
  });

  afterEach(() => {
    process.env = saved;
  });

  // The defect this ordering exists to prevent: NEXTAUTH_URL is the origin the
  // server answers on and must stay localhost during development, so it cannot
  // also be the address printed in an email that leaves the machine.
  it('lets PUBLIC_SITE_URL override a loopback NEXTAUTH_URL', () => {
    process.env['NEXTAUTH_URL'] = 'http://localhost:3000';
    process.env['PUBLIC_SITE_URL'] = 'https://umoja-hub.vercel.app';
    expect(siteUrl()).toBe('https://umoja-hub.vercel.app');
  });

  it('falls back to NEXTAUTH_URL when PUBLIC_SITE_URL is blank', () => {
    process.env['NEXTAUTH_URL'] = 'https://umoja-hub.vercel.app';
    process.env['PUBLIC_SITE_URL'] = '   ';
    expect(siteUrl()).toBe('https://umoja-hub.vercel.app');
  });

  // Vercel supplies this one without a scheme, which is the schemeless branch.
  it("uses Vercel's production alias when neither variable is set", () => {
    delete process.env['NEXTAUTH_URL'];
    process.env['VERCEL_PROJECT_PRODUCTION_URL'] = 'umoja-hub.vercel.app';
    expect(siteUrl()).toBe('https://umoja-hub.vercel.app');
  });

  it('skips a malformed candidate instead of settling on localhost', () => {
    process.env['PUBLIC_SITE_URL'] = 'ftp://wrong';
    process.env['NEXTAUTH_URL'] = 'https://umoja-hub.vercel.app';
    expect(siteUrl()).toBe('https://umoja-hub.vercel.app');
  });
});

describe('isLoopbackUrl', () => {
  it('recognises every address that only resolves on the sending machine', () => {
    expect(isLoopbackUrl('http://localhost:3000/dashboard/farmer')).toBe(true);
    expect(isLoopbackUrl('http://127.0.0.1:3000/auth/reset-password')).toBe(true);
    expect(isLoopbackUrl('http://[::1]:3000/')).toBe(true);
    expect(isLoopbackUrl('http://0.0.0.0:3000/')).toBe(true);
  });

  it('accepts a real public address', () => {
    expect(isLoopbackUrl('https://umoja-hub.vercel.app/dashboard/farmer')).toBe(false);
  });

  it('does not throw on a value that is not a URL', () => {
    expect(isLoopbackUrl('not a url')).toBe(false);
  });
});
