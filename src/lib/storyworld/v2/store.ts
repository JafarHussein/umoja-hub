// StoryWorld V2 — three-slice Zustand store (§8.3).
// Story slice: scroll-derived, scrubbable. World slice: monotonic, never rewinds.
// Visitor slice: input and capability.

import { create } from 'zustand';
import { deriveChapter } from './config';
import {
  createWorld,
  worldDiscover,
  worldFireConsequence,
  worldFirstInteraction,
  worldSettle,
} from './simulation';
import type {
  Chapter,
  ConsequenceId,
  DistrictId,
  InteractionVerb,
  RoleId,
  WorldState,
} from './types';

export type PerfTier = 1 | 2 | 3;

interface StorySlice {
  scrollProgress: number;
  chapter: Chapter;
  chapterProgress: number;
  branchActive: string | null;
  setScrollProgress: (p: number) => void;
  startBranch: (id: string) => void;
  endBranch: () => void;
}

interface WorldSlice {
  world: WorldState;
  /** Bumps every time the world resets — components clear their session refs on it. */
  resetEpoch: number;
  settle: (role: Exclude<RoleId, 'admin'>) => void;
  fireConsequence: (id: ConsequenceId, role: RoleId) => void;
  discover: (district: DistrictId) => void;
  firstInteraction: (verb: InteractionVerb) => void;
  /** Full replay: fires when the visitor leaves the section entirely (either direction). */
  resetWorld: () => void;
}

interface VisitorSlice {
  /** Presence position on the ground plane, null when the pointer is outside. */
  presence: [number, number, number] | null;
  inspecting: string | null;
  lifted: RoleId | null;
  /** Drag-orbit offset around the current Path point, radians (§4.3 "turn"). */
  orbit: number;
  tier: PerfTier;
  reducedMotion: boolean;
  setPresence: (p: [number, number, number] | null) => void;
  setInspecting: (id: string | null) => void;
  setLifted: (role: RoleId | null) => void;
  setOrbit: (v: number) => void;
  setTier: (t: PerfTier) => void;
  demoteTier: () => void;
  setReducedMotion: (v: boolean) => void;
}

export type StoryworldV2Store = StorySlice & WorldSlice & VisitorSlice;

export const useStoryworldV2 = create<StoryworldV2Store>(set => ({
  // ── Story ──
  scrollProgress: 0,
  chapter: 0,
  chapterProgress: 0,
  branchActive: null,
  setScrollProgress: p => set({ scrollProgress: p, ...deriveChapter(p) }),
  startBranch: id => set({ branchActive: id }),
  endBranch: () => set({ branchActive: null }),

  // ── World (monotonic while inside the section) ──
  world: createWorld(),
  resetEpoch: 0,
  settle: role => set(s => ({ world: worldSettle(s.world, role) })),
  fireConsequence: (id, role) => set(s => ({ world: worldFireConsequence(s.world, id, role) })),
  discover: district => set(s => ({ world: worldDiscover(s.world, district) })),
  firstInteraction: verb => set(s => ({ world: worldFirstInteraction(s.world, verb) })),
  resetWorld: () =>
    set(s => ({
      world: createWorld(),
      branchActive: null,
      inspecting: null,
      lifted: null,
      resetEpoch: s.resetEpoch + 1,
    })),

  // ── Visitor ──
  presence: null,
  inspecting: null,
  lifted: null,
  orbit: 0,
  tier: 1,
  reducedMotion: false,
  setPresence: presence => set({ presence }),
  setInspecting: inspecting => set({ inspecting }),
  setLifted: lifted => set({ lifted }),
  setOrbit: orbit => set({ orbit }),
  setTier: tier => set({ tier }),
  demoteTier: () => set(s => ({ tier: Math.min(3, s.tier + 1) as PerfTier })),
  setReducedMotion: reducedMotion => set({ reducedMotion }),
}));
