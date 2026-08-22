// Reset. Deletes exactly the documents a run created — the { collection, id }
// pairs recorded in its ledger — grouped per collection into one scoped delete
// each, then removes the run record itself. It NEVER drops a collection and
// never issues an unscoped delete, so any untracked document (every genuine
// user's data, which is never recorded in a run) is physically unreachable here.

import mongoose from 'mongoose';
import './registry'; // side-effect: register every model so mongoose.model() resolves
import { log } from './db';

export interface ResetResult {
  runId: string;
  deleted: number;
}

// Records that belong to a user, keyed by the field that points at them. Shared
// by the retired-seed sweep and the orphan sweep below.
const OWNED_BY_USER: Array<[string, string[]]> = [
  ['MarketplaceListing', ['farmerId']],
  ['Order', ['farmerId', 'buyerId']],
  ['FarmerTrustScore', ['farmerId']],
  ['Rating', ['farmerId', 'buyerId']],
  ['PriceHistory', ['farmerId']],
  ['EscrowEventLog', ['farmerId', 'buyerId']],
  ['WithdrawalRequest', ['farmerId']],
  ['MediationRequest', ['farmerId', 'buyerId']],
  ['ProjectEngagement', ['studentId']],
  ['ProjectAssignment', ['lecturerId']],
  ['ProjectDocumentation', ['studentId']],
  ['Demonstration', ['studentId', 'lecturerId']],
  ['DemonstrationSlot', ['lecturerId']],
  ['StudentEnrolment', ['studentId']],
  ['PeerReview', ['reviewerId']],
  ['LecturerReview', ['lecturerId']],
  ['LecturerEffectiveness', ['lecturerId']],
  ['Notification', ['userId']],
  ['AdminAuditLog', ['adminId']],
];

// Reset a specific run, or the most recent run when no id is given.
export async function resetRun(runId?: string): Promise<ResetResult | null> {
  const { default: SimulationRun } = await import('../../src/lib/models/SimulationRun.model');
  const run = runId
    ? await SimulationRun.findOne({ runId }).lean()
    : await SimulationRun.findOne().sort({ createdAt: -1 }).lean();

  if (!run) {
    log(runId ? `no simulation run "${runId}" found.` : 'no simulation run found to reset.');
    return null;
  }

  // Group tracked ids per collection so each collection gets one scoped delete.
  const byCollection = new Map<string, mongoose.Types.ObjectId[]>();
  for (const entity of run.entities) {
    const list = byCollection.get(entity.collection) ?? [];
    list.push(entity.id);
    byCollection.set(entity.collection, list);
  }

  let deleted = 0;
  for (const [collection, ids] of byCollection) {
    // A ledger can outlive the model that wrote it.
    //
    // `mongoose.model(name)` THROWS for an unregistered model, and this loop ran
    // it mid-delete. A run recorded against a model that was later retired —
    // `NgoOrganization`, from an ecosystem-simulation branch that was never
    // merged — therefore killed the reset partway through: users, institutions,
    // suppliers and articles were already deleted, the crash landed before the
    // rest, and `npm run demo` then failed identically on every subsequent run
    // because the same ledger row was still there.
    //
    // The result was a database with 8 users but 49 listings and 223 orders
    // pointing at people who no longer existed, and no documented way back.
    // A retired model must be skippable: the documents are unreachable by this
    // script anyway, and stranding the whole seed over one stale name is far
    // worse than leaving a few rows behind.
    if (!mongoose.modelNames().includes(collection)) {
      log(`  ${collection}: SKIPPED — no such model is registered any more (${ids.length} ids left in place)`);
      continue;
    }
    const model = mongoose.model(collection);
    const res = await model.deleteMany({ _id: { $in: ids } });
    deleted += res.deletedCount ?? 0;
    log(`  ${collection}: deleted ${res.deletedCount ?? 0}/${ids.length}`);
  }

  // The stored report files are not documents in this database, so no ledger
  // row covers them. Without this the demo's PDFs accumulate in the storage
  // account on every run — the same class of leftover as the orphaned records
  // below, one layer out.
  const { purgeDemoReports } = await import('./documents');
  const purged = await purgeDemoReports();
  if (purged > 0) log(`  removed ${purged} stored report file(s).`);

  await SimulationRun.deleteOne({ runId: run.runId });
  log(`reset run ${run.runId} — removed ${deleted} documents + the run record.`);
  return { runId: run.runId, deleted };
}

