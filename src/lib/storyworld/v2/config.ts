// StoryWorld V2 — world layout, scroll chapters, camera keyframes.
// All spatial values in world units. The world is a ~30-unit disc dissolving into fog.

import type { Chapter, ChapterState, DistrictId, RoleId } from './types';

export type Vec3 = [number, number, number];

// ─── Roles ────────────────────────────────────────────────────────────────────

export interface RoleDef {
  id: RoleId;
  label: string;
  color: string;
  district: DistrictId;
}

export const ROLES: Record<RoleId, RoleDef> = {
  farmer: { id: 'farmer', label: 'FARMER', color: '#8B5E3C', district: 'fields' },
  buyer: { id: 'buyer', label: 'BUYER', color: '#4A5568', district: 'depot' },
  student: { id: 'student', label: 'STUDENT', color: '#5B7FA6', district: 'studio' },
  lecturer: { id: 'lecturer', label: 'LECTURER', color: '#6B7280', district: 'review-chamber' },
  employer: { id: 'employer', label: 'EMPLOYER', color: '#374151', district: 'bureau' },
  cooperative: { id: 'cooperative', label: 'COOPERATIVE', color: '#5C7A4A', district: 'circle' },
  ngo: { id: 'ngo', label: 'NGO', color: '#7C6B9A', district: 'field-station' },
  admin: { id: 'admin', label: 'THE ADMINISTRATOR', color: '#2e7d78', district: 'ledger' },
};

/** Episode order along the Path (chapter i+1 belongs to EPISODE_ROLES[i]). */
export const EPISODE_ROLES: Exclude<RoleId, 'admin'>[] = [
  'farmer',
  'buyer',
  'student',
  'lecturer',
  'employer',
  'cooperative',
  'ngo',
];

export const ADMIN_EMISSIVE = '#56a8a2';
export const DISCOVERY_COLOR = '#c8c2ba';

// ─── District layout — a flattened spiral, chapter order clockwise ────────────

interface DistrictLayout {
  id: Exclude<DistrictId, 'ledger'>;
  /** Placement angle in radians (math convention, XZ plane). */
  angle: number;
  radius: number;
}

const DEG = Math.PI / 180;

const DISTRICT_LAYOUT: DistrictLayout[] = [
  { id: 'fields', angle: 90 * DEG, radius: 10.5 },
  { id: 'depot', angle: 42 * DEG, radius: 10.0 },
  { id: 'studio', angle: -6 * DEG, radius: 9.5 },
  { id: 'review-chamber', angle: -54 * DEG, radius: 9.0 },
  { id: 'bureau', angle: -102 * DEG, radius: 8.5 },
  { id: 'circle', angle: -150 * DEG, radius: 8.0 },
  { id: 'field-station', angle: -198 * DEG, radius: 7.5 },
];

function onCircle(angle: number, radius: number, y = 0): Vec3 {
  return [Math.cos(angle) * radius, y, Math.sin(angle) * radius];
}

function add(a: Vec3, b: Vec3): Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function scale(v: Vec3, s: number): Vec3 {
  return [v[0] * s, v[1] * s, v[2] * s];
}

export interface DistrictDef {
  id: Exclude<DistrictId, 'ledger'>;
  center: Vec3;
  /** Outward unit direction (away from the Ledger). */
  outward: Vec3;
  /** Tangent unit direction along the Path toward the next chapter. */
  tangent: Vec3;
  /** Y rotation so the kit faces the Ledger. */
  facing: number;
}

export const DISTRICTS: Record<Exclude<DistrictId, 'ledger'>, DistrictDef> = Object.fromEntries(
  DISTRICT_LAYOUT.map(d => {
    const center = onCircle(d.angle, d.radius);
    const outward: Vec3 = [Math.cos(d.angle), 0, Math.sin(d.angle)];
    // Chapter order runs clockwise (decreasing angle): tangent = d(center)/d(-angle).
    const tangent: Vec3 = [Math.sin(d.angle), 0, -Math.cos(d.angle)];
    const facing = Math.atan2(-outward[0], -outward[2]);
    return [d.id, { id: d.id, center, outward, tangent, facing }];
  })
) as Record<Exclude<DistrictId, 'ledger'>, DistrictDef>;

export const LEDGER_CENTER: Vec3 = [0, 0, 0];

// ─── Episode staging — arrival, conversation, settle positions per role ───────

export interface StagingDef {
  /** Where the character materializes (in fog, ahead of the camera's travel). */
  arrival: Vec3;
  /** Where the character stands during dialogue. */
  convoChar: Vec3;
  /** Where the Administrator stands during this episode's dialogue. */
  convoAdmin: Vec3;
  /** Resident home position inside the district. */
  home: Vec3;
}

