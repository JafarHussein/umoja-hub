import { SimulatedOutcome } from '@/types';

// ---------------------------------------------------------------------------
// Simulation configuration.
//
// The goal is operational realism, not "always success". Defaults model a
// healthy-but-imperfect M-Pesa population; every value is overridable via env so
// the chaos profile can be tuned per environment. "Delayed callbacks" are
// modelled by the delay distribution rather than a distinct outcome.
// ---------------------------------------------------------------------------

export interface SimulationConfig {
  /** Relative weights per outcome (need not sum to 100). */
  outcomeWeights: Record<SimulatedOutcome, number>;
  /** Delivery delay buckets in seconds, with relative weights. */
  delayBuckets: { seconds: number; weight: number }[];
  /** Probability (0..1) that a delivered callback is sent twice (duplicate). */
  duplicateRate: number;
}

function num(key: string, fallback: number): number {
  const raw = process.env[key];
  if (raw === undefined) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export function getSimulationConfig(): SimulationConfig {
  return {
    outcomeWeights: {
      [SimulatedOutcome.SUCCESS]: num('SIMULATION_RATE_SUCCESS', 75),
      [SimulatedOutcome.INSUFFICIENT_FUNDS]: num('SIMULATION_RATE_INSUFFICIENT_FUNDS', 10),
      [SimulatedOutcome.USER_CANCELLED]: num('SIMULATION_RATE_USER_CANCELLED', 5),
      [SimulatedOutcome.TIMEOUT]: num('SIMULATION_RATE_TIMEOUT', 5),
      [SimulatedOutcome.NETWORK_FAILURE]: num('SIMULATION_RATE_NETWORK_FAILURE', 3),
      [SimulatedOutcome.LOST]: num('SIMULATION_RATE_LOST', 2),
      // Off by default — forceable from the Payment Lab.
      [SimulatedOutcome.PHONE_UNREACHABLE]: num('SIMULATION_RATE_PHONE_UNREACHABLE', 0),
      [SimulatedOutcome.UNKNOWN_ERROR]: num('SIMULATION_RATE_UNKNOWN_ERROR', 0),
    },
    delayBuckets: [
      { seconds: 0, weight: num('SIMULATION_DELAY_INSTANT', 70) },
      { seconds: 10, weight: num('SIMULATION_DELAY_10S', 12) },
      { seconds: 30, weight: num('SIMULATION_DELAY_30S', 8) },
      { seconds: 60, weight: num('SIMULATION_DELAY_60S', 6) },
      { seconds: 180, weight: num('SIMULATION_DELAY_SEVERAL_MIN', 4) },
    ],
    duplicateRate: Math.min(1, num('SIMULATION_DUPLICATE_RATE', 2) / 100),
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
