// Kenyan data dictionaries for believable generation. Hand-curated (no faker)
// to keep names, places, crops, and voice authentic to East African farming and
// the UmojaHub education hub.

import { ListingCategory, ListingUnit } from '../../src/types';
import { CROP_REGISTRY } from '../../src/lib/taxonomy/crops';

export interface NamePart {
  name: string;
  gender: 'm' | 'f';
}

// First names with gender (for matching profile photos), spanning Kikuyu, Luo,
// Luhya, Kalenjin, Kamba, Somali, Coastal and other Kenyan communities.
export const FIRST_NAMES: NamePart[] = [
  { name: 'Wanjiku', gender: 'f' }, { name: 'Njeri', gender: 'f' },
  { name: 'Achieng', gender: 'f' }, { name: 'Akinyi', gender: 'f' },
  { name: 'Chebet', gender: 'f' }, { name: 'Jepkosgei', gender: 'f' },
  { name: 'Fatuma', gender: 'f' }, { name: 'Amina', gender: 'f' },
  { name: 'Mumbi', gender: 'f' }, { name: 'Nyambura', gender: 'f' },
  { name: 'Wairimu', gender: 'f' }, { name: 'Atieno', gender: 'f' },
  { name: 'Kavata', gender: 'f' }, { name: 'Mwende', gender: 'f' },
  { name: 'Halima', gender: 'f' }, { name: 'Naliaka', gender: 'f' },
  { name: 'Kipchoge', gender: 'm' }, { name: 'Kiprono', gender: 'm' },
  { name: 'Otieno', gender: 'm' }, { name: 'Onyango', gender: 'm' },
  { name: 'Njoroge', gender: 'm' }, { name: 'Kamau', gender: 'm' },
  { name: 'Mwangi', gender: 'm' }, { name: 'Githinji', gender: 'm' },
  { name: 'Mutua', gender: 'm' }, { name: 'Kilonzo', gender: 'm' },
  { name: 'Wekesa', gender: 'm' }, { name: 'Barasa', gender: 'm' },
  { name: 'Abdullahi', gender: 'm' }, { name: 'Hassan', gender: 'm' },
  { name: 'Brian', gender: 'm' }, { name: 'Dennis', gender: 'm' },
  { name: 'Kevin', gender: 'm' }, { name: 'Felix', gender: 'm' },
];

export const LAST_NAMES: string[] = [
  'Kamau', 'Mwangi', 'Otieno', 'Ochieng', 'Wanjala', 'Kiprotich', 'Mutiso',
  'Njoroge', 'Githinji', 'Achieng', 'Barasa', 'Wekesa', 'Korir', 'Cheruiyot',
  'Mwende', 'Kilonzo', 'Abdi', 'Hassan', 'Omondi', 'Owino', 'Karanja',
  'Nderitu', 'Maina', 'Chebii', 'Rotich', 'Wafula', 'Onyango', 'Kibet',
];

// Counties weighted toward agricultural heartlands. Every county listed here is
// referenced by at least one crop's `grownIn` below, so a farmer is never placed
// somewhere that grows nothing they sell.
export const FARMING_COUNTIES: string[] = [
  'Nakuru', 'Nyeri', 'Meru', 'Kiambu', 'Uasin Gishu', 'Trans Nzoia', 'Kisii',
  'Kirinyaga', 'Embu', 'Machakos', 'Bomet', 'Kericho', 'Nyandarua', 'Bungoma',
  "Murang'a", 'Narok', 'Kakamega', 'Kitui', 'Makueni',
];

export const URBAN_COUNTIES: string[] = ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret'];

