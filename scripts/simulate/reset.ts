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