export const STAGING: Record<Exclude<RoleId, 'admin'>, StagingDef> = Object.fromEntries(
  EPISODE_ROLES.map(role => {
    const d = DISTRICTS[ROLES[role].district as Exclude<DistrictId, 'ledger'>];
    const arrival = add(add(d.center, scale(d.tangent, 4.2)), scale(d.outward, 1.6));
    const convoChar = add(add(d.center, scale(d.tangent, 1.3)), scale(d.outward, 0.4));
    const convoAdmin = add(add(d.center, scale(d.tangent, -0.9)), scale(d.outward, 0.3));
    const home = add(d.center, scale(d.outward, -0.9));
    return [role, { arrival, convoChar, convoAdmin, home }];
  })
) as Record<Exclude<RoleId, 'admin'>, StagingDef>;

// ─── Scroll chapters (§9.2): prologue 6%, episodes 12% each, finale 10% ───────

export const SECTION_VH = 760;
export const PROLOGUE_END = 0.06;
export const EPISODE_LENGTH = 0.12;
export const FINALE_START = PROLOGUE_END + 7 * EPISODE_LENGTH; // 0.90

export function deriveChapter(progress: number): ChapterState {
  const p = Math.min(1, Math.max(0, progress));
  if (p < PROLOGUE_END) {
    return { chapter: 0, chapterProgress: p / PROLOGUE_END };
  }
  if (p >= FINALE_START) {
    return { chapter: 8, chapterProgress: Math.min(1, (p - FINALE_START) / (1 - FINALE_START)) };
  }
  const idx = Math.min(6, Math.floor((p - PROLOGUE_END) / EPISODE_LENGTH));
  const chapterProgress = (p - PROLOGUE_END - idx * EPISODE_LENGTH) / EPISODE_LENGTH;
  return { chapter: (idx + 1) as Chapter, chapterProgress: Math.min(1, chapterProgress) };
}

// ─── Camera keyframes — the walk along the Path ───────────────────────────────

export interface CameraKeyframe {
  at: number;
  pos: Vec3;
  look: Vec3;
}

function episodeViewpoint(role: Exclude<RoleId, 'admin'>): { pos: Vec3; look: Vec3 } {
  const d = DISTRICTS[ROLES[role].district as Exclude<DistrictId, 'ledger'>];
  // Stand off the district on its outward side, slightly behind along the path,
  // looking at the conversation ground.
  const pos = add(add(d.center, scale(d.outward, 5.6)), scale(d.tangent, -1.2));
  return { pos: [pos[0], 3.1, pos[2]], look: [d.center[0], 0.9, d.center[2]] };
}

function buildKeyframes(): CameraKeyframe[] {
  const frames: CameraKeyframe[] = [];
  // Prologue: descend toward the world, Ledger in frame.
  frames.push({ at: 0, pos: [0, 7.5, 19], look: [0, 1.4, 0] });
  frames.push({ at: PROLOGUE_END * 0.7, pos: [0, 4.4, 17], look: [0, 1.0, 4] });
  // Episodes: hold each viewpoint for the chapter body, travel in the last 15%.
  EPISODE_ROLES.forEach((role, i) => {
    const v = episodeViewpoint(role);
    const start = PROLOGUE_END + i * EPISODE_LENGTH;
    frames.push({ at: start, pos: v.pos, look: v.look });
    frames.push({ at: start + EPISODE_LENGTH * 0.85, pos: v.pos, look: v.look });
  });
  // Finale: arrive at the Ledger, then the single crane move (§5.6).
  frames.push({ at: FINALE_START + 0.02, pos: [4.6, 2.6, 5.2], look: [0, 1.4, 0] });
  frames.push({ at: FINALE_START + 0.5 * (1 - FINALE_START), pos: [3.2, 3.4, 4.0], look: [0, 1.6, 0] });
  frames.push({ at: 1, pos: [0, 8.5, 9.5], look: [0, 1.2, 0] });
  return frames;
}

export const CAMERA_KEYFRAMES: CameraKeyframe[] = buildKeyframes();

// ─── The Path — ground inlay control points ───────────────────────────────────

export const PATH_POINTS: Vec3[] = [
  onCircle(118 * DEG, 15.5, 0.02),
  onCircle(104 * DEG, 12.8, 0.02),
  ...DISTRICT_LAYOUT.map(d => onCircle(d.angle, d.radius + 1.1, 0.02)),
  onCircle(-226 * DEG, 5.0, 0.02),
  [1.6, 0.02, 0.4],
  [0, 0.02, 0],
];

// ─── Interaction constants ────────────────────────────────────────────────────

/** Character awareness radius for the visitor presence (§2.4). */
export const AWARENESS_RADIUS = 1.6;
/** Dwell before AWARE engages, ms. */
export const AWARENESS_DWELL_MS = 300;
/** Resident lift clamp radius around home (§4.5). */
export const LIFT_CLAMP_RADIUS = 2.0;
/** Branch pocket hard cap, ms (Resolved Decision 5). */
export const BRANCH_CAP_MS = 10_000;
/** Drag-orbit max offset, radians (±18°, §4.3). */
export const ORBIT_MAX = 18 * DEG;
