import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';

// ---------------------------------------------------------------------------
// E2E database isolation.
//
// The harness used to write its fixtures into whatever database `MONGODB_URI`
// named. Locally that is the presentation database, so every Playwright run
// injected `E2E Unverified Farmer` into the top of the administrator's
// verification queue and `E2E-FAR-0002` into the top of mediation — the two
// screens a panel is most likely to be shown. Clearing before a demo did not
// hold, because the next test run put them straight back.
//
// The harness now requires its own database, named by `MONGODB_E2E_URI`, and
// refuses to run without one. There is deliberately **no fallback** to
// `MONGODB_URI`: a fallback is exactly the behaviour that caused the problem,
// and a missing variable must be loud rather than quietly destructive.
//
// Two independent guards stand between the harness and a real database:
//
//   1. `assertDistinctFromAppDatabase` — `MONGODB_E2E_URI` must not address the
//      same host and database as `MONGODB_URI`. Checked once, in the Playwright
//      config. This catches the obvious copy-paste.
//   2. `assertHarnessOwnsDatabase` — the harness only ever drops a database it
//      can prove it owns: one that is either empty or carries the marker
//      collection this module writes. This catches everything else, including a
//      URI that differs by credentials but lands on the same data.
//
// Guard 2 is the one that matters. It means the worst outcome of a misconfigured
// URI is a refusal to run, never a dropped presentation.
//
// Every check here runs on a *bare* connection, opened and closed for the
// purpose, and always before `connectDB()`. That ordering is not incidental:
// the application's connection has all the Mongoose models bound to it, and
// Mongoose builds their indexes on connect, which creates the collections. An
// earlier version of this file checked after connecting and left eleven empty
// collections behind in the very database it then refused to touch. A guard
// that writes is not a guard.
// ---------------------------------------------------------------------------

/**
 * Collection whose presence marks a database as harness-owned and therefore
 * safe to drop. Written by global setup, checked before every destructive act.
 */
export const HARNESS_MARKER_COLLECTION = '__e2e_harness';

const MISSING_URI_MESSAGE = [
  '',
  'MONGODB_E2E_URI is not set — refusing to run the E2E suite.',
  '',
  'The Playwright harness writes fixture users, listings, orders, mediations and',
  'payout requests, then drops the whole database when the run ends. It must never',
  'do that to the development or presentation database, so it requires a database',
  'of its own and will not fall back to MONGODB_URI.',
  '',
  'Add a dedicated database to .env.local, for example the same cluster with a',
  'different database name:',
  '',
  '  MONGODB_E2E_URI="<same cluster as MONGODB_URI>/umojahub_e2e?<same options>"',
  '',
  'The harness creates and drops that database itself; nothing needs seeding.',
  '',
].join('\n');

/**
 * Host and database of a connection string, with credentials removed, so a
 * failure can say which database it means without printing a password.
 */
export function describeUri(uri: string): string {
  const withoutCredentials = uri.includes('@') ? uri.slice(uri.indexOf('@') + 1) : uri;
  const [hostAndPath] = withoutCredentials.split('?');
  const slash = hostAndPath.indexOf('/');
  const host = slash === -1 ? hostAndPath : hostAndPath.slice(0, slash);
  const database = slash === -1 ? '(default)' : hostAndPath.slice(slash + 1) || '(default)';
  // A sharded seed list is long and adds nothing to the message.
  return `${host.split(',')[0]}/${database}`;
}

/**
 * The E2E connection string, or a thrown explanation. Never falls back to
 * `MONGODB_URI` — see the note at the top of this file.
 */
export function resolveE2EDatabaseUri(): string {
  const uri = process.env.MONGODB_E2E_URI;
  if (!uri) throw new Error(MISSING_URI_MESSAGE);
  return uri;
}

/**
 * Guard 1: the harness database must not be the application's.
 *
 * This takes the application URI as an argument rather than reading it, and
 * that is the whole point. The Playwright config redirects `MONGODB_URI` onto
 * the harness database for the run, so by the time setup or teardown executes
 * the two variables are equal *by construction* — a guard reading the live
 * value would fire on every correctly-configured run and never on a
 * misconfigured one. It is checked once, in the config, while both values are
 * still their original selves.
 */
