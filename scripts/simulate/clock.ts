// Timeline helpers. Every entity gets a join date on a 6-9 month curve and all
// activity timestamps fall after the actor joined and stay causally ordered.

import { Rng } from './rng';

const DAY_MS = 24 * 60 * 60 * 1000;

export function daysAgo(days: number): Date {
  return new Date(Date.now() - days * DAY_MS);
}

export function hoursAfter(base: Date, hours: number): Date {
  return new Date(base.getTime() + hours * 60 * 60 * 1000);
}

export function daysAfter(base: Date, days: number): Date {
  return new Date(base.getTime() + days * DAY_MS);
}

// A random instant strictly between two dates.
export function between(rng: Rng, start: Date, end: Date): Date {
  const a = start.getTime();
  const b = Math.max(end.getTime(), a + 1);
  return new Date(a + rng.next() * (b - a));
}

// A believable signup date: weighted toward more recent months (a growing
// platform), spread across the last `maxMonths` months.
export function joinDate(rng: Rng, maxMonths = 9): Date {
  // Buckets (months-ago range, weight). Recent months are heavier.
  const bucket = rng.weighted<[number, number]>([
    [[0, 1], 5],
    [[1, 2], 4],
    [[2, 3], 4],
    [[3, 5], 3],
    [[5, 7], 2],
    [[7, maxMonths], 1],
  ]);
  const minDays = bucket[0] * 30;
  const maxDays = Math.min(bucket[1] * 30, maxMonths * 30);
  return daysAgo(rng.int(minDays, maxDays));
}

export const DAY = DAY_MS;