// Sweep away data left behind by the retired scripts/seed.ts.
//
// That script wrote directly, with no ledger, so nothing it created can be
// removed through a run manifest — and it used the same canonical demo emails
// this generator now owns, so its leftovers would collide on the unique email
// index and abort the build.
//
// The sweep is narrow and fingerprint-based: it finds the users holding the
// canonical demo emails, removes the records that hang off them, and drops the
// authored reference singletons the demo owns outright. It still never drops a
// collection and never issues an unscoped delete on user data. In a database
// that has never seen the old seed script this is a no-op.
export async function clearRetiredSeedData(): Promise<number> {
  const mongooseLib = mongoose;
  const { DEMO_ACCOUNTS } = await import('./content/accounts');
  const User = mongooseLib.model('User');

  const emails = DEMO_ACCOUNTS.map((a) => a.email);
  const stale = await User.find({ email: { $in: emails } })
    .select('_id')
    .lean<Array<{ _id: mongoose.Types.ObjectId }>>();

  // The reference content the demo owns in full. These have no per-user owner,
  // so they are matched by collection rather than by id.
  const ownedCollections = ['KnowledgeArticle', 'BriefContextLibrary', 'VerifiedSupplier'];

  if (stale.length === 0) {
    const anyOwned = await Promise.all(
      ownedCollections.map((c) => mongooseLib.model(c).countDocuments({}))
    );
    if (anyOwned.every((n) => n === 0)) return 0;
  }

  log('clearing leftovers from the retired seed script...');
  const staleIds = stale.map((u) => u._id);
  let deleted = 0;

  const ownedByUser = OWNED_BY_USER;

  if (staleIds.length > 0) {
    for (const [collection, fields] of ownedByUser) {
      const model = mongooseLib.model(collection);
      const res = await model.deleteMany({
        $or: fields.map((f) => ({ [f]: { $in: staleIds } })),
      });
      deleted += res.deletedCount ?? 0;
    }
    const userRes = await User.deleteMany({ _id: { $in: staleIds } });
    deleted += userRes.deletedCount ?? 0;
  }

  for (const collection of ownedCollections) {
    const res = await mongooseLib.model(collection).deleteMany({});
    deleted += res.deletedCount ?? 0;
  }

  log(`  removed ${deleted} legacy document(s).`);
  return deleted;
}

// Remove records whose owner no longer exists.
//
// A reset removes exactly what its ledger tracked, which is the right rule and
// leaves one gap: anything created through the running application during a
// demonstration was never in a ledger. Place an order in front of a panel, then
// rebuild the world, and that order stays behind pointing at a buyer and a
// farmer who have both been replaced — which is precisely how the mediation
// queue came to show "Farmer: Unknown farmer".
//
// The sweep is safe by construction rather than by fingerprint: a record is
// removed only when the user it belongs to cannot be found, and a genuine
// user's records always have their user. It runs as part of the demo build, so
// the world a presenter gets is never one with wreckage in it.
export async function clearOrphanedRecords(): Promise<number> {
  const User = mongoose.model('User');
  const liveIds = await User.find({})
    .select('_id')
    .lean<Array<{ _id: mongoose.Types.ObjectId }>>();
  const ids = liveIds.map((u) => u._id);

  let deleted = 0;
  for (const [collection, fields] of OWNED_BY_USER) {
    const model = mongoose.model(collection);
    const res = await model.deleteMany({
      $or: fields.map((f) => ({ [f]: { $exists: true, $nin: ids } })),
    });
    const n = res.deletedCount ?? 0;
    if (n > 0) log(`  ${collection}: removed ${n} record(s) whose owner no longer exists`);
    deleted += n;
  }

  if (deleted > 0) log(`cleared ${deleted} orphaned record(s).`);
  return deleted;
}