export function assertDistinctFromAppDatabase(appUri: string | undefined, e2eUri: string): void {
  if (!appUri) return;
  if (describeUri(appUri).toLowerCase() !== describeUri(e2eUri).toLowerCase()) return;

  throw new Error(
    [
      '',
      `MONGODB_E2E_URI addresses the same database as MONGODB_URI (${describeUri(e2eUri)}).`,
      '',
      'The E2E harness drops its database on every run. Pointed here it would be',
      'destroying the development or presentation data it exists to stay out of.',
      '',
      'Point MONGODB_E2E_URI at a different database name — the same cluster is fine.',
      '',
    ].join('\n')
  );
}

/** Open a connection with no models bound, so nothing is created by connecting. */
async function openBareConnection(uri: string): Promise<mongoose.Connection> {
  return mongoose.createConnection(uri, { bufferCommands: false }).asPromise();
}

/**
 * Guard 2: refuse to continue unless the database is provably the harness's own
 * — empty, or carrying the marker a previous harness run left behind. A URI
 * pointing somewhere real fails here, before anything is written or deleted.
 */
export async function assertHarnessOwnsDatabase(uri: string): Promise<void> {
  const probe = await openBareConnection(uri);
  try {
    const db = probe.db;
    if (!db) throw new Error('Could not open the E2E database for inspection.');

    const collections = await db.listCollections().toArray();
    if (collections.length === 0) return;
    if (collections.some((c) => c.name === HARNESS_MARKER_COLLECTION)) return;

    // Ownership is decided on documents, not on collection names.
    //
    // Playwright starts the web server *before* global setup, and the app
    // connects on boot, at which point Mongoose builds its indexes and creates
    // an empty collection for every model. On a database the previous run's
    // teardown had dropped, that meant setup arrived to find thirteen
    // collections and no marker, and refused to use the very database it owns.
    //
    // A database holding no documents at all is not one anybody can lose, so it
    // is safe to claim. A database holding data the harness did not write is
    // exactly what this guard exists to protect.
    let documents = 0;
    for (const c of collections) {
      documents += await db.collection(c.name).countDocuments();
      if (documents > 0) break;
    }
    if (documents === 0) return;

    throw new Error(
      [
        '',
        `Refusing to use ${describeUri(uri)} as the E2E database.`,
        '',
        `It holds documents across ${collections.length} collections and carries no`,
        `${HARNESS_MARKER_COLLECTION} marker, so it was not created by this harness —`,
        'it looks like a real database.',
        '',
        'The E2E suite drops its database on every run. Continuing here would destroy',
        'data the harness does not own, so it has stopped instead. Nothing was changed.',
        '',
        'Point MONGODB_E2E_URI at a database name reserved for testing.',
        '',
      ].join('\n')
    );
  } finally {
    await probe.close();
  }
}

/**
 * Drop the harness database, ownership proven first.
 *
 * Setup drops before building, so a run that crashed before its teardown cannot
 * poison the next one; teardown drops after, so repeated runs never accumulate.
 * Dropping before `connectDB()` also means the models build their indexes onto
 * a fresh database rather than having them dropped out from under them.
 */
export async function dropE2EDatabase(uri: string): Promise<void> {
  await assertHarnessOwnsDatabase(uri);
  const probe = await openBareConnection(uri);
  try {
    await probe.db?.dropDatabase();
  } finally {
    await probe.close();
  }
}

/**
 * Point the application's connection helper at the harness database and open
 * it. `connectDB` reads `MONGODB_URI`, and so does every model the fixtures and
 * the running app import, so redirecting that one variable moves the whole
 * process onto the harness database. Callers must have dropped/asserted first.
 */
export async function connectToE2EDatabase(): Promise<void> {
  process.env.MONGODB_URI = resolveE2EDatabaseUri();
  await connectDB();
}

/**
 * Stamp the database as harness-owned. Written immediately after the drop, so
 * every later guard — including the next run's — can recognise it.
 */
export async function writeHarnessMarker(runId: string): Promise<void> {
  const db = mongoose.connection.db;
  if (!db) throw new Error('No active connection — connect before writing the harness marker.');
  await db.collection(HARNESS_MARKER_COLLECTION).insertOne({
    runId,
    createdAt: new Date(),
    note: 'Created by the Playwright harness. This database is dropped and rebuilt on every run.',
  });
}