// ---------------------------------------------------------------------------
// Produce catalogue
//
// DERIVED FROM CROP_REGISTRY — NEVER A PARALLEL LIST.
//
// src/lib/taxonomy/crops.ts was written because five crop lists had drifted
// apart, and the simulator's own dictionary was named in that module as one of
// the offenders: its crops did not match the engine's, so generated listings
// resolved to `season: UNKNOWN` and `middlemanBenchmark: null`. Every entry here
// is therefore keyed by a real `CropId`, and the display name, marketplace
// category and unit are read back from the registry rather than retyped. Adding
// produce the platform does not know about is not a seeding decision — it is a
// change to the canonical taxonomy.
//
// Tea and coffee are in the registry but absent here on purpose: the registry
// records `category: null` for both (they are cash crops with no ListingCategory
// member), and the marketplace feed browses by category. They are also not sold
// farmer-to-buyer in Kenya — they go to the KTDA factory and the coffee
// co-operative — so a tea listing would be less believable, not more.
// ---------------------------------------------------------------------------

/** The registry crops that are genuinely traded farmer-to-buyer on the platform. */
export type SeedCropId =
  | 'tomatoes'
  | 'onions'
  | 'potatoes'
  | 'carrots'
  | 'cabbages'
  | 'kale'
  | 'french-beans'
  | 'capsicum'
  | 'maize'
  | 'beans'
  | 'green-grams'
  | 'rice'
  | 'avocados'
  | 'bananas'
  | 'dairy';

export interface SeedCrop {
  id: SeedCropId;
  /** Display name — always `CROP_REGISTRY[id].label`, asserted at module load. */
  name: string;
  category: ListingCategory;
  /** Trading unit — always one of `CROP_REGISTRY[id].typicalUnits`. */
  unit: ListingUnit;
  /** KES per unit, at Kenyan farmgate/wholesale for the unit named above. */
  priceMin: number;
  priceMax: number;
  /** How much of it one farmer plausibly has on hand, in `unit`. */
  qtyMin: number;
  qtyMax: number;
  /** How this crop leaves the farm — used verbatim in generated descriptions. */
  packaging: string;
  /** What the farmer says they did to it before listing. */
  preparation: string;
  /** Counties that actually grow it. A listing is never placed outside these. */
  grownIn: readonly string[];
}

