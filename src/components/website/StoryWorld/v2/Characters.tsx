'use client';

import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { CharacterBase } from '../CharacterBase';
import { CharacterProp, GuideProp } from '../CharacterProp';
import {
  ADMIN_EMISSIVE,
  AWARENESS_RADIUS,
  EPISODE_ROLES,
  LIFT_CLAMP_RADIUS,
  ROLES,
  STAGING,
} from '@/lib/storyworld/v2/config';
import { MICRO_LINES } from '@/lib/storyworld/v2/data';
import { deriveBehavior, episodeChapterOf } from '@/lib/storyworld/v2/simulation';
import { useStoryworldV2 } from '@/lib/storyworld/v2/store';
import type { CharacterId } from '@/lib/storyworld/types';
import type { RoleId } from '@/lib/storyworld/v2/types';

// Characters (§2): five-state behavior, AWARE overlay, gait personality (§7.3),
// lift verb (§4.5), and once-per-session micro-lines (§6.5).

const ROLE_TO_PROP: Partial<Record<RoleId, CharacterId>> = {
  farmer: 'C01',
  buyer: 'C02',
  student: 'C03',
  lecturer: 'C04',
  employer: 'C05',
  cooperative: 'C06',
};

interface Gait {
  amp: number;
  freq: number;
}

const GAITS: Record<Exclude<RoleId, 'admin'>, Gait> = {
  farmer: { amp: 0.015, freq: 1.6 },
  buyer: { amp: 0.01, freq: 2.2 },
  student: { amp: 0.03, freq: 2.6 },
  lecturer: { amp: 0.008, freq: 1.2 },
  employer: { amp: 0.01, freq: 1.8 },
  cooperative: { amp: 0.005, freq: 1.0 },
  ngo: { amp: 0.012, freq: 1.5 },
};

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function micro(role: RoleId) {
  return MICRO_LINES.find(m => m.role === role);
}

// ── NGO recognition prop — field satchel + handheld impact grid ───────────────

function NgoProp() {
  const gridGeo = useMemo(() => new THREE.BoxGeometry(0.05, 0.05, 0.015), []);
  return (
    <>
      {/* Cross-body satchel */}
      <mesh position={[0, 0.62, -0.04]} rotation={[0, 0, -0.6]}>
        <boxGeometry args={[0.04, 0.5, 0.04]} />
        <meshStandardMaterial color="#4a3f5c" roughness={0.8} />
      </mesh>
      <mesh position={[0.24, 0.36, 0.1]}>
        <boxGeometry args={[0.18, 0.22, 0.1]} />
        <meshStandardMaterial color="#4a3f5c" roughness={0.85} />
      </mesh>
      {/* Handheld 3×3 impact grid */}
      <group position={[-0.3, 0.62, 0.22]} rotation={[-0.3, 0.3, 0]}>
        <mesh>
          <boxGeometry args={[0.22, 0.22, 0.02]} />
          <meshStandardMaterial color="#1e252e" roughness={0.5} metalness={0.3} />
        </mesh>
        {Array.from({ length: 9 }, (_, i) => (
          <mesh
            key={i}
            geometry={gridGeo}
            position={[-0.06 + (i % 3) * 0.06, 0.06 - Math.floor(i / 3) * 0.06, 0.015]}
          >
            <meshStandardMaterial
              color="#7C6B9A"
              emissive="#7C6B9A"
              emissiveIntensity={i % 2 === 0 ? 0.3 : 0.1}
              roughness={0.4}
            />
          </mesh>
        ))}
      </group>
    </>
  );
}

// ── Micro-line bubble — no label, ≤8 words, 2.5s hold ─────────────────────────

function MicroBubble({ text, color }: { text: string; color: string }) {
  return (
    <Html position={[0, 1.75, 0]} center distanceFactor={9} style={{ pointerEvents: 'none' }}>
      <div
        style={{
          backgroundColor: 'rgba(13,16,20,0.94)',
          border: `1px solid ${color}55`,
          borderRadius: '4px',
          padding: '6px 10px',
          fontFamily: 'var(--font-ibm-plex-mono), monospace',
          fontSize: '10px',
          lineHeight: 1.5,
          color: '#c8c2ba',
          whiteSpace: 'nowrap',
          userSelect: 'none',
        }}
      >
        {text}
      </div>
    </Html>
  );
}

