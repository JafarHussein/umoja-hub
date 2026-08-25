import { SimulatedOutcome, SimulationProfile } from '@/types';

// ---------------------------------------------------------------------------
// Simulation configuration — a chosen fixture, not a claim about the world.
//
// This file used to carry one fixed weighting: 75% success, 10% insufficient
// funds, 5% cancelled, and so on. Every one of those numbers was indefensible.
// Asked "why 75%?", there is no honest answer — UmojaHub has never observed a
// real M-Pesa population, Safaricom does not publish one, and inventing a
// figure lends false authority to a number nobody measured. Worse, presenting
// it as a model of M-Pesa invites exactly the question it cannot survive.
//
// Profiles answer a question that CAN be answered: not "how often does M-Pesa
// fail?" but "which workflow do I want to exercise right now?". A profile is
// chosen the way a test fixture is chosen — to drive a specific path through
// the system — and each carries a `purpose` saying which path and why. The
// weights are deliberate stimuli, and nothing in the product reads them as
// statistics.
//
// This is also how payment providers ship their own sandboxes: Stripe and
// Safaricom both hand you specific test instruments that force specific
// outcomes, rather than a random generator claiming to be the real network.
// ---------------------------------------------------------------------------

export interface SimulationConfig {
  profile: SimulationProfile;
  /** What this profile is FOR — the workflow it exists to exercise. */
  purpose: string;
  /** Relative weights per outcome (need not sum to 100). Stimuli, not rates. */
  outcomeWeights: Record<SimulatedOutcome, number>;
  /** Delivery delay buckets in seconds, with relative weights. */
  delayBuckets: { seconds: number; weight: number }[];
  /** Probability (0..1) that a delivered callback is sent twice (duplicate). */
  duplicateRate: number;
}

type ProfileDefinition = Omit<SimulationConfig, 'profile'>;

/** Zero every outcome, so each profile states only what it deliberately raises. */
function noOutcomes(): Record<SimulatedOutcome, number> {
  return {
    [SimulatedOutcome.SUCCESS]: 0,
    [SimulatedOutcome.INSUFFICIENT_FUNDS]: 0,
    [SimulatedOutcome.USER_CANCELLED]: 0,
    [SimulatedOutcome.TIMEOUT]: 0,
    [SimulatedOutcome.NETWORK_FAILURE]: 0,
    [SimulatedOutcome.LOST]: 0,
    [SimulatedOutcome.PHONE_UNREACHABLE]: 0,
    [SimulatedOutcome.UNKNOWN_ERROR]: 0,
  };
}

const INSTANT_DELAYS = [{ seconds: 0, weight: 100 }];

export const SIMULATION_PROFILES: Record<SimulationProfile, ProfileDefinition> = {
  [SimulationProfile.HAPPY_PATH]: {
    purpose:
      'Every payment succeeds immediately. For walking the order → escrow → confirmation → release path end to end without interruption. This is the default: the only caller is a live payment somebody is waiting on, and a random failure there teaches nothing that choosing PAYMENT_FAILURE would not teach on purpose.',
    outcomeWeights: { ...noOutcomes(), [SimulatedOutcome.SUCCESS]: 100 },
    delayBuckets: INSTANT_DELAYS,
    duplicateRate: 0,
  },

  [SimulationProfile.TYPICAL]: {
    purpose:
      'A mixed run in which every failure mode appears at least sometimes, for exercising the whole surface without choosing what to hit. The weights are chosen for coverage, not to assert how often M-Pesa fails. It does NOT populate the demo world — the seeder writes that mix itself and never reads this file — so do not select it expecting seeded variety, and do not leave it selected while somebody is watching a payment.',
    outcomeWeights: {
      ...noOutcomes(),
      [SimulatedOutcome.SUCCESS]: 70,
      [SimulatedOutcome.INSUFFICIENT_FUNDS]: 10,
      [SimulatedOutcome.USER_CANCELLED]: 8,
      [SimulatedOutcome.TIMEOUT]: 5,
      [SimulatedOutcome.NETWORK_FAILURE]: 4,
      [SimulatedOutcome.LOST]: 3,
    },
    delayBuckets: [
      { seconds: 0, weight: 70 },
      { seconds: 10, weight: 12 },
      { seconds: 30, weight: 8 },
      { seconds: 60, weight: 6 },
      { seconds: 180, weight: 4 },
    ],
    duplicateRate: 0.02,
  },

  [SimulationProfile.NETWORK_TROUBLE]: {
    purpose:
      'Callbacks arrive late, twice, or never. Exercises the STK query leg, duplicate suppression and the recovery of a payment whose callback was lost after a real debit.',
    outcomeWeights: {
      ...noOutcomes(),
      [SimulatedOutcome.SUCCESS]: 50,
      [SimulatedOutcome.LOST]: 30,
      [SimulatedOutcome.TIMEOUT]: 12,
      [SimulatedOutcome.NETWORK_FAILURE]: 8,
    },
    delayBuckets: [
      { seconds: 0, weight: 10 },
      { seconds: 30, weight: 25 },
      { seconds: 60, weight: 35 },
      { seconds: 180, weight: 30 },
    ],
    duplicateRate: 0.25,
  },

  [SimulationProfile.PAYMENT_FAILURE]: {
    purpose:
      'The buyer’s payment does not go through. Exercises retry, inventory restoration, and whether the failure is explained in terms the buyer can act on.',
    outcomeWeights: {
      ...noOutcomes(),
      [SimulatedOutcome.INSUFFICIENT_FUNDS]: 40,
      [SimulatedOutcome.USER_CANCELLED]: 30,
      [SimulatedOutcome.PHONE_UNREACHABLE]: 20,
      [SimulatedOutcome.UNKNOWN_ERROR]: 10,
    },
    delayBuckets: INSTANT_DELAYS,
    duplicateRate: 0,
  },

  [SimulationProfile.RECONCILIATION_DRILL]: {
    purpose:
      'No callback ever arrives, so every order must be resolved by asking the provider. Exercises the sweep, the UNRESOLVED state and the administrator queue behind it.',
    outcomeWeights: { ...noOutcomes(), [SimulatedOutcome.LOST]: 100 },
    delayBuckets: INSTANT_DELAYS,
    duplicateRate: 0,
  },
};

