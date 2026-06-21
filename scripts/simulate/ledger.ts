// The run ledger. Wraps the SimulationRun side-collection: every document the
// engine creates is recorded as { collection, id } so a reset deletes exactly
// those documents and never touches genuine data.

import type mongoose from 'mongoose';

interface HasId {
  _id: mongoose.Types.ObjectId;
}

interface TrackedEntity {
  collection: string;
  id: mongoose.Types.ObjectId;
}

export class Ledger {
  readonly runId: string;
  readonly seed: number;
  private entities: TrackedEntity[] = [];
  private counts: Record<string, number> = {};

  constructor(runId: string, seed: number) {
    this.runId = runId;
    this.seed = seed;
  }

  // Record a freshly-created document and return it unchanged (chainable).
  track<T extends HasId>(collection: string, doc: T): T {
    this.entities.push({ collection, id: doc._id });
    this.counts[collection] = (this.counts[collection] ?? 0) + 1;
    return doc;
  }

  trackMany<T extends HasId>(collection: string, docs: T[]): T[] {
    for (const d of docs) this.track(collection, d);
    return docs;
  }

  get total(): number {
    return this.entities.length;
  }

  summary(): Record<string, number> {
    return { ...this.counts };
  }

  // Persist the BUILDING run document up front so an interrupted run is still
  // visible in the ledger.
  async start(): Promise<void> {
    const { default: SimulationRun } = await import('../../src/lib/models/SimulationRun.model');
    const { SimulationRunStatus } = await import('../../src/types');
    await SimulationRun.create({
      runId: this.runId,
      seed: this.seed,
      status: SimulationRunStatus.BUILDING,
      counts: {},
      entities: [],
    });
  }

  // Write the full manifest and mark the run active.
  async finalize(): Promise<void> {
    const { default: SimulationRun } = await import('../../src/lib/models/SimulationRun.model');
    const { SimulationRunStatus } = await import('../../src/types');
    await SimulationRun.findOneAndUpdate(
      { runId: this.runId },
      {
        $set: {
          status: SimulationRunStatus.ACTIVE,
          counts: this.counts,
          entities: this.entities,
          completedAt: new Date(),
        },
      }
    );
  }
}
