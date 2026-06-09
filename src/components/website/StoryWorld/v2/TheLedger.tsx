'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ADMIN_EMISSIVE, DISCOVERY_COLOR, ROLES } from '@/lib/storyworld/v2/config';
import { constellationEarned } from '@/lib/storyworld/v2/simulation';
import { useStoryworldV2 } from '@/lib/storyworld/v2/store';
import type { LedgerRecord } from '@/lib/storyworld/v2/types';

// The Ledger (§1.4): a working structure. Every world event writes a permanent
// record ring that drops from the crown and stacks onto the column. The crown keeps
// V1's proven three-ring motion language (identity / evidence / verification).

const RING_BASE_Y = 0.22;
const RING_SPACING = 0.05;
const DROP_FROM_Y = 3.05;
const DROP_SECONDS = 0.9;

function recordColor(r: LedgerRecord): string {
  if (r.kind === 'discovery') return DISCOVERY_COLOR;
  return ROLES[r.role].color;
}

function RecordRing({ record, index }: { record: LedgerRecord; index: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const t = useRef(0);
  const targetY = RING_BASE_Y + index * RING_SPACING;
  const color = recordColor(record);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const { reducedMotion } = useStoryworldV2.getState();
    if (reducedMotion) {
      meshRef.current.position.y = targetY;
      return;
    }
    if (t.current < 1) {
      t.current = Math.min(1, t.current + delta / DROP_SECONDS);
      // power3.in drop with a back.out seat at the end (§7.2 ring-write curve).
      const p = t.current;
      const drop = p * p * p;
      const overshoot = p > 0.85 ? Math.sin((p - 0.85) / 0.15 * Math.PI) * 0.03 : 0;
      meshRef.current.position.y =
        DROP_FROM_Y - (DROP_FROM_Y - targetY) * drop - overshoot;
    } else {
      meshRef.current.position.y = targetY;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, DROP_FROM_Y, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[0.56, 0.014, 6, 40]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.55}
        roughness={0.2}
        metalness={0.7}
      />
    </mesh>
  );
}

function CrownRings() {
  const outerRef = useRef<THREE.Mesh>(null);
  const middleRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (useStoryworldV2.getState().reducedMotion) return;
    if (outerRef.current) outerRef.current.rotation.y += 0.004;
    if (middleRef.current) {
      middleRef.current.rotation.y -= 0.006;
      middleRef.current.rotation.x += 0.001;
    }
    if (innerRef.current) {
      innerRef.current.rotation.y += 0.009;
      innerRef.current.rotation.x += 0.001;
    }
  });

  return (
    <group position={[0, 3.45, 0]}>
      <mesh ref={outerRef}>
        <torusGeometry args={[1.0, 0.022, 8, 64]} />
        <meshStandardMaterial
          color="#c8c2ba"
          emissive="#c8c2ba"
          emissiveIntensity={0.06}
          roughness={0.2}
          metalness={0.85}
        />
      </mesh>
      <mesh ref={middleRef}>
        <torusGeometry args={[0.66, 0.02, 8, 56]} />
        <meshStandardMaterial
          color="#8a8078"
          emissive="#8a8078"
          emissiveIntensity={0.05}
          roughness={0.35}
          metalness={0.7}
        />
      </mesh>
      <mesh ref={innerRef}>
        <torusGeometry args={[0.36, 0.018, 8, 44]} />
        <meshStandardMaterial
          color="#2e7d78"
          emissive={ADMIN_EMISSIVE}
          emissiveIntensity={0.4}
          roughness={0.0}
          metalness={1.0}
        />
      </mesh>
    </group>
  );
}

function AuditLanterns() {
  const lanternRefs = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const angles = useMemo(() => [0.6, 2.2, 3.8, 5.4], []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const { reducedMotion } = useStoryworldV2.getState();
    lanternRefs.current.forEach((mat, i) => {
      if (!mat) return;
      mat.emissiveIntensity = reducedMotion
        ? 0.3
        : 0.22 + Math.sin(t * 0.5 + i * 1.7) * 0.14;
    });
  });

  return (
    <>
      {angles.map((a, i) => (
        <group key={a} position={[Math.cos(a) * 1.9, 0, Math.sin(a) * 1.9]}>
          <mesh position={[0, 0.3, 0]}>
            <cylinderGeometry args={[0.02, 0.025, 0.6, 6]} />
            <meshStandardMaterial color="#1a2128" roughness={0.8} metalness={0.3} />
          </mesh>
          <mesh position={[0, 0.66, 0]}>
            <sphereGeometry args={[0.06, 10, 8]} />
            <meshStandardMaterial
              ref={el => {
                lanternRefs.current[i] = el;
              }}
              color="#2e7d78"
              emissive={ADMIN_EMISSIVE}
              emissiveIntensity={0.22}
              roughness={0.2}
              metalness={0.4}
            />
          </mesh>
        </group>
      ))}
    </>
  );
}

function Constellation() {
  const groupRef = useRef<THREE.Group>(null);
  const rise = useRef(0);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const { world, chapter, reducedMotion } = useStoryworldV2.getState();
    const earned = constellationEarned(world) && chapter === 8;
    groupRef.current.visible = earned || rise.current > 0.01;
    if (!groupRef.current.visible) return;
    const target = earned ? 1 : 0;
    rise.current += (target - rise.current) * Math.min(1, delta * (reducedMotion ? 60 : 0.8));
    groupRef.current.position.y = 3.6 + rise.current * 1.8;
    if (!reducedMotion) groupRef.current.rotation.y += delta * 0.05;
  });

  return (
    <group ref={groupRef} visible={false}>
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 1.4, 0, Math.sin(a) * 1.4]}>
            <sphereGeometry args={[0.045, 8, 6]} />
            <meshStandardMaterial
              color={DISCOVERY_COLOR}
              emissive={DISCOVERY_COLOR}
              emissiveIntensity={0.9}
              roughness={0.1}
              metalness={0.3}
            />
          </mesh>
        );
      })}
    </group>
  );
}

export function TheLedger() {
  const records = useStoryworldV2(s => s.world.records);

  return (
    <group>
      {/* Dais */}
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[2.3, 2.45, 0.08, 48]} />
        <meshStandardMaterial color="#1a2128" roughness={0.9} metalness={0.1} />
      </mesh>

      {/* The column */}
      <mesh position={[0, 1.7, 0]}>
        <cylinderGeometry args={[0.5, 0.55, 3.3, 24]} />
        <meshStandardMaterial color="#161d24" roughness={0.55} metalness={0.45} />
      </mesh>

      <CrownRings />
      <AuditLanterns />
      <Constellation />

      {/* Registry plinth — the only place a human name appears (Resolved Decision 1) */}
      <mesh position={[1.6, 0.3, 0.8]}>
        <boxGeometry args={[0.4, 0.6, 0.3]} />
        <meshStandardMaterial color="#1e252e" roughness={0.7} metalness={0.25} />
      </mesh>

      {/* The session's record rings — the world remembers (§1.4) */}
      {records.map((r, i) => (
        <RecordRing key={r.id} record={r} index={i} />
      ))}

      {/* Soft heart light that grows with the record count */}
      <pointLight
        position={[0, 2.2, 0]}
        color={ADMIN_EMISSIVE}
        intensity={0.5 + Math.min(1.2, records.length * 0.035)}
        distance={9}
        decay={2}
      />
    </group>
  );
}
