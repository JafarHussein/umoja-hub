export type CharacterId = 'C01' | 'C02' | 'C03' | 'C04' | 'C05' | 'C06';
export type Speaker = 'participant' | 'guide';
export type DemoType = 'payment-flow' | 'trust-score' | 'portfolio-card' | 'verification-chain' | 'group-cluster' | 'none';
export type EpisodePhase = 'intro' | 'episode' | 'outro';

export interface DialogueLine {
  id: string;
  speaker: Speaker;
  text: string;
  /** 0–1 within the episode scroll range at which this line is triggered */
  triggerAt: number;
}

export interface EpisodeDef {
  index: number;
  characterId: CharacterId;
  arrivalAt: number;   // episode progress 0–1
  crossingAt: number;  // episode progress 0–1
  demoAt: number;      // episode progress 0–1
  demoType: DemoType;
  dialogue: DialogueLine[];
}

export interface EpisodeState {
  phase: EpisodePhase;
  episodeIndex: number;   // -1 for intro/outro
  episodeProgress: number; // 0–1 within current episode
}

export interface ActiveLine {
  line: DialogueLine;
  episodeIndex: number;
  shownAt: number; // wall clock time
}
