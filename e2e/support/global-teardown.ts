import fs from 'node:fs';
import { loadEnvConfig } from '@next/env';
import { dropE2EDatabase, resolveE2EDatabaseUri, describeUri } from './database';
import { AUTH_DIR } from './auth';

// ---------------------------------------------------------------------------
// Global teardown: leave nothing behind.
//
// Global setup drops and rebuilds the harness database, so correctness never
// depended on this file — but "the next run will clean it up" is not the same
// as clean. Between runs the fixtures would still be sitting in a database, and
// the point of the isolation work is that test data has no life outside the run
// that created it.
//
// The minted session cookies go too. They authenticate users that no longer
// exist, so keeping them only invites a confusing failure later.
//
// A teardown that throws would fail an otherwise green run, so problems are
// reported and swallowed. That is not a hole: the ownership guard inside
// `dropE2EDatabase` refuses before deleting anything, and a refusal here is
// printed rather than hidden.
// ---------------------------------------------------------------------------

export default async function globalTeardown(): Promise<void> {
  loadEnvConfig(process.cwd());

  try {
    const uri = resolveE2EDatabaseUri();
    await dropE2EDatabase(uri);
    // eslint-disable-next-line no-console
    console.log(`[e2e] dropped the harness database ${describeUri(uri)}`);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(
      `[e2e] teardown could not drop the harness database: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }

  fs.rmSync(AUTH_DIR, { recursive: true, force: true });
}
