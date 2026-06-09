'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { DemoType } from '@/lib/storyworld/types';
import { CHARACTERS, CHARACTER_CONVO_POS, GUIDE_POS } from '@/lib/storyworld/config';
import type { CharacterId } from '@/lib/storyworld/types';

interface DemoParticlesProps {
  type: DemoType;
  characterId: CharacterId;
  active: boolean;
}

const ARCH_POS: [number, number, number] = [0, 0.8, 0];
const PARTICLE_COUNT = 6;

export function DemoParticles({ type, characterId, active }: DemoParticlesProps) {
  if (type === 'none' || type === 'portfolio-card') return null;

  const charColor = CHARACTERS[characterId].color;
  const charPos = CHARACTER_CONVO_POS[characterId];

  if (type === 'payment-flow') {
    return (
      <ParticleTrail
        from={[charPos[0], 0.8, charPos[2]]}
        via={ARCH_POS}
        to={[GUIDE_POS[0], 0.8, GUIDE_POS[2]]}
        color="#56a8a2"
        active={active}
      />
    );
  }

  if (type === 'trust-score') {
    // Particles orbit from character position upward
    return (
      <OrbitParticles
        center={[charPos[0], 0.8, charPos[2]]}
        color={charColor}
        active={active}
      />
    );
  }

  if (type === 'verification-chain') {
    // Chain from character through arch
    return (
      <ParticleTrail
        from={[charPos[0], 0.8, charPos[2]]}
        to={ARCH_POS}
        color="#56a8a2"
        active={active}
      />
    );
  }

  if (type === 'group-cluster') {
    return (
      <GroupCluster
        center={[charPos[0], 0.5, charPos[2]]}
        color={charColor}
        active={active}
      />
    );
  }

  return null;
}

// ── Particle Trail ───────────────────────────────────────────────────────────

interface TrailProps {
  from: [number, number, number];
  via?: [number, number, number];
  to: [number, number, number];
  color: string;
  active: boolean;
}

function ParticleTrail({ from, via, to, color, active }: TrailProps) {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const fromV = useMemo(() => new THREE.Vector3(...from), [from]);
  const toV = useMemo(() => new THREE.Vector3(...to), [to]);
  const viaV = useMemo(() => via ? new THREE.Vector3(...via) : null, [via]);
  const tmp = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ clock }) => {
    if (!active) {
      refs.current.forEach(m => { if (m) (m.material as THREE.MeshBasicMaterial).opacity = 0; });
      return;
    }
    const t = clock.getElapsedTime();
    refs.current.forEach((m, i) => {
      if (!m) return;
      const offset = i / PARTICLE_COUNT;
      const p = ((t * 0.4 + offset) % 1);
      if (viaV) {
        // Two-segment path: from → via → to
        if (p < 0.5) {
          tmp.lerpVectors(fromV, viaV, p * 2);
        } else {
          tmp.lerpVectors(viaV, toV, (p - 0.5) * 2);
        }
      } else {
        tmp.lerpVectors(fromV, toV, p);
      }
      m.position.copy(tmp);
      (m.material as THREE.MeshBasicMaterial).opacity = Math.sin(p * Math.PI) * 0.85;
    });
  });

  return (
    <>
      {Array.from({ length: PARTICLE_COUNT }, (_, i) => (
        <mesh key={i} ref={el => { refs.current[i] = el; }}>
          <sphereGeometry args={[0.045, 6, 6]} />
          <meshBasicMaterial color={color} transparent opacity={0} />
        </mesh>
      ))}
    </>
  );
}

// ── Orbit Particles (Trust Score visualization) ───────────────────────────────

function OrbitParticles({ center, color, active }: {
  center: [number, number, number];
  color: string;
  active: boolean;
}) {
  const refs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    refs.current.forEach((m, i) => {
      if (!m) return;
      if (!active) {
        (m.material as THREE.MeshBasicMaterial).opacity = 0;
        return;
      }
      const angle = t * 1.2 + (i / PARTICLE_COUNT) * Math.PI * 2;
      const radius = 0.55 + Math.sin(t * 0.5 + i) * 0.08;
      m.position.set(
        center[0] + Math.cos(angle) * radius,
        center[1] + Math.sin(t * 0.8 + i * 0.5) * 0.15,
        center[2] + Math.sin(angle) * radius
      );
      (m.material as THREE.MeshBasicMaterial).opacity = active ? 0.7 : 0;
    });
  });

  return (
    <>
      {Array.from({ length: PARTICLE_COUNT }, (_, i) => (
        <mesh key={i} ref={el => { refs.current[i] = el; }}>
          <sphereGeometry args={[0.04, 6, 6]} />
          <meshBasicMaterial color={color} transparent opacity={0} />
        </mesh>
      ))}
    </>
  );
}

// ── Group Cluster (Cooperative visualization) ─────────────────────────────────

function GroupCluster({ center, color, active }: {
  center: [number, number, number];
  color: string;
  active: boolean;
}) {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const CLUSTER_COUNT = 14;

  const offsets = useMemo(
    () => Array.from({ length: CLUSTER_COUNT }, (_, i) => ({
      angle: (i / CLUSTER_COUNT) * Math.PI * 2,
      r: 0.4 + (i % 3) * 0.15,
    })),
    []
  );

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    refs.current.forEach((m, i) => {
      if (!m) return;
      if (!active) {
        (m.material as THREE.MeshBasicMaterial).opacity = 0;
        return;
      }
      const o = offsets[i];
      if (!o) return;
      const wobble = Math.sin(t * 0.6 + i * 0.8) * 0.05;
      m.position.set(
        center[0] + Math.cos(o.angle + t * 0.2) * (o.r + wobble),
        center[1] + 0.05 * i,
        center[2] + Math.sin(o.angle + t * 0.2) * (o.r + wobble)
      );
      (m.material as THREE.MeshBasicMaterial).opacity = 0.65;
    });
  });

  return (
    <>
      {Array.from({ length: CLUSTER_COUNT }, (_, i) => (
        <mesh key={i} ref={el => { refs.current[i] = el; }}>
          <sphereGeometry args={[0.035, 6, 6]} />
          <meshBasicMaterial color={color} transparent opacity={0} />
        </mesh>
      ))}
    </>
  );
}