// Prices are per the unit named, not per kg: a maize BAG is the 90 kg trading
// bag, a potato BAG the 50 kg regulated one, a tomato CRATE the ~64 kg wooden
// crate. src/lib/taxonomy/units.ts explains why the platform never converts
// between them; the same discipline applies to the figures below.
export const CROPS: SeedCrop[] = [
  {
    id: 'tomatoes',
    name: 'Tomatoes', category: ListingCategory.VEGETABLES, unit: ListingUnit.CRATE,
    priceMin: 2800, priceMax: 5200, qtyMin: 20, qtyMax: 140,
    packaging: 'wooden crates', preparation: 'sorted by size and packed the same day they are picked',
    grownIn: ['Kirinyaga', 'Nakuru', 'Meru', 'Machakos', "Murang'a", 'Kiambu', 'Narok', 'Makueni'],
  },
  {
    id: 'onions',
    name: 'Onions', category: ListingCategory.VEGETABLES, unit: ListingUnit.BAG,
    priceMin: 2400, priceMax: 5000, qtyMin: 15, qtyMax: 110,
    packaging: '50 kg nets', preparation: 'cured in the shade for two weeks so they keep well in store',
    grownIn: ['Nakuru', 'Narok', 'Meru', 'Machakos', 'Kirinyaga', 'Makueni'],
  },
  {
    id: 'potatoes',
    name: 'Potatoes', category: ListingCategory.VEGETABLES, unit: ListingUnit.BAG,
    priceMin: 1800, priceMax: 3400, qtyMin: 20, qtyMax: 160,
    packaging: '50 kg bags', preparation: 'graded to remove the small and cut ones',
    grownIn: ['Nyandarua', 'Nakuru', 'Meru', 'Bomet', 'Nyeri', 'Narok', 'Kiambu'],
  },
  {
    id: 'carrots',
    name: 'Carrots', category: ListingCategory.VEGETABLES, unit: ListingUnit.BAG,
    priceMin: 1500, priceMax: 3000, qtyMin: 15, qtyMax: 100,
    packaging: '50 kg bags', preparation: 'washed and topped before bagging',
    grownIn: ['Nyandarua', 'Nakuru', 'Kiambu', 'Nyeri', 'Meru', 'Bomet'],
  },
  {
    id: 'cabbages',
    name: 'Cabbages', category: ListingCategory.VEGETABLES, unit: ListingUnit.PIECE,
    priceMin: 25, priceMax: 70, qtyMin: 300, qtyMax: 2500,
    packaging: 'counted heads', preparation: 'cut with the outer leaves left on so they travel without bruising',
    grownIn: ['Nyandarua', 'Nakuru', 'Kiambu', 'Nyeri', 'Bomet', 'Kisii', 'Meru'],
  },
  {
    id: 'kale',
    name: 'Kale (Sukuma Wiki)', category: ListingCategory.VEGETABLES, unit: ListingUnit.KG,
    priceMin: 30, priceMax: 70, qtyMin: 80, qtyMax: 600,
    packaging: 'tied bundles', preparation: 'cut in the morning and kept in the shade',
    grownIn: ['Kiambu', 'Nakuru', 'Kisii', 'Kakamega', "Murang'a", 'Nyeri', 'Bungoma', 'Meru', 'Kisumu', 'Kericho'],
  },
  {
    id: 'french-beans',
    name: 'French Beans', category: ListingCategory.VEGETABLES, unit: ListingUnit.KG,
    priceMin: 85, priceMax: 165, qtyMin: 60, qtyMax: 450,
    packaging: 'ventilated cartons', preparation: 'picked to export length and sorted the same morning',
    grownIn: ['Kirinyaga', 'Meru', 'Machakos', 'Nyeri', 'Embu', 'Kiambu', 'Nakuru'],
  },
  {
    id: 'capsicum',
    name: 'Capsicum', category: ListingCategory.VEGETABLES, unit: ListingUnit.KG,
    priceMin: 70, priceMax: 150, qtyMin: 50, qtyMax: 400,
    packaging: '10 kg crates', preparation: 'cut with the stalk on and sorted by colour',
    grownIn: ['Kirinyaga', 'Meru', 'Kiambu', 'Machakos', 'Nakuru', 'Embu'],
  },
  {
    id: 'maize',
    name: 'Maize', category: ListingCategory.CEREALS, unit: ListingUnit.BAG,
    priceMin: 3200, priceMax: 5000, qtyMin: 20, qtyMax: 180,
    packaging: '90 kg bags', preparation: 'dried down to storage moisture and winnowed clean',
    grownIn: ['Trans Nzoia', 'Uasin Gishu', 'Bungoma', 'Nakuru', 'Narok', 'Kakamega', 'Bomet', 'Kisumu', 'Kericho'],
  },
  {
    id: 'beans',
    name: 'Beans', category: ListingCategory.LEGUMES, unit: ListingUnit.BAG,
    priceMin: 8000, priceMax: 13000, qtyMin: 8, qtyMax: 60,
    packaging: '90 kg bags', preparation: 'hand-sorted to take out the stones and broken grain',
    grownIn: ['Bungoma', 'Kakamega', 'Nakuru', 'Meru', 'Embu', 'Machakos', 'Bomet', 'Trans Nzoia', 'Uasin Gishu'],
  },
  {
    id: 'green-grams',
    name: 'Green Grams (Ndengu)', category: ListingCategory.LEGUMES, unit: ListingUnit.BAG,
    priceMin: 9000, priceMax: 14500, qtyMin: 6, qtyMax: 45,
    packaging: '90 kg bags', preparation: 'dried on canvas and cleaned twice',
    grownIn: ['Machakos', 'Makueni', 'Kitui', 'Embu', 'Meru'],
  },
  {
    id: 'rice',
    name: 'Rice', category: ListingCategory.CEREALS, unit: ListingUnit.BAG,
    priceMin: 6000, priceMax: 9500, qtyMin: 10, qtyMax: 80,
    packaging: '50 kg bags', preparation: 'milled and winnowed, with the broken grain separated out',
    grownIn: ['Kirinyaga', 'Kisumu'],
  },
  {
    id: 'avocados',
    name: 'Avocados', category: ListingCategory.FRUITS, unit: ListingUnit.CRATE,
    priceMin: 1200, priceMax: 3000, qtyMin: 20, qtyMax: 150,
    packaging: 'field crates', preparation: 'picked at the right dry-matter and counted into crates',
    grownIn: ["Murang'a", 'Kiambu', 'Kisii', 'Meru', 'Embu', 'Nyeri', 'Bomet', 'Kakamega'],
  },
  {
    id: 'bananas',
    name: 'Bananas', category: ListingCategory.FRUITS, unit: ListingUnit.BAG,
    priceMin: 900, priceMax: 2000, qtyMin: 15, qtyMax: 90,
    packaging: 'bunches wrapped in banana leaf', preparation: 'cut green so they ripen on the way to market',
    grownIn: ['Kisii', 'Meru', "Murang'a", 'Embu', 'Kirinyaga', 'Bungoma', 'Kisumu'],
  },
  {
    id: 'dairy',
    name: 'Milk', category: ListingCategory.DAIRY, unit: ListingUnit.LITRE,
    priceMin: 45, priceMax: 70, qtyMin: 60, qtyMax: 400,
    packaging: 'aluminium cans', preparation: 'cooled straight after the morning milking',
    grownIn: ['Uasin Gishu', 'Nakuru', 'Nyandarua', 'Kiambu', 'Bomet', 'Kericho', 'Nyeri', 'Trans Nzoia', 'Meru'],
  },
];