// ── Protagonist ───────────────────────────────────────────────────────────────

const scratchA = new THREE.Vector3();
const scratchB = new THREE.Vector3();
const liftPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const liftRay = new THREE.Raycaster();
const liftPoint = new THREE.Vector3();

let noticeFired = false;

function Protagonist({ role }: { role: Exclude<RoleId, 'admin'> }) {
  const groupRef = useRef<THREE.Group>(null);
  const staging = STAGING[role];
  const gait = GAITS[role];
  const def = ROLES[role];
  const myChapter = episodeChapterOf(role) ?? 1;
  const phase = useMemo(() => myChapter * 1.37, [myChapter]);

  const currentPos = useRef(new THREE.Vector3(...staging.arrival));
  const liftY = useRef(0);
  const rotY = useRef(0);
  const settledFired = useRef(false);
  const dwellMs = useRef(0);
  const asideUsed = useRef(false);
  const liftLineUsed = useRef(false);
  const [microText, setMicroText] = useState<string | null>(null);
  const microTimer = useRef<number | null>(null);
  const [active, setActive] = useState(false);

  function showMicro(text: string, holdMs = 2500) {
    setMicroText(text);
    if (microTimer.current !== null) window.clearTimeout(microTimer.current);
    microTimer.current = window.setTimeout(() => setMicroText(null), holdMs);
  }

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const store = useStoryworldV2.getState();
    const { chapter, chapterProgress, presence, lifted, reducedMotion } = store;
    const isSettled = store.world.settled.includes(role);
    const behavior = deriveBehavior(role, chapter, chapterProgress, isSettled);

    // Record settlement once the Story Clock passes the settle point (monotonic).
    if (!settledFired.current && !isSettled && behavior === 'resident' && chapter >= myChapter) {
      settledFired.current = true;
      store.settle(role);
    }

    // Dormant: a faint hint at the world's edge — geometry hidden.
    groupRef.current.visible = behavior !== 'dormant';
    if (behavior === 'dormant') return;

    const t = state.clock.getElapsedTime();

    // ── Lift override (§4.5) ──
    if (lifted === role) {
      liftRay.setFromCamera(state.pointer, state.camera);
      if (liftRay.ray.intersectPlane(liftPlane, liftPoint)) {
        scratchA.set(...staging.home);
        scratchB.copy(liftPoint).sub(scratchA);
        if (scratchB.length() > LIFT_CLAMP_RADIUS) {
          scratchB.setLength(LIFT_CLAMP_RADIUS);
        }
        scratchA.add(scratchB);
        currentPos.current.lerp(scratchA, Math.min(1, delta * 10));
      }
      liftY.current += (0.42 - liftY.current) * Math.min(1, delta * 8);
      groupRef.current.position.set(
        currentPos.current.x,
        liftY.current + Math.sin(t * 2.2) * 0.02,
        currentPos.current.z
      );
      groupRef.current.rotation.z = Math.sin(t * 1.8) * 0.06;
      return;
    }

    // Release spring — settle back to the ground with follow-through.
    if (liftY.current > 0.005) {
      liftY.current *= Math.exp(-delta * 7);
    }
    groupRef.current.rotation.z *= Math.exp(-delta * 6);

    // ── Target position per behavior ──
    if (behavior === 'arriving') {
      const k = easeInOut(Math.min(1, chapterProgress / 0.18));
      scratchA.set(...staging.arrival);
      scratchB.set(...staging.convoChar);
      scratchA.lerp(scratchB, k);
      if (!reducedMotion) {
        scratchA.y += Math.abs(Math.sin(t * gait.freq * Math.PI)) * gait.amp * 8 * (1 - k);
      }
    } else if (behavior === 'engaged') {
      scratchA.set(...staging.convoChar);
    } else if (behavior === 'settling') {
      const k = easeInOut(Math.min(1, (chapterProgress - 0.72) / 0.23));
      scratchA.set(...staging.convoChar);
      scratchB.set(...staging.home);
      scratchA.lerp(scratchB, k);
    } else {
      // Resident: the district work loop — a slow patrol with personality (§2.3).
      scratchA.set(...staging.home);
      if (!reducedMotion) {
        const drift = Math.sin(t * 0.12 * gait.freq + phase);
        scratchA.x += drift * 0.45;
        scratchA.z += Math.cos(t * 0.09 * gait.freq + phase) * 0.3;
      }
    }

    if (reducedMotion) {
      currentPos.current.set(scratchA.x, 0, scratchA.z);
    } else {
      currentPos.current.lerp(scratchA, Math.min(1, delta * 3));
    }
    groupRef.current.position.set(
      currentPos.current.x,
      liftY.current,
      currentPos.current.z
    );

    // ── AWARE overlay (§2.4): the world looks back ──
    let faceX: number;
    let faceZ: number;
    let aware = false;
    if (presence) {
      const dx = presence[0] - currentPos.current.x;
      const dz = presence[2] - currentPos.current.z;
      aware = dx * dx + dz * dz < AWARENESS_RADIUS * AWARENESS_RADIUS;
    }
    if (aware && presence) {
      faceX = presence[0];
      faceZ = presence[2];
      dwellMs.current += delta * 1000;
      if (!noticeFired) {
        noticeFired = true;
        store.firstInteraction('notice');
      }
      // After sustained attention, one aside per character per session.
      if (dwellMs.current > 2500 && !asideUsed.current && behavior !== 'engaged') {
        asideUsed.current = true;
        const aside = micro(role)?.asides[0];
        if (aside) showMicro(aside);
      }
    } else {
      dwellMs.current = 0;
      if (behavior === 'engaged') {
        faceX = staging.convoAdmin[0];
        faceZ = staging.convoAdmin[2];
      } else if (behavior === 'settling' || behavior === 'resident') {
        faceX = 0;
        faceZ = 0;
      } else {
        faceX = staging.convoChar[0];
        faceZ = staging.convoChar[2];
      }
    }
    const targetRot = Math.atan2(faceX - currentPos.current.x, faceZ - currentPos.current.z);
    let diff = targetRot - rotY.current;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    rotY.current += diff * Math.min(1, delta * (aware ? 4 : 2.5));
    groupRef.current.rotation.y = rotY.current;

    const shouldBeActive = aware || behavior === 'engaged';
    if (shouldBeActive !== active) setActive(shouldBeActive);
  });

  function handlePointerDown(e: ThreeEvent<PointerEvent>) {
    const store = useStoryworldV2.getState();
    const isSettled = store.world.settled.includes(role);
    const behavior = deriveBehavior(role, store.chapter, store.chapterProgress, isSettled);
    if (behavior !== 'resident' || store.tier >= 3 || store.reducedMotion) return;
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    store.setLifted(role);
    store.firstInteraction('lift');
    if (!liftLineUsed.current) {
      liftLineUsed.current = true;
      const m = micro(role);
      if (m) showMicro(m.lifted, 2800);
    }
  }

  function handlePointerUp(e: ThreeEvent<PointerEvent>) {
    if (useStoryworldV2.getState().lifted === role) {
      e.stopPropagation();
      useStoryworldV2.getState().setLifted(null);
    }
  }

  const propId = ROLE_TO_PROP[role];

  return (
    <>
      {/* Dormant hint — a small glow where this character will arrive (§5.2) */}
      <mesh position={[staging.arrival[0], 0.05, staging.arrival[2]]}>
        <sphereGeometry args={[0.07, 8, 6]} />
        <meshStandardMaterial
          color={def.color}
          emissive={def.color}
          emissiveIntensity={0.18}
          transparent
          opacity={0.6}
        />
      </mesh>

      <group
        ref={groupRef}
        position={staging.arrival}
        visible={false}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerOver={() => {
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = '';
        }}
      >
        <CharacterBase color={def.color} isActive={active} />
        {propId ? <CharacterProp characterId={propId} color={def.color} /> : <NgoProp />}
        {microText && <MicroBubble text={microText} color={def.color} />}
      </group>
    </>
  );
}