function num(key: string, fallback: number): number {
  const raw = process.env[key];
  if (raw === undefined) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

/**
 * The active profile. Unknown or unset falls back to HAPPY_PATH rather than
 * failing.
 *
 * The default used to be TYPICAL, on the stated grounds that it populates a
 * demo environment which does not look implausibly perfect. It does not do
 * that, and it never did: the only things that read this configuration are the
 * live payment path (`simulationProvider`) and the admin Payment Lab, which
 * merely displays it. The demo world's mix of successes, failures, refunds and
 * disputes is written by the seeder, which sets its outcomes inline and has
 * never consulted this function.
 *
 * So the default governed exactly one audience — a person making a payment,
 * right now, and watching — and for that audience it failed roughly three
 * attempts in ten and delayed some of the rest by up to 180 seconds. During the
 * 2026-08-24 readiness audit two consecutive live payments failed before anyone
 * thought to look for a variable that appeared in no documentation.
 *
 * Nothing about the failure modes is lost. Every profile remains selectable by
 * name, and the Payment Lab forces a specific outcome deterministically, which
 * is how a failure path should be demonstrated or tested anyway — the same way
 * Stripe and Safaricom hand you instruments that force an outcome instead of a
 * random generator claiming to be the network.
 */
export function getActiveProfile(): SimulationProfile {
  const raw = process.env['SIMULATION_PROFILE'];
  if (raw && raw in SIMULATION_PROFILES) return raw as SimulationProfile;
  return SimulationProfile.HAPPY_PATH;
}

export function getSimulationConfig(): SimulationConfig {
  const profile = getActiveProfile();
  const base = SIMULATION_PROFILES[profile];

  // Per-outcome env overrides still win, so a specific scenario can be dialled
  // in without adding a profile for it. Named profiles are the documented
  // route; these remain for one-off tuning.
  return {
    profile,
    purpose: base.purpose,
    outcomeWeights: {
      [SimulatedOutcome.SUCCESS]: num(
        'SIMULATION_RATE_SUCCESS',
        base.outcomeWeights[SimulatedOutcome.SUCCESS]
      ),
      [SimulatedOutcome.INSUFFICIENT_FUNDS]: num(
        'SIMULATION_RATE_INSUFFICIENT_FUNDS',
        base.outcomeWeights[SimulatedOutcome.INSUFFICIENT_FUNDS]
      ),
      [SimulatedOutcome.USER_CANCELLED]: num(
        'SIMULATION_RATE_USER_CANCELLED',
        base.outcomeWeights[SimulatedOutcome.USER_CANCELLED]
      ),
      [SimulatedOutcome.TIMEOUT]: num(
        'SIMULATION_RATE_TIMEOUT',
        base.outcomeWeights[SimulatedOutcome.TIMEOUT]
      ),
      [SimulatedOutcome.NETWORK_FAILURE]: num(
        'SIMULATION_RATE_NETWORK_FAILURE',
        base.outcomeWeights[SimulatedOutcome.NETWORK_FAILURE]
      ),
      [SimulatedOutcome.LOST]: num(
        'SIMULATION_RATE_LOST',
        base.outcomeWeights[SimulatedOutcome.LOST]
      ),
      [SimulatedOutcome.PHONE_UNREACHABLE]: num(
        'SIMULATION_RATE_PHONE_UNREACHABLE',
        base.outcomeWeights[SimulatedOutcome.PHONE_UNREACHABLE]
      ),
      [SimulatedOutcome.UNKNOWN_ERROR]: num(
        'SIMULATION_RATE_UNKNOWN_ERROR',
        base.outcomeWeights[SimulatedOutcome.UNKNOWN_ERROR]
      ),
    },
    delayBuckets: base.delayBuckets,
    duplicateRate: Math.min(1, num('SIMULATION_DUPLICATE_RATE', base.duplicateRate * 100) / 100),
  };
}

/** Weighted pick over [value, weight] pairs. `rng` is injectable for tests. */
export function pickWeighted<T>(
  entries: { value: T; weight: number }[],
  rng: () => number = Math.random
): T {
  const total = entries.reduce((sum, e) => sum + Math.max(0, e.weight), 0);
  if (total <= 0) return entries[0]!.value;
  let r = rng() * total;
  for (const entry of entries) {
    r -= Math.max(0, entry.weight);
    if (r < 0) return entry.value;
  }
  return entries[entries.length - 1]!.value;
}

export function pickOutcome(
  config: SimulationConfig,
  rng: () => number = Math.random
): SimulatedOutcome {
  const entries = (Object.entries(config.outcomeWeights) as [SimulatedOutcome, number][]).map(
    ([value, weight]) => ({ value, weight })
  );
  return pickWeighted(entries, rng);
}

export function pickDelaySeconds(
  config: SimulationConfig,
  rng: () => number = Math.random
): number {
  return pickWeighted(
    config.delayBuckets.map((b) => ({ value: b.seconds, weight: b.weight })),
    rng
  );
}
