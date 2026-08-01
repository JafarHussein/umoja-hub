/**
 * @jest-environment node
 */

import { KENYAN_COUNTIES } from '../counties';
import { COUNTY_ADJACENCY, areAdjacent, neighboursOf } from '../adjacency';

// The adjacency table is hand-assembled (06 §2), so the structural properties
// geography guarantees are asserted rather than trusted. A typo in a 47-entry
// hand-written graph is invisible by inspection and would quietly widen or
// narrow the evidence base for one county's price recommendation.

describe('adjacency — structural properties', () => {
  it('covers all 47 counties and invents none', () => {
    const keys = Object.keys(COUNTY_ADJACENCY);
    expect(keys).toHaveLength(KENYAN_COUNTIES.length);
    for (const county of KENYAN_COUNTIES) {
      expect(COUNTY_ADJACENCY).toHaveProperty([county]);
    }
  });

  it('is symmetric — if A neighbours B then B neighbours A', () => {
    const asymmetric: string[] = [];
    for (const [county, neighbours] of Object.entries(COUNTY_ADJACENCY)) {
      for (const neighbour of neighbours) {
        if (!COUNTY_ADJACENCY[neighbour].includes(county as (typeof KENYAN_COUNTIES)[number])) {
          asymmetric.push(`${county} lists ${neighbour}, but not the reverse`);
        }
      }
    }
    expect(asymmetric).toEqual([]);
  });

  it('never lists a county as its own neighbour', () => {
    // ADJACENT is the tier the engine reaches for *after* exhausting county-local
    // data. A self-reference would put the same points in two tiers at once.
    for (const [county, neighbours] of Object.entries(COUNTY_ADJACENCY)) {
      expect(neighbours).not.toContain(county);
    }
  });

  it('lists no duplicates and leaves no county stranded', () => {
    for (const [county, neighbours] of Object.entries(COUNTY_ADJACENCY)) {
      expect(new Set(neighbours).size).toBe(neighbours.length);
      expect(neighbours.length).toBeGreaterThan(0);
      expect(county).toBeTruthy();
    }
  });

  it('names only counties the platform can resolve', () => {
    const known = new Set<string>(KENYAN_COUNTIES);
    for (const neighbours of Object.values(COUNTY_ADJACENCY)) {
      for (const neighbour of neighbours) {
        expect(known.has(neighbour)).toBe(true);
      }
    }
  });
});

describe('adjacency — geography', () => {
  it('gives Nairobi the three neighbours the provincial ladder denied it', () => {
    // The county D7 was reported against: a province of one, with no regional
    // peers, falling straight from county to national.
    expect(new Set(neighboursOf('Nairobi'))).toEqual(
      new Set(['Kiambu', 'Machakos', 'Kajiado'])
    );
  });

  it('crosses provincial boundaries where the market does', () => {
    // Kajiado is Rift Valley and Machakos is Eastern, yet both border Nairobi.
    // This is precisely what regional grouping could not express.
    expect(areAdjacent('Nairobi', 'Kajiado')).toBe(true);
    expect(areAdjacent('Nairobi', 'Machakos')).toBe(true);
  });

  it('keeps the coastal and island counties small', () => {
    expect(neighboursOf('Mombasa')).toHaveLength(2);
    expect(neighboursOf('Lamu')).toHaveLength(2);
    expect(neighboursOf('Mandera')).toHaveLength(2);
  });

  it('does not make distant counties neighbours', () => {
    expect(areAdjacent('Mombasa', 'Turkana')).toBe(false);
    expect(areAdjacent('Kiambu', 'Nyeri')).toBe(false); // same region, not adjacent
    expect(areAdjacent('Nairobi', 'Kisumu')).toBe(false);
  });
});

describe('adjacency — resolution', () => {
  it('tolerates the spellings real data arrives in', () => {
    expect(areAdjacent('Muranga', 'Kiambu')).toBe(true);
    expect(areAdjacent("Murang'a", 'kiambu')).toBe(true);
    expect(neighboursOf('elgeyo marakwet')).toEqual(neighboursOf('Elgeyo-Marakwet'));
  });

  it('resolves the town aliases counties.ts already knows', () => {
    // 'Eldoret' is a town in Uasin Gishu and appears in the simulator data.
    expect(neighboursOf('Eldoret')).toEqual(neighboursOf('Uasin Gishu'));
  });

  it('never guesses at an unknown name', () => {
    expect(neighboursOf('Atlantis')).toEqual([]);
    expect(areAdjacent('Atlantis', 'Nairobi')).toBe(false);
  });

  it('is not adjacent to itself under any spelling', () => {
    expect(areAdjacent('Nairobi', 'Nairobi')).toBe(false);
    expect(areAdjacent('Muranga', "Murang'a")).toBe(false);
  });
});