// ── The Administrator — the steward stays with the ledger (§3.8) ──────────────

export function Administrator() {
  const groupRef = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const currentPos = useRef(new THREE.Vector3(0, 0, 1.6));
  const rotY = useRef(0);
  const [microText, setMicroText] = useState<string | null>(null);
  const microTimer = useRef<number | null>(null);
  const pulse = useRef(0);

  useFrame(({ clock }, delta) => {
    if (!groupRef.current) return;
    const store = useStoryworldV2.getState();
    const { chapter, reducedMotion } = store;
    const t = clock.getElapsedTime();

    if (matRef.current) {
      matRef.current.emissiveIntensity =
        0.06 + Math.sin(t * (Math.PI / 2)) * 0.03 + pulse.current;
      pulse.current *= Math.exp(-delta * 3);
    }

    // Position: at the Ledger during prologue/finale (audit loop), at the active
    // episode's conversation point during chapters 1–7.
    const episodeRole = chapter >= 1 && chapter <= 7 ? EPISODE_ROLES[chapter - 1] : undefined;
    if (episodeRole) {
      scratchA.set(...STAGING[episodeRole].convoAdmin);
      scratchB.set(...STAGING[episodeRole].convoChar);
    } else {
      // The audit loop: a slow circle of the column, pausing near lanterns.
      const a = reducedMotion ? 0.6 : t * 0.1 + Math.sin(t * 0.05) * 0.8;
      scratchA.set(Math.cos(a) * 1.7, 0, Math.sin(a) * 1.7);
      scratchB.set(0, 0, 0);
    }
    currentPos.current.lerp(scratchA, reducedMotion ? 1 : Math.min(1, delta * 2.2));
    groupRef.current.position.copy(currentPos.current);

    // Face the interlocutor (or the column on the audit loop). During the
    // prologue's first beat, face the visitor's presence — the nod (§4.7).
    let fx = scratchB.x;
    let fz = scratchB.z;
    if (chapter === 0 && store.presence) {
      fx = store.presence[0];
      fz = store.presence[2];
    }
    const target = Math.atan2(fx - currentPos.current.x, fz - currentPos.current.z);
    let diff = target - rotY.current;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    rotY.current += diff * Math.min(1, delta * 2.5);
    groupRef.current.rotation.y = rotY.current;
  });

  function handlePointerDown(e: ThreeEvent<PointerEvent>) {
    e.stopPropagation();
    // The Administrator cannot be lifted (§4.5) — a polite refusal instead.
    pulse.current = 0.25;
    const m = micro('admin');
    if (m) {
      setMicroText(m.lifted);
      if (microTimer.current !== null) window.clearTimeout(microTimer.current);
      microTimer.current = window.setTimeout(() => setMicroText(null), 2800);
    }
  }

  return (
    <group ref={groupRef} position={[0, 0, 1.6]} onPointerDown={handlePointerDown}>
      <CharacterBase color="#2a3540" heightScale={1.2} />
      <mesh position={[0, 0.39, 0]}>
        <cylinderGeometry args={[0.23, 0.17, 0.79, 12]} />
        <meshStandardMaterial
          ref={matRef}
          color="#2a3540"
          emissive={ADMIN_EMISSIVE}
          emissiveIntensity={0.06}
          roughness={0.5}
          metalness={0.2}
          transparent
          opacity={0.35}
        />
      </mesh>
      <GuideProp color={ADMIN_EMISSIVE} />
      {/* The steward carries light — every conversation they attend is lit */}
      <pointLight position={[0, 1.9, 0]} color="#f2f0ec" intensity={1.2} distance={5} decay={2} />
      {microText && <MicroBubble text={microText} color={ADMIN_EMISSIVE} />}
    </group>
  );
}

export function CharacterSystem() {
  return (
    <>
      {EPISODE_ROLES.map(role => (
        <Protagonist key={role} role={role} />
      ))}
      <Administrator />
    </>
  );
}
