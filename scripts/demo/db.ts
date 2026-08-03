// Demo-world DB bootstrap. Loads Next env (.env / .env.local), connects through
// the same singleton the app uses, and hard-guards against running in
// production. The engine NEVER drops collections or runs unscoped deletes.

import { loadEnvConfig } from '@next/env';

export function guardEnvironment(): void {
  if (process.env.NODE_ENV === 'production' && process.env.DEMO_ALLOW_PROD !== 'true') {
    // eslint-disable-next-line no-console
    console.error('DANGER: the demo world generator refuses to run in production.');
    process.exit(1);
  }
}

export async function bootstrap(): Promise<typeof import('mongoose').default> {
  guardEnvironment();
  loadEnvConfig(process.cwd());
  const { connectDB } = await import('../../src/lib/db');
  await connectDB();
  const mongoose = (await import('mongoose')).default;
  return mongoose;
}

export async function shutdown(): Promise<void> {
  const mongoose = (await import('mongoose')).default;
  await mongoose.disconnect();
}

export function log(msg: string): void {
  // eslint-disable-next-line no-console
  console.log(`[demo] ${msg}`);
}
