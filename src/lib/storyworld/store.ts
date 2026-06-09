import { create } from 'zustand';
import { deriveEpisodeState } from './config';
import type { EpisodeState } from './types';

interface StoryworldStore extends EpisodeState {
  scrollProgress: number;
  completedEpisodes: number[];
  reducedMotion: boolean;
  setScrollProgress: (p: number) => void;
  setReducedMotion: (v: boolean) => void;
  markEpisodeComplete: (index: number) => void;
}

export const useStoryworldStore = create<StoryworldStore>(set => ({
  scrollProgress: 0,
  phase: 'intro',
  episodeIndex: -1,
  episodeProgress: 0,
  completedEpisodes: [],
  reducedMotion: false,

  setScrollProgress: scrollProgress =>
    set({ scrollProgress, ...deriveEpisodeState(scrollProgress) }),

  setReducedMotion: reducedMotion => set({ reducedMotion }),

  markEpisodeComplete: index =>
    set(s =>
      s.completedEpisodes.includes(index)
        ? s
        : { completedEpisodes: [...s.completedEpisodes, index] }
    ),
}));
