// Orchestration. Ties the generators into one reproducible run: a single runId
// derives the seed for the deterministic RNG and names the ledger; every
// generator shares that ledger so the entire ecosystem is tracked under one run.
// The relationship graph and narrative clusters are not a separate pass — they
// emerge from the generators, which deliberately cluster cooperatives by county,
// sponsor some via NGOs, tie every student to an institution + peer reviewer +
// lecturer, and route employer views at public portfolios. After generation we
// derive a couple of human-readable "stories" from the world and store them on
// the run so a reset/inspection can see what was built.

import './registry'; // side-effect: register every model the run touches
import { Rng, seedFromString } from './rng';
import { Ledger } from './ledger';
import { generatePeople } from './generators/people';
import { generateCommerce } from './generators/commerce';
import { generateEducation } from './generators/education';
import type { World } from './world';
import { log } from './db';

export interface RunResult {
  runId: string;
  seed: number;
  world: World;
  ledger: Ledger;
}

// Build a fresh, readable runId. seed:rebuild passes a new one each time so the
// ecosystem varies; callers may also pass an explicit runId for reproducibility.
export function newRunId(): string {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  const rand = Math.random().toString(36).slice(2, 8);
  return `sim-${stamp}-${rand}`;
}

// Derive 2-3 discoverable narrative threads from the generated world. These are
// stored as run notes — orientation for whoever inspects the run, not UI data.
function narrativeNotes(world: World): string {
  const lines: string[] = [];
  const sponsoredNgo = world.ngos[0];
  const cluster = world.farmers.find((f) => f.archetype === 'cooperative') ?? world.farmers[0];
  if (cluster) {
    const buyer = world.buyers[0];
    lines.push(
      `Cluster (${cluster.county}): ${cluster.fullName}, a ${cluster.archetype} farmer` +
        (sponsoredNgo ? `, supplies cooperatives that ${sponsoredNgo.name} sponsors` : '') +
        (buyer ? `, with repeat orders from ${buyer.fullName}.` : '.')
    );
  }
  const star = world.students[0];
  const lecturer = world.lecturers[0];
  if (star && lecturer) {
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
  const ctx = { rng, ledger };

  log(`run ${runId} (seed ${seed}) — starting`);
  await ledger.start();

  let world: World;
  try {
    log('generating people, organisations and relationships...');
    world = await generatePeople(ctx);

    log('generating marketplace, escrow and trust...');
    await generateCommerce(ctx, world);

    log('generating education hub, portfolios and reviews...');
    await generateEducation(ctx, world);
  } catch (err) {
    // Persist the partial manifest so the interrupted run can be cleaned, then
    // surface the error.
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
