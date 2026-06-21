// Shared simulation context + the World accumulator passed between generators.

import type mongoose from 'mongoose';
import type { Rng } from './rng';
import type { Ledger } from './ledger';

export interface SimContext {
  rng: Rng;
  ledger: Ledger;
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
}

export interface InstitutionRef {
  id: mongoose.Types.ObjectId;
  name: string;
  county: string;
}

export interface NgoRef {
  id: mongoose.Types.ObjectId;
  name: string;
}

export interface World {
  farmers: PersonRef[];
  buyers: PersonRef[];
  students: PersonRef[];
  lecturers: PersonRef[];
  employers: PersonRef[];
  ngos: NgoRef[];
  institutions: InstitutionRef[];
  admin: PersonRef | null;
}

export function emptyWorld(): World {
  return {
    farmers: [],
    buyers: [],
    students: [],
    lecturers: [],
    employers: [],
    ngos: [],
    institutions: [],
    admin: null,
  };
}
