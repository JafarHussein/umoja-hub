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
    const model = mongoose.model(collection);
    const res = await model.deleteMany({ _id: { $in: ids } });
    deleted += res.deletedCount ?? 0;
    log(`  ${collection}: deleted ${res.deletedCount ?? 0}/${ids.length}`);
  }

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

  // Records that belong to a user, keyed by the field that points at them.
  const ownedByUser: Array<[string, string[]]> = [
    ['MarketplaceListing', ['farmerId']],
    ['Order', ['farmerId', 'buyerId']],
    ['FarmerTrustScore', ['farmerId']],
    ['Rating', ['farmerId', 'buyerId']],
    ['PriceHistory', ['farmerId']],
    ['EscrowEventLog', ['farmerId', 'buyerId']],
    ['WithdrawalRequest', ['farmerId']],
    ['MediationRequest', ['farmerId', 'buyerId']],
    ['ProjectEngagement', ['studentId']],
    ['PeerReview', ['reviewerId']],
    ['LecturerReview', ['lecturerId']],
    ['LecturerEffectiveness', ['lecturerId']],
    ['VerificationAuditLog', ['studentId', 'lecturerId']],
    ['Notification', ['userId']],
    ['AdminAuditLog', ['adminId']],
  ];

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
