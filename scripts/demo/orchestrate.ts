// Orchestration. Ties the phases into one reproducible run: a single runId
// derives the seed for the deterministic RNG and names the ledger; every phase
// shares that ledger so the entire world is tracked under one run and can be
// removed again without touching anything else.
//
// Phase order is causal, not arbitrary:
//   foundation → the pinned demo accounts and authored content everything hangs off
//   people     → the generated population around them
//   commerce   → listings, orders, escrow, trust (derived with the real calculator)
//   education  → engagements, reviews, portfolios
//   operations → the payment trail, audit history and assistant history that the
//                first four phases imply but do not themselves write
//
// The relationship graph is not a separate pass — it emerges from the phases,
// which deliberately cluster cooperatives by county, sponsor some via NGOs, tie
// every student to an institution + peer reviewer + lecturer, and route employer
// views at public portfolios. After generation we derive a couple of
// human-readable "stories" and store them on the run.

import './registry'; // side-effect: register every model the run touches
import { Rng, seedFromString } from './rng';
import { Ledger } from './ledger';
import { Batcher } from './helpers';
import { generateFoundation } from './phases/foundation';
import { generatePeople } from './phases/people';
import { generateCommerce } from './phases/commerce';
import { generateEducation } from './phases/education';
import { generateOperations } from './phases/operations';
import type { World } from './world';
import { log } from './db';

export interface RunResult {
  runId: string;
  seed: number;
  world: World;
  ledger: Ledger;
}

// Build a fresh, readable runId.
export function newRunId(): string {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  const rand = Math.random().toString(36).slice(2, 8);
  return `demo-${stamp}-${rand}`;
}

// Derive 2-3 discoverable narrative threads from the generated world. These are
// stored as run notes — orientation for whoever inspects the run, not UI data.
function narrativeNotes(world: World): string {
  const lines: string[] = [];
  const cluster = world.farmers.find((f) => f.archetype === 'cooperative') ?? world.farmers[0];
  if (cluster) {
    const buyer = world.buyers[0];
    lines.push(
      `Cluster (${cluster.county}): ${cluster.fullName}, a ${cluster.archetype} farmer` +
        (buyer ? `, with repeat orders from ${buyer.fullName}.` : '.')
    );
  }
  const lecturer = world.lecturers[0];
  if (world.students[0] && lecturer) {
    lines.push(
      `Education thread: students at ${world.institutions[0]?.name ?? 'a partner university'} ` +
        `move work through peer review and ${lecturer.fullName}'s verification into public portfolios employers browse.`
    );
  }
  return lines.join(' ');
}

// Run the full generation pipeline under one ledger. The DB must already be
// connected (the command entry handles bootstrap/shutdown). Analytics crons run
// afterwards in the command layer, once all records exist.
export async function runSimulation(runId: string = newRunId()): Promise<RunResult> {
  const seed = seedFromString(runId);
  const rng = new Rng(seed);
  const ledger = new Ledger(runId, seed);
  const batcher = new Batcher(ledger);
  const ctx = { rng, ledger, batcher };

  log(`run ${runId} (seed ${seed}) — starting`);
  await ledger.start();

  // Each phase flushes on the way out, so the next one can read everything the
  // previous one wrote. Within a phase, anything that reads back what it just
  // queued flushes for itself.
  let world: World;
  try {
    log('foundation: demo accounts, institutions and reference content...');
    const foundation = await generateFoundation(ctx);
    world = foundation.world;
    await batcher.flush();

    log('people: the surrounding population, organisations and relationships...');
    await generatePeople(ctx, world);
    await batcher.flush();

    log('commerce: marketplace, escrow and trust...');
    await generateCommerce(ctx, world);
    await batcher.flush();

    log('education: engagements, reviews and portfolios...');
    await generateEducation(ctx, world);
    await batcher.flush();

    log('operations: payment trail, audit history, assistant history...');
    await generateOperations(ctx, world);
    await batcher.flush();
  } catch (err) {
    // Flush what is queued before recording the failure: those documents are
    // already in the manifest, so leaving them unwritten would make a reset
    // chase ids that do not exist.
    await batcher.flush().catch(() => undefined);
    await ledger.fail(err instanceof Error ? err.message : String(err));
    log(`run ${runId} interrupted after ${ledger.total} documents — manifest saved for reset.`);
    throw err;
  }

  await ledger.finalize(narrativeNotes(world));

  const summary = ledger.summary();
  log(`run ${runId} complete — ${ledger.total} documents:`);
  for (const [collection, count] of Object.entries(summary).sort()) {
    log(`  ${collection}: ${count}`);
  }

  return { runId, seed, world, ledger };
}
