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

  // Ids this run created in a given collection. The operations phase reads these
  // to attach payment trails, audit entries and assistant history to exactly the
  // records this run produced, rather than re-querying the whole database and
  // risking picking up someone else's data.
  idsFor(collection: string): mongoose.Types.ObjectId[] {
    return this.entities.filter((e) => e.collection === collection).map((e) => e.id);
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

  // Persist whatever was tracked so far without marking the run complete. Called
  // when a run throws mid-way, so the partial manifest is recorded and a reset
  // can still clean exactly what was created (status stays BUILDING = interrupted).
  async fail(error: string): Promise<void> {
    const { default: SimulationRun } = await import('../../src/lib/models/SimulationRun.model');
    await SimulationRun.findOneAndUpdate(
      { runId: this.runId },
      { $set: { counts: this.counts, entities: this.entities, notes: `interrupted: ${error}`.slice(0, 500) } }
    );
  }

  // Write the full manifest and mark the run active. Optional narrative notes
  // describe the discoverable stories the run produced.
  async finalize(notes?: string): Promise<void> {
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
          ...(notes ? { notes } : {}),
        },
      }
    );
  }
}