// Fail at module load rather than shipping a listing whose name or category has
// drifted from the registry — the exact failure this catalogue is derived to
// prevent.
for (const crop of CROPS) {
  const canonical = CROP_REGISTRY[crop.id];
  if (crop.name !== canonical.label) {
    throw new Error(`seed crop "${crop.id}" names itself "${crop.name}"; registry says "${canonical.label}"`);
  }
  if (crop.category !== canonical.category) {
    throw new Error(`seed crop "${crop.id}" is category ${crop.category}; registry says ${canonical.category}`);
  }
  if (!canonical.typicalUnits.includes(crop.unit)) {
    throw new Error(`seed crop "${crop.id}" trades in ${crop.unit}, which is not one of its typical units`);
  }
}

export const CROPS_BY_ID: Readonly<Record<SeedCropId, SeedCrop>> = Object.fromEntries(
  CROPS.map((c) => [c.id, c])
) as Record<SeedCropId, SeedCrop>;

/** Crops that county actually grows. Empty for a county with no produce here. */
export function cropsGrownIn(county: string): SeedCrop[] {
  return CROPS.filter((c) => c.grownIn.includes(county));
}

// ---------------------------------------------------------------------------
// Farm profiles
//
// A farmer who sells milk, avocados and maize in the same week reads as a random
// row generator, because that is what produced it. Real smallholders specialise,
// and their county follows the specialisation: potatoes come off the Nyandarua
// highlands, ndengu out of the Eastern drylands, milk from the Rift Valley.
//
// So a generated farmer picks a profile FIRST, draws their county from the
// counties that profile is farmed in, and lists only crops from that profile
// that are actually grown in that county. Their bio, their `cropsGrown` and
// every listing they post then agree with each other by construction.
// ---------------------------------------------------------------------------

export type FarmProfileId = 'horticulture' | 'highland-roots' | 'cereals' | 'pulses' | 'dairy' | 'fruit' | 'mixed';

export interface FarmProfile {
  id: FarmProfileId;
  /**
   * The crop this farmer is defined by, and which they are guaranteed to sell.
   *
   * Without this, a "pulses" farmer whose bio says green grams are their main
   * earner could be placed in a county that grows none, list beans instead, and
   * contradict their own profile page. The county pool is therefore drawn from
   * the defining crop's growing regions, and the crop always leads the list.
   */
  defining: SeedCropId;
  crops: readonly SeedCropId[];
  /** Bios written in this farmer's own voice — one is picked per farmer. */
  bios: readonly string[];
}

