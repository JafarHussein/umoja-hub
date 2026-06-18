/**
 * scripts/fetch-illustrations.ts — UmojaHub illustration asset pipeline
 *
 * Run with: npm run illustrations            (process every entry)
 *           npm run illustrations -- farmer  (only entries whose name matches)
 *
 * Operationalizes:
 *   - webapp-reset/ILLUSTRATION_PLAN_AUTH_ONBOARDING_V1.md  (which library, which job)
 *   - webapp-reset/CHARACTER_SET_BRIEF_V1.md                (the four role characters)
 *   - webapp-reset/08_ILLUSTRATION_STRATEGY.md              (every illustration has a job)
 *
 * What it does:
 *   1. CHARACTER / CONCEPT / STATE scenes → resolved from unDraw (search API or a
 *      pinned URL), recoloured from unDraw's accent to the brand green, optimized.
 *   2. Writes public/illustrations/manifest.json so the app can consume assets by
 *      role/job rather than hard-coding file paths.
 *
 * Any entry without a pinned `url`/`query` falls back to a hand-exported SVG dropped
 * at public/illustrations/_raw/<name>.svg (optimized in place); missing → "pending".
 *
 * Performance (Illustration Strategy, Gate 1 low-bandwidth): SVG only, optimized,
 * viewBox preserved so they scale, 2G-safe.
 *
 * No platform logic, no DB, no env validation — pure asset tooling.
 */

import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { optimize } from 'svgo';

// ---------------------------------------------------------------------------
// Paths & constants
// ---------------------------------------------------------------------------

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'public', 'illustrations');
const RAW_DIR = join(OUT_DIR, '_raw');
const MANIFEST_PATH = join(OUT_DIR, 'manifest.json');

/** unDraw's stock accent colour that every illustration is recoloured from. */
const UNDRAW_ACCENT = '#6c63ff';
/** Brand green — kept in sync with UNDRAW_DEFAULT_COLOR in .mcp.json. */
const BRAND_COLOR = process.env.UNDRAW_DEFAULT_COLOR ?? '#2F6F5E';

/** unDraw search: GET ?q=<query> → { results: [{ title, newSlug, media }] }. Query must be ≥3 chars. */
const UNDRAW_SEARCH_API = 'https://undraw.co/api/search';

// ---------------------------------------------------------------------------
// The manifest of illustrations — every one names its JOB (Strategy §"one rule")
// ---------------------------------------------------------------------------

type Category = 'characters' | 'concepts' | 'states';

interface Entry {
  /** Stable key used by the app + as the filename (e.g. char-farmer → char-farmer.svg). */
  name: string;
  category: Category;
  /** One-sentence job. If it can't name a job, it doesn't ship. */
  job: string;
  /** Where the asset comes from (for review + cultural-authenticity audit). */
  source: string;
  /** unDraw search term — used when no pinned `url` is given. */
  query?: string;
  /**
   * A pinned direct SVG URL. Prefer this once resolved (reproducible builds):
   * unDraw CDN, a Storyset export, etc. Overrides `query`.
   */
  url?: string;
  /**
   * Builder-only libraries (Humaaans / Blush) can't be fetched. Drop the hand
   * exported SVG into public/illustrations/_raw/<name>.svg; it gets optimized in.
   */
  manual?: true;
}