// Reset every recorded run, oldest first. This is what the one-command demo
// build does before generating: a presenter who has run it three times should
// still get exactly one world, not three overlapping ones. It remains scoped —
// each run is removed through its own manifest, so a database that also holds
// genuine data keeps it.
export async function resetAllRuns(): Promise<number> {
  const { default: SimulationRun } = await import('../../src/lib/models/SimulationRun.model');
  const runs = await SimulationRun.find().sort({ createdAt: 1 }).select('runId').lean();
  if (runs.length === 0) {
    log('no previous demo run to clear.');
    return 0;
  }
  log(`clearing ${runs.length} previous run(s)...`);
  let total = 0;
  for (const r of runs) {
    const result = await resetRun(r.runId);
    total += result?.deleted ?? 0;
  }
  return total;
}

// ---------------------------------------------------------------------------
// Sign-up and sign-in throttles.
//
// These live in Upstash, not Mongo, so `resetAllRuns` above cannot see them —
// and they outlive the world by design: the registration cap is a one-hour
// window keyed on the caller's address, and every request from a demo machine
// presents as the same address. Rehearsing the signup a dozen times therefore
// leaves a counter that is still spent when the interview starts, and a fresh
// world with a locked signup form is not a fresh world.
//
// Deliberately narrow. Only the two prefixes the auth throttles own are
// touched, matched key by key rather than flushed, so nothing else in the cache
// — and nothing belonging to any other deployment sharing the instance — is at
// risk. A missing or unreachable Redis is not an error here: the throttles fall
// back to per-process memory, which a restart clears anyway.
const THROTTLE_PREFIXES = ['register-ip:', 'login:', 'pwreset-ip:', 'pwreset-email:'];

export async function clearAuthThrottles(): Promise<number> {
  const { createRedisClient } = await import('../../src/lib/redisClient');
  const redis = createRedisClient('demo-reset');
  if (!redis) return 0;

  let cleared = 0;
  try {
    for (const prefix of THROTTLE_PREFIXES) {
      const keys = await redis.keys(`${prefix}*`);
      if (keys.length === 0) continue;
      await redis.del(...keys);
      cleared += keys.length;
    }
  } catch (err) {
    // A throttle that survives is an inconvenience, not a broken world. Say so
    // and carry on rather than failing the build over the cache.
    log(`could not clear auth throttles (${String(err)}) — registering may be rate-limited.`);
    return cleared;
  }

  if (cleared > 0) log(`cleared ${cleared} auth throttle counter(s) — signup is open again.`);
  return cleared;
}

// Remove the accounts the demonstration creates through the application itself.
//
// Scoped to the explicit `REHEARSAL_ACCOUNTS` address list — never a pattern,
// never "recently created", never "has no run". Those broader rules would all
// eventually match a real person's account, and this is the only path in the
// reset that can delete a user who signed up for themselves. Anything they
// created is removed first, through the same owner map the other sweeps use, so
// no orphan is left behind.
export async function clearRehearsalAccounts(): Promise<number> {
  const { REHEARSAL_ACCOUNTS } = await import('./content/accounts');
  const User = mongoose.model('User');

  const emails = REHEARSAL_ACCOUNTS.map((a) => a.email);
  if (emails.length === 0) return 0;

  const found = await User.find({ email: { $in: emails } })
    .select('_id email')
    .lean<Array<{ _id: mongoose.Types.ObjectId; email: string }>>();
  if (found.length === 0) return 0;

  const ids = found.map((u) => u._id);
  let deleted = 0;
  for (const [collection, fields] of OWNED_BY_USER) {
    const res = await mongoose.model(collection).deleteMany({
      $or: fields.map((f) => ({ [f]: { $in: ids } })),
    });
    deleted += res.deletedCount ?? 0;
  }
  const userRes = await User.deleteMany({ _id: { $in: ids } });
  deleted += userRes.deletedCount ?? 0;

  log(
    `freed ${found.length} rehearsal account(s) so the live signup works again: ${found
      .map((u) => u.email)
      .join(', ')}`
  );
  return deleted;
}