export const FARM_PROFILES: Readonly<Record<FarmProfileId, FarmProfile>> = {
  horticulture: {
    id: 'horticulture',
    defining: 'tomatoes',
    crops: ['tomatoes', 'onions', 'capsicum', 'french-beans', 'kale', 'cabbages'],
    bios: [
      'I grow vegetables for the Nairobi market and for two hotels that buy from me every week. Quality and turning up on time are what keep them.',
      'Horticulture on four acres under drip. I have been supplying greengrocers for eleven years and most of my buyers are repeat.',
      'Vegetable farmer. I plant in staggered blocks so there is something ready to cut most weeks of the year.',
    ],
  },
  'highland-roots': {
    id: 'highland-roots',
    defining: 'potatoes',
    crops: ['potatoes', 'carrots', 'cabbages', 'kale'],
    bios: [
      'Highland farmer growing potatoes and carrots. Certified seed every season — it costs more but the yield pays it back.',
      'I farm the cold side of the ridge, which suits potatoes and carrots. I store in a ventilated shed and sell through the year rather than all at harvest.',
      'Potatoes are my main crop and I rotate with cabbages to keep the blight down.',
    ],
  },
  cereals: {
    id: 'cereals',
    defining: 'maize',
    crops: ['maize', 'beans', 'rice'],
    bios: [
      'Large-acreage maize, with beans in rotation. I dry and store properly rather than selling wet at harvest for whatever is offered.',
      'Grain farmer. I have my own drying floor and store, so I can hold stock until the price is worth taking.',
      'I have been growing maize on this land since my father farmed it. Certified seed, proper spacing, and I test the moisture before I bag.',
    ],
  },
  pulses: {
    id: 'pulses',
    defining: 'green-grams',
    crops: ['green-grams', 'beans'],
    bios: [
      'Ndengu and beans in the drylands. They finish before the rains fail, which is why I moved to them.',
      'I grow pulses because they need less water than maize and the buyers come looking for them.',
      'Dryland farmer. Green grams are my main earner and I clean the grain twice before I sell it.',
    ],
  },
  dairy: {
    id: 'dairy',
    defining: 'dairy',
    crops: ['dairy', 'maize', 'kale'],
    bios: [
      'Dairy farmer with nine Friesians. I milk twice a day and the morning milk is cooled and collected by ten.',
      'I keep a small dairy herd and grow my own fodder, which is what keeps the litres up when the grass is finished.',
      'Milk is my daily income and maize is the harvest I bank. The cows pay the school fees every month.',
    ],
  },
  fruit: {
    id: 'fruit',
    defining: 'avocados',
    crops: ['avocados', 'bananas'],
    bios: [
      'Grafted avocado on the slopes. The trees took years to come into full bearing and now they carry the whole farm.',
      'Fruit farmer. I pick to order rather than stripping the trees, so what you collect is at the right maturity.',
      'I planted grafted avocado eight years ago and interplanted bananas while they grew. Both are producing well now.',
    ],
  },
  mixed: {
    id: 'mixed',
    // Sukuma wiki, not maize: it is the crop every Kenyan smallholding actually
    // has, it grows in nearly every county, and defining `mixed` by maize made
    // maize a third of the whole feed once the cereal and dairy profiles were
    // counted too.
    defining: 'kale',
    crops: ['maize', 'kale', 'beans', 'bananas', 'tomatoes', 'potatoes'],
    bios: [
      'Mixed farming on a family plot — a bit of everything, so a bad season in one crop does not finish us.',
      'Smallholder. I grow for the house first and sell the surplus, which means what I list is genuinely spare.',
      'Two acres, mixed. I am in a cooperative and we bulk our produce together to reach the bigger buyers.',
    ],
  },
};

/**
 * The crops a farmer on `profile` can honestly sell from `county`, defining crop
 * first — that is the one they lead with and the one their bio speaks about.
 * The rest of the profile follows, narrowed to what the county actually grows.
 */
