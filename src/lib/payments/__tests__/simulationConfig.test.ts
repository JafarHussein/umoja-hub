import {
  getSimulationConfig,
  pickWeighted,
  pickOutcome,
  pickDelaySeconds,
  SIMULATION_PROFILES,
} from '../simulationConfig';
import { SimulatedOutcome, SimulationProfile } from '@/types';

describe('pickWeighted', () => {
  it('selects deterministically from the cumulative distribution', () => {
    const entries = [
      { value: 'a', weight: 1 },
      { value: 'b', weight: 1 },
      { value: 'c', weight: 2 },
    ];
    // total = 4. rng*4 → 0.0→a, 1.5→b, 2.5→c, 3.9→c
    expect(pickWeighted(entries, () => 0)).toBe('a');
    expect(pickWeighted(entries, () => 0.3)).toBe('b'); // 1.2
    expect(pickWeighted(entries, () => 0.6)).toBe('c'); // 2.4
    expect(pickWeighted(entries, () => 0.99)).toBe('c');
  });

  it('falls back to the first value when all weights are zero', () => {
    const entries = [
      { value: 'x', weight: 0 },
      { value: 'y', weight: 0 },
    ];
    expect(pickWeighted(entries, () => 0.5)).toBe('x');
  });
});

describe('getSimulationConfig', () => {
  const saved = { ...process.env };
  afterEach(() => {
    process.env = { ...saved };
  });

  it('defaults to HAPPY_PATH, so an unconfigured live payment succeeds', () => {
    delete process.env['SIMULATION_PROFILE'];
    const config = getSimulationConfig();
    expect(config.profile).toBe(SimulationProfile.HAPPY_PATH);

    // The point of the default. The only caller of this configuration is a live
    // payment somebody is waiting on; the seeded demo world's failure mix is
    // written by the seeder, which never reads this file. An unconfigured
    // environment must therefore not fail a payment at random — it did, for
    // roughly three attempts in ten, and no documentation named the variable
    // that controlled it.
    expect(config.outcomeWeights[SimulatedOutcome.SUCCESS]).toBeGreaterThan(0);
    for (const outcome of [
      SimulatedOutcome.INSUFFICIENT_FUNDS,
      SimulatedOutcome.USER_CANCELLED,
      SimulatedOutcome.TIMEOUT,
      SimulatedOutcome.NETWORK_FAILURE,
      SimulatedOutcome.LOST,
    ]) {
      expect(config.outcomeWeights[outcome]).toBe(0);
    }
    // And it settles at once — a payment that succeeds in three minutes is its
    // own kind of failure in front of an audience.
    expect(config.delayBuckets).toEqual([{ seconds: 0, weight: 100 }]);
    expect(config.duplicateRate).toBe(0);
  });

  it('still reaches every failure mode when TYPICAL is chosen deliberately', () => {
    process.env['SIMULATION_PROFILE'] = SimulationProfile.TYPICAL;
    const config = getSimulationConfig();
    expect(config.profile).toBe(SimulationProfile.TYPICAL);
    // Coverage is the point of this profile, and changing the default must not
    // quietly cost it.
    for (const outcome of [
      SimulatedOutcome.SUCCESS,
      SimulatedOutcome.INSUFFICIENT_FUNDS,
      SimulatedOutcome.USER_CANCELLED,
      SimulatedOutcome.TIMEOUT,
      SimulatedOutcome.NETWORK_FAILURE,
      SimulatedOutcome.LOST,
    ]) {
      expect(config.outcomeWeights[outcome]).toBeGreaterThan(0);
    }
  });

  it('selects a named profile from the environment', () => {
    process.env['SIMULATION_PROFILE'] = SimulationProfile.HAPPY_PATH;
    const config = getSimulationConfig();
    expect(config.profile).toBe(SimulationProfile.HAPPY_PATH);
    expect(config.outcomeWeights[SimulatedOutcome.SUCCESS]).toBeGreaterThan(0);
    expect(config.outcomeWeights[SimulatedOutcome.LOST]).toBe(0);
  });

  it('falls back to the default rather than failing on an unknown profile', () => {
    // A mistyped profile must not take the payment path down.
    process.env['SIMULATION_PROFILE'] = 'CHAOS_MONKEY';
    expect(getSimulationConfig().profile).toBe(SimulationProfile.HAPPY_PATH);
  });

  it('drives the reconciliation drill entirely through lost callbacks', () => {
    process.env['SIMULATION_PROFILE'] = SimulationProfile.RECONCILIATION_DRILL;
    const config = getSimulationConfig();
    expect(config.outcomeWeights[SimulatedOutcome.LOST]).toBeGreaterThan(0);
    expect(config.outcomeWeights[SimulatedOutcome.SUCCESS]).toBe(0);
  });

  it('never lets a payment succeed under the payment-failure profile', () => {
    process.env['SIMULATION_PROFILE'] = SimulationProfile.PAYMENT_FAILURE;
    expect(getSimulationConfig().outcomeWeights[SimulatedOutcome.SUCCESS]).toBe(0);
  });

  it('carries a stated purpose, so no weight is presented without a reason', () => {
    // The whole point of profiles: a number in this file must be answerable
    // with "to exercise X", never with a claim about how often M-Pesa fails.
    for (const profile of Object.values(SimulationProfile)) {
      process.env['SIMULATION_PROFILE'] = profile;
      expect(getSimulationConfig().purpose.length).toBeGreaterThan(20);
    }
  });

  it('honours environment overrides', () => {
    process.env['SIMULATION_RATE_SUCCESS'] = '50';
    process.env['SIMULATION_DUPLICATE_RATE'] = '10';
    const config = getSimulationConfig();
    expect(config.outcomeWeights[SimulatedOutcome.SUCCESS]).toBe(50);
    expect(config.duplicateRate).toBeCloseTo(0.1);
  });

  it('ignores invalid override values, keeping the profile value', () => {
    process.env['SIMULATION_PROFILE'] = SimulationProfile.TYPICAL;
    process.env['SIMULATION_RATE_SUCCESS'] = 'not-a-number';
    const typical = SIMULATION_PROFILES[SimulationProfile.TYPICAL];
    expect(getSimulationConfig().outcomeWeights[SimulatedOutcome.SUCCESS]).toBe(
      typical.outcomeWeights[SimulatedOutcome.SUCCESS]
    );
  });
});

describe('pickOutcome / pickDelaySeconds', () => {
  it('always returns success when only success is weighted', () => {
    const config = getSimulationConfig();
    for (const key of Object.keys(config.outcomeWeights) as SimulatedOutcome[]) {
      config.outcomeWeights[key] = key === SimulatedOutcome.SUCCESS ? 1 : 0;
    }
    expect(pickOutcome(config, () => Math.random())).toBe(SimulatedOutcome.SUCCESS);
  });

  it('returns a delay drawn from the configured buckets', () => {
    const config = getSimulationConfig();
    const delay = pickDelaySeconds(config, () => 0);
    expect(config.delayBuckets.map((b) => b.seconds)).toContain(delay);
  });
});
