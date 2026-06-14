'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { DISTRICTS, ROLES } from '@/lib/storyworld/v2/config';
import { useStoryworldV2 } from '@/lib/storyworld/v2/store';
import type { DistrictId, RoleId } from '@/lib/storyworld/v2/types';

// Connection filaments (§3.9): every settled district extends a persistent curve
// to the Ledger; record pulses travel it. Couriers (Resolved Decision 2) carry
// crates along the ground — visible proof the connections move real traffic.

function filamentCurve(district: Exclude<DistrictId, 'ledger'>) {
  const c = DISTRICTS[district].center;
  return new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(c[0], 0.25, c[2]),
    new THREE.Vector3(c[0] * 0.45, 2.4, c[2] * 0.45),
    new THREE.Vector3(0, 2.9, 0)
  );
}

function Filament({ role, index }: { role: Exclude<RoleId, 'admin'>; index: number }) {
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const pulseRef = useRef<THREE.Mesh>(null);
  const district = ROLES[role].district as Exclude<DistrictId, 'ledger'>;
  const color = ROLES[role].color;

  const { geometry, curve } = useMemo(() => {
    const c = filamentCurve(district);
    return { geometry: new THREE.TubeGeometry(c, 28, 0.012, 5, false), curve: c };
  }, [district]);

  useFrame(({ clock }, delta) => {
    if (matRef.current && matRef.current.opacity < 0.5) {
      matRef.current.opacity = Math.min(0.5, matRef.current.opacity + delta * 0.3);
    }
    const { tier, reducedMotion } = useStoryworldV2.getState();
    if (pulseRef.current) {
      const showPulse = tier < 3 && !reducedMotion;
      pulseRef.current.visible = showPulse;
      if (showPulse) {
        const t = (clock.getElapsedTime() * 0.1 + index * 0.37) % 1;
        pulseRef.current.position.copy(curve.getPoint(t));
      }
    }
  });

  return (
    <group>
      <mesh geometry={geometry}>
        <meshStandardMaterial
          ref={matRef}
          color={color}
          emissive={color}
          emissiveIntensity={0.4}
          roughness={0.3}
          metalness={0.4}
          transparent
          opacity={0}
        />
      </mesh>
      <mesh ref={pulseRef} visible={false}>
        <sphereGeometry args={[0.05, 8, 6]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.9}
          roughness={0.1}
        />
      </mesh>
    </group>
  );
}

// ── Couriers — un-named figures walking record traffic along the ground ───────

function Courier({ role, index }: { role: Exclude<RoleId, 'admin'>; index: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const district = ROLES[role].district as Exclude<DistrictId, 'ledger'>;

  const { from, to } = useMemo(() => {
    const c = DISTRICTS[district].center;
    const f = new THREE.Vector3(c[0], 0, c[2]);
    const dir = f.clone().normalize();
    return { from: f.clone().sub(dir.clone().multiplyScalar(0.8)), to: dir.multiplyScalar(2.6) };
  }, [district]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const { reducedMotion } = useStoryworldV2.getState();
    const raw = (clock.getElapsedTime() * 0.055 + index * 0.5) % 1;
    // Triangle wave: walk in, walk back. Frozen mid-route under reduced motion.
    const t = reducedMotion ? 0.5 : raw < 0.5 ? raw * 2 : (1 - raw) * 2;
    groupRef.current.position.lerpVectors(from, to, t);
    if (!reducedMotion) {
      groupRef.current.position.y = Math.abs(Math.sin(clock.getElapsedTime() * 3 + index)) * 0.03;
      const dir = raw < 0.5 ? 1 : -1;
      groupRef.current.rotation.y = Math.atan2(
        (to.x - from.x) * dir,
        (to.z - from.z) * dir
      );
    }
  });

  return (
    <group ref={groupRef}>
      {/* Simplified two-piece figure, ~70% scale — purposefully un-named (§2.5) */}
      <mesh position={[0, 0.26, 0]}>
        <cylinderGeometry args={[0.14, 0.11, 0.52, 8]} />
        <meshStandardMaterial color="#39414a" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.62, 0]}>
        <sphereGeometry args={[0.12, 8, 6]} />
        <meshStandardMaterial color="#39414a" roughness={0.75} />
      </mesh>
      {/* The crate they carry */}
      <mesh position={[0, 0.42, 0.18]}>
        <boxGeometry args={[0.18, 0.14, 0.14]} />
        <meshStandardMaterial color="#3a3128" roughness={0.85} />
      </mesh>
    </group>
  );
}

export function Filaments() {
  const settled = useStoryworldV2(s => s.world.settled);
  const tier = useStoryworldV2(s => s.tier);

  const settledRoles = settled.filter((r): r is Exclude<RoleId, 'admin'> => r !== 'admin');
  const courierCount = tier === 1 ? 4 : tier === 2 ? 2 : 0;
  const courierRoles = settledRoles.slice(-courierCount);

  return (
    <>
      {settledRoles.map((role, i) => (
        <Filament key={role} role={role} index={i} />
      ))}
      {courierRoles.map((role, i) => (
        <Courier key={`courier-${role}`} role={role} index={i} />
      ))}
    </>
  );
}