export function listableCrops(profile: FarmProfileId, county: string): SeedCrop[] {
  const { defining, crops } = FARM_PROFILES[profile];
  const ordered = [defining, ...crops.filter((id) => id !== defining)];
  const own = ordered.map((id) => CROPS_BY_ID[id]).filter((c) => c.grownIn.includes(county));
  return own.length > 0 ? own : cropsGrownIn(county);
}

/**
 * Counties this profile can be farmed in — the ones that grow its defining crop.
 * Pairing that with `listableCrops` guarantees the defining crop leads every
 * farmer's list, so a bio that names it is never contradicted by the listings.
 */
export function countiesFor(profile: FarmProfileId): string[] {
  return CROPS_BY_ID[FARM_PROFILES[profile].defining].grownIn.filter((c) =>
    FARMING_COUNTIES.includes(c)
  );
}

// Titles lead with grade and end with something a buyer acts on. Both halves are
// drawn per crop rather than from one pool: a single shared list of adjectives
// produced "Hand-Picked Milk", and a single shared list of hooks offered to sell
// it "Picked This Week". Milk is not picked, and dry grain is not fresh.
const ADJECTIVES_BY_CATEGORY: Readonly<Partial<Record<ListingCategory, readonly string[]>>> = {
  [ListingCategory.DAIRY]: ['Fresh', 'Chilled', 'Morning', 'Farm-Fresh', 'Clean'],
  // Stored, dried produce is graded and cleaned, never "hand-picked" or "fresh".
  [ListingCategory.CEREALS]: ['Grade 1', 'Clean', 'Well-Dried', 'Sorted', 'Premium'],
  [ListingCategory.LEGUMES]: ['Grade 1', 'Clean', 'Well-Dried', 'Sorted', 'Premium'],
};

const FRESH_ADJECTIVES: readonly string[] = [
  'Fresh',
  'Grade 1',
  'Premium',
  'Farm-Fresh',
  'Hand-Picked',
  'Well-Sorted',
  'Clean',
  'Sorted',
];

export function adjectivesFor(crop: SeedCrop): readonly string[] {
  return ADJECTIVES_BY_CATEGORY[crop.category] ?? FRESH_ADJECTIVES;
}

export const UNIT_HOOKS: Readonly<Record<ListingUnit, readonly string[]>> = {
  [ListingUnit.CRATE]: ['Packed in Crates', 'Crates Ready Now', 'Bulk Crates Available'],
  [ListingUnit.BAG]: ['Bagged and Ready', 'Bulk Bags Available', 'Collect by the Bag'],
  [ListingUnit.KG]: ['Sold by the Kilo', 'Cut to Order', 'Fresh This Morning'],
  [ListingUnit.PIECE]: ['Counted and Ready', 'Cut to Order', 'Field-Cut This Week'],
  [ListingUnit.LITRE]: ['Daily Supply', 'Morning Milk', 'Cooled and Collected'],
};

// Hooks that only make sense for something that was harvested.
const HARVEST_HOOKS: readonly string[] = ['Picked This Week', 'Harvested Recently'];

const NEUTRAL_HOOKS: readonly string[] = [
  'Direct from the Farm',
  'Ready for Collection',
  'Hotel-Grade Quality',
  'Limited Stock',
];

/** The hooks a crop can honestly use: its unit's, plus harvest wording if apt. */
export function hooksFor(crop: SeedCrop): readonly string[] {
  const general = crop.category === ListingCategory.DAIRY
    ? NEUTRAL_HOOKS
    : [...HARVEST_HOOKS, ...NEUTRAL_HOOKS];
  return [...UNIT_HOOKS[crop.unit], ...general];
}

