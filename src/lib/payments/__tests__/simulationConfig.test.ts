import {
  getSimulationConfig,
  pickWeighted,
  pickOutcome,
  pickDelaySeconds,
} from '../simulationConfig';
import { SimulatedOutcome } from '@/types';

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

  it('returns the documented defaults', () => {
    delete process.env['SIMULATION_RATE_SUCCESS'];
    const config = getSimulationConfig();
    expect(config.outcomeWeights[SimulatedOutcome.SUCCESS]).toBe(75);
    expect(config.outcomeWeights[SimulatedOutcome.LOST]).toBe(2);
    expect(config.delayBuckets.find((b) => b.seconds === 0)?.weight).toBe(70);
    expect(config.duplicateRate).toBeCloseTo(0.02);
  });

  it('honours environment overrides', () => {
    process.env['SIMULATION_RATE_SUCCESS'] = '50';
    process.env['SIMULATION_DUPLICATE_RATE'] = '10';
    const config = getSimulationConfig();
    expect(config.outcomeWeights[SimulatedOutcome.SUCCESS]).toBe(50);
    expect(config.duplicateRate).toBeCloseTo(0.1);
  });

  it('ignores invalid override values, keeping the default', () => {
    process.env['SIMULATION_RATE_SUCCESS'] = 'not-a-number';
    expect(getSimulationConfig().outcomeWeights[SimulatedOutcome.SUCCESS]).toBe(75);
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
