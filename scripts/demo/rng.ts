// Deterministic, seedable RNG so a run is reproducible and each rebuild varies by
// a new seed. mulberry32 — small, fast, good enough for data generation.

export class Rng {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  // Next float in [0, 1).
  next(): number {
    this.state |= 0;
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // Integer in [min, max] inclusive.
  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  // Float in [min, max).
  float(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }

  // True with probability p.
  bool(p = 0.5): boolean {
    return this.next() < p;
  }

  // Uniform pick.
  pick<T>(items: readonly T[]): T {
    return items[this.int(0, items.length - 1)] as T;
  }

  // Pick n distinct items (Fisher–Yates on a copy, sliced).
  sample<T>(items: readonly T[], n: number): T[] {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = this.int(0, i);
      [copy[i], copy[j]] = [copy[j] as T, copy[i] as T];
    }
    return copy.slice(0, Math.min(n, copy.length));
  }

  shuffle<T>(items: readonly T[]): T[] {
    return this.sample(items, items.length);
  }

  // Weighted pick: items paired with relative weights.
  weighted<T>(entries: ReadonlyArray<readonly [T, number]>): T {
    const total = entries.reduce((s, [, w]) => s + w, 0);
    let r = this.next() * total;
    for (const [item, w] of entries) {
      r -= w;
      if (r <= 0) return item;
    }
    return entries[entries.length - 1]![0];
  }
}

// A stable numeric seed derived from a runId string.
export function seedFromString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