export const KENYAN_UNIVERSITIES: Array<{ name: string; county: string; domains: string[] }> = [
  { name: 'University of Nairobi', county: 'Nairobi', domains: ['students.uonbi.ac.ke', 'uonbi.ac.ke'] },
  { name: 'Jomo Kenyatta University of Agriculture and Technology', county: 'Kiambu', domains: ['students.jkuat.ac.ke', 'jkuat.ac.ke'] },
  { name: 'Moi University', county: 'Uasin Gishu', domains: ['students.mu.ac.ke', 'mu.ac.ke'] },
  { name: 'Kenyatta University', county: 'Kiambu', domains: ['students.ku.ac.ke', 'ku.ac.ke'] },
  { name: 'Strathmore University', county: 'Nairobi', domains: ['strathmore.edu'] },
  { name: 'Dedan Kimathi University of Technology', county: 'Nyeri', domains: ['students.dkut.ac.ke', 'dkut.ac.ke'] },
];

export const TECH_STACKS: string[] = [
  'React', 'Next.js', 'TypeScript', 'Node.js', 'Python', 'Django', 'Flutter',
  'React Native', 'PostgreSQL', 'MongoDB', 'Firebase', 'Go', 'Java', 'Spring',
  'TailwindCSS', 'Express', 'FastAPI', 'GraphQL', 'Docker', 'Kotlin',
];

export const SKILL_CATEGORIES: Record<string, string> = {
  React: 'Frontend', 'Next.js': 'Frontend', TypeScript: 'Languages', TailwindCSS: 'Frontend',
  'Node.js': 'Backend', Express: 'Backend', Django: 'Backend', FastAPI: 'Backend',
  Python: 'Languages', Go: 'Languages', Java: 'Languages', Kotlin: 'Languages',
  PostgreSQL: 'Data', MongoDB: 'Data', Firebase: 'Data', GraphQL: 'Data',
  Flutter: 'Mobile', 'React Native': 'Mobile', Docker: 'DevOps', Spring: 'Backend',
};

// Project titles for the education hub, grounded in Kenyan problem domains.
export const PROJECT_TITLES: string[] = [
  'M-Pesa reconciliation dashboard for a farmers cooperative',
  'SMS-based market price alerts for smallholder farmers',
  'Offline-first inventory tracker for rural agrodealers',
  'Matatu route and fare planner for Nairobi commuters',
  'Clinic appointment booking system for a rural health centre',
  'Digital attendance for a TVET institution',
  'Water-point reporting tool for a county government',
  'Boda-boda delivery dispatch for small businesses',
  'Solar payment tracking for an off-grid energy startup',
  'Crop disease photo-diagnosis assistant',
  'Cooperative savings (chama) management app',
  'School fees payment and statement portal',
];

// Repositories a Kenyan CS student could realistically contribute to — every
// one of them real, public and active. The open-source track records a URL the
// student supplies and never verifies it, so seeding invented repositories put
// unreachable links on screen. These resolve.
export const OSS_REPOSITORIES: { name: string; url: string }[] = [
  { name: 'ushahidi/platform', url: 'https://github.com/ushahidi/platform' },
  { name: 'openmrs/openmrs-core', url: 'https://github.com/openmrs/openmrs-core' },
  { name: 'dhis2/dhis2-core', url: 'https://github.com/dhis2/dhis2-core' },
  { name: 'apache/fineract', url: 'https://github.com/apache/fineract' },
  { name: 'dimagi/commcare-hq', url: 'https://github.com/dimagi/commcare-hq' },
  { name: 'openstreetmap/iD', url: 'https://github.com/openstreetmap/iD' },
  { name: 'frappe/erpnext', url: 'https://github.com/frappe/erpnext' },
  { name: 'fastapi/fastapi', url: 'https://github.com/fastapi/fastapi' },
];

export const STUDENT_INTERESTS: string[] = [
  'Full-stack web development', 'Mobile app development', 'Data engineering',
  'FinTech', 'AgriTech', 'DevOps', 'AI/ML', 'Backend systems',
];

export const DEPARTMENTS: string[] = [
  'School of Computing and Informatics', 'Department of Computer Science',
  'Faculty of Information Technology', 'School of Engineering',
];

export const BUYER_ORGS: string[] = [
  'Mama Ngina Greengrocers', 'Savannah Hotel Group', 'FreshMart Supermarkets',
  'Nairobi Java Kitchens', 'Coast Catering Services', 'Highlands Produce Distributors',
];
