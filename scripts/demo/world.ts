// Shared simulation context + the World accumulator passed between generators.

import type mongoose from 'mongoose';
import type { Rng } from './rng';
import type { Ledger } from './ledger';
import type { Batcher } from './helpers';
import type { FarmProfileId, SeedCropId } from './dictionaries';

export interface SimContext {
  rng: Rng;
  ledger: Ledger;
  /** Deferred writer for append-only logs. Flush before reading what you queued. */
  batcher: Batcher;
}

export interface PersonRef {
  id: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  fullName: string;
  county: string;
  phone: string;
  gender: 'm' | 'f';
  joinedAt: Date;
  archetype: string;
  /**
   * Students and lecturers — the institution they belong to. A lecturer may
   * only review their own institution's students, so the seeder has to know
   * who belongs where or it writes reviews the application would refuse.
   */
  institutionId?: mongoose.Types.ObjectId;
  /** Farmers only — what they specialise in. Drives bio, county and listings. */
  farmProfile?: FarmProfileId;
  /**
   * Farmers only — the crops this person can honestly sell, in the order they
   * would lead with. Every listing, price alert and price series attributed to
   * them is drawn from here, so their profile and their marketplace presence
   * never contradict each other.
   */
  crops?: SeedCropId[];
}

export interface InstitutionRef {
  id: mongoose.Types.ObjectId;
  name: string;
  county: string;
}

export interface World {
  farmers: PersonRef[];
  buyers: PersonRef[];
  students: PersonRef[];
  lecturers: PersonRef[];
  institutions: InstitutionRef[];
  admin: PersonRef | null;
}

export function emptyWorld(): World {
  return {
    farmers: [],
    buyers: [],
    students: [],
    lecturers: [],
    institutions: [],
    admin: null,
  };
}