const ENTRIES: readonly Entry[] = [
  // --- Role characters (unDraw — recoloured to brand) ---
  {
    name: 'char-farmer',
    category: 'characters',
    job: 'Self-identify as a producer with something to grow & sell.',
    source: 'unDraw "gardening"',
    query: 'gardening',
  },
  {
    name: 'char-buyer',
    category: 'characters',
    job: 'Self-identify as a buyer/trader: considered sourcing, not impulse.',
    source: 'unDraw "trader"',
    query: 'trader',
  },
  {
    name: 'char-student',
    category: 'characters',
    job: 'Self-identify as a CS student building real portfolio work.',
    source: 'unDraw "coding"',
    query: 'coding',
  },
  {
    name: 'char-lecturer',
    category: 'characters',
    job: 'Self-identify as an academic reviewing student work.',
    source: 'unDraw "professor"',
    query: 'professor',
  },

  // --- Concept scenes (unDraw — recoloured to brand) ---
  {
    name: 'concept-community',
    category: 'concepts',
    job: 'ON-01 Welcome: warmth + belonging — "this platform is for people like me."',
    source: 'unDraw "welcoming"',
    query: 'welcoming',
  },
  {
    name: 'concept-language',
    category: 'concepts',
    job: 'ON-03 Language: signal access/region — choose the language that fits you.',
    source: 'unDraw "world"',
    query: 'world',
  },
  {
    name: 'concept-secure-login',
    category: 'concepts',
    job: 'X-01 Sign in: lower the stakes, signal legitimacy & safety — not a cold lock.',
    source: 'unDraw "secure login"',
    query: 'secure login',
  },
  {
    name: 'concept-verification',
    category: 'concepts',
    job: 'ON-03: explain the trust chain visually (ID → check → badge → reputation).',
    source: 'unDraw "verified"',
    query: 'verified',
  },
  {
    name: 'concept-data-security',
    category: 'concepts',
    job: 'ON-09: reduce the #1 farmer anxiety — show that handing over an ID is safe & protected. The single most important illustration in the flow.',
    source: 'unDraw "personal data"',
    query: 'personal data',
  },
  {
    name: 'concept-farming',
    category: 'concepts',
    job: 'ON-08 farmer role setup: guide the farm/produce details task.',
    source: 'unDraw "farm"',
    query: 'farm',
  },

  // --- State scenes (unDraw — empty / error / success still-frame) ---
  {
    name: 'state-empty',
    category: 'states',
    job: 'Shared empty state: soften a dead-end, guide the user to populate it.',
    source: 'unDraw "empty"',
    query: 'empty',
  },
  {
    name: 'state-error',
    category: 'states',
    job: 'Shared error state: recover with clarity and warmth, not a cold failure.',
    source: 'unDraw "warning"',
    query: 'warning',
  },
  {
    name: 'state-success',
    category: 'states',
    job: 'ON-10 done / first-run: success + momentum into the app (Lottie in code; this is the still fallback).',
    source: 'unDraw "completed"',
    query: 'completed',
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface UndrawSearchResponse {
  results?: Array<{ title?: string; newSlug?: string; media?: string }>;
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/** Resolve an unDraw search term to a direct CDN SVG URL (first match). */
async function resolveUndrawUrl(query: string): Promise<string> {
  const res = await fetch(`${UNDRAW_SEARCH_API}?q=${encodeURIComponent(query)}`);
  if (!res.ok) {
    throw new Error(`unDraw search failed for "${query}": HTTP ${res.status}`);
  }
  const data = (await res.json()) as UndrawSearchResponse;
  const media = data.results?.[0]?.media;
  if (!media) {
    throw new Error(`unDraw returned no illustration for "${query}"`);
  }
  return media;
}

async function fetchSvg(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`fetch failed for ${url}: HTTP ${res.status}`);
  }
  return res.text();
}

/** Recolour unDraw's stock accent to the brand, then optimize (viewBox kept). */
function process_(svg: string): string {
  const recoloured = svg.replace(new RegExp(UNDRAW_ACCENT, 'gi'), BRAND_COLOR);
  const { data } = optimize(recoloured, {
    multipass: true,
    plugins: [
      {
        name: 'preset-default',
        params: { overrides: { removeViewBox: false } },
      },
    ],
  });
  return data;
}

// ---------------------------------------------------------------------------
// Per-entry processing
// ---------------------------------------------------------------------------

type Status = 'written' | 'pending' | 'failed';

interface Result {
  name: string;
  category: Category;
  job: string;
  source: string;
  status: Status;
  path?: string;
  note?: string;
}

async function processEntry(entry: Entry): Promise<Result> {
  const relPath = `illustrations/${entry.category}/${entry.name}.svg`;
  const outPath = join(OUT_DIR, entry.category, `${entry.name}.svg`);
  const base = { name: entry.name, category: entry.category, job: entry.job, source: entry.source };

  try {
    let raw: string;

    if (entry.manual) {
      const rawPath = join(RAW_DIR, `${entry.name}.svg`);
      if (!(await fileExists(rawPath))) {
        return {
          ...base,
          status: 'pending',
          note: `Export from builder and drop at public/illustrations/_raw/${entry.name}.svg, then re-run.`,
        };
      }
      raw = await readFile(rawPath, 'utf8');
    } else {
      const url = entry.url ?? (entry.query ? await resolveUndrawUrl(entry.query) : undefined);
      if (!url) {
        return { ...base, status: 'failed', note: 'No url and no query to resolve.' };
      }
      raw = await fetchSvg(url);
      // Surface the resolved URL so it can be pinned into the manifest for reproducible builds.
      if (!entry.url) {
        console.log(`  resolved "${entry.query}" → ${url}`);
      }
    }

    await mkdir(dirname(outPath), { recursive: true });
    await writeFile(outPath, process_(raw), 'utf8');
    return { ...base, status: 'written', path: relPath };
  } catch (err) {
    const note = err instanceof Error ? err.message : String(err);
    return { ...base, status: 'failed', note };
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const filters = process.argv.slice(2).filter((a) => !a.startsWith('-'));
  const selected = filters.length
    ? ENTRIES.filter((e) => filters.some((f) => e.name.includes(f)))
    : ENTRIES;

  if (selected.length === 0) {
    console.error(`No illustrations match: ${filters.join(', ')}`);
    process.exit(1);
  }

  await mkdir(RAW_DIR, { recursive: true });
  console.log(`Processing ${selected.length} illustration(s) → public/illustrations/`);
  console.log(`Brand colour: ${BRAND_COLOR} (recoloured from unDraw accent ${UNDRAW_ACCENT})\n`);

  const results: Result[] = [];
  for (const entry of selected) {
    console.log(`• ${entry.name} (${entry.category})`);
    results.push(await processEntry(entry));
  }

  // Merge into manifest.json (preserve entries not touched by this run).
  let existing: Result[] = [];
  if (await fileExists(MANIFEST_PATH)) {
    try {
      existing = JSON.parse(await readFile(MANIFEST_PATH, 'utf8')) as Result[];
    } catch {
      existing = [];
    }
  }
  const byName = new Map(existing.map((r) => [r.name, r]));
  for (const r of results) {
    byName.set(r.name, r);
  }
  const manifest = [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
  await writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  // Summary
  const written = results.filter((r) => r.status === 'written');
  const pending = results.filter((r) => r.status === 'pending');
  const failed = results.filter((r) => r.status === 'failed');

  console.log(`\n— Summary —`);
  console.log(`  written: ${written.length}`);
  if (pending.length) {
    console.log(`  pending (manual export needed): ${pending.length}`);
    for (const r of pending) {
      console.log(`    ${r.name} — ${r.note}`);
    }
  }
  if (failed.length) {
    console.log(`  failed: ${failed.length}`);
    for (const r of failed) {
      console.log(`    ${r.name} — ${r.note}`);
    }
  }
  console.log(`  manifest: public/illustrations/manifest.json`);

  if (failed.length > 0) {
    process.exit(1);
  }
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.stack : err);
  process.exit(1);
});
