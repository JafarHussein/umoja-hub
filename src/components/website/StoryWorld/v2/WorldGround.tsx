'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { ORBIT_MAX, PATH_POINTS } from '@/lib/storyworld/v2/config';
import { useStoryworldV2 } from '@/lib/storyworld/v2/store';

// The world disc, the Path inlay, the visitor presence (§4.2), and drag-orbit (§4.3).

const ORBIT_SENSITIVITY = 0.0024;

export function WorldGround() {
  const dragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartOrbit = useRef(0);
  const orbitTurned = useRef(false);
  const presenceLightRef = useRef<THREE.PointLight>(null);
  const lastPresence = useRef<[number, number, number] | null>(null);

  const pathGeometry = useMemo(() => {
    const points = PATH_POINTS.map(p => new THREE.Vector3(...p));
    const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.4);
    return new THREE.TubeGeometry(curve, 200, 0.05, 6, false);
  }, []);

  useFrame((state, delta) => {
    const store = useStoryworldV2.getState();
    // Spring the orbit back to neutral when not dragging.
    if (!dragging.current && Math.abs(store.orbit) > 0.0005) {
      store.setOrbit(store.orbit * Math.exp(-delta * 5));
    }
    // The presence light trails the pointer position softly.
    if (presenceLightRef.current && store.presence) {
      presenceLightRef.current.position.set(
        store.presence[0],
        0.35,
        store.presence[2]
      );
      presenceLightRef.current.intensity +=
        (0.55 - presenceLightRef.current.intensity) * Math.min(1, delta * 6);
    } else if (presenceLightRef.current) {
      presenceLightRef.current.intensity *= Math.exp(-delta * 4);
    }
  });

  function handlePointerMove(e: ThreeEvent<PointerEvent>) {
    const store = useStoryworldV2.getState();
    // Presence follows the pointer on the ground unless a character is being lifted.
    if (!store.lifted) {
      const prev = lastPresence.current;
      const moved =
        !prev ||
        Math.abs(prev[0] - e.point.x) > 0.05 ||
        Math.abs(prev[2] - e.point.z) > 0.05;
      if (moved) {
        const p: [number, number, number] = [e.point.x, 0, e.point.z];
        lastPresence.current = p;
        store.setPresence(p);
      }
    }
    if (dragging.current) {
      const dx = e.nativeEvent.clientX - dragStartX.current;
      const next = THREE.MathUtils.clamp(
        dragStartOrbit.current + dx * ORBIT_SENSITIVITY,
        -ORBIT_MAX,
        ORBIT_MAX
      );
      store.setOrbit(next);
      if (!orbitTurned.current && Math.abs(dx) > 24) {
        orbitTurned.current = true;
        store.firstInteraction('turn');
      }
    }
  }

  function handlePointerDown(e: ThreeEvent<PointerEvent>) {
    dragging.current = true;
    dragStartX.current = e.nativeEvent.clientX;
    dragStartOrbit.current = useStoryworldV2.getState().orbit;
  }

  function endDrag() {
    dragging.current = false;
  }

  return (
    <group>
      {/* Ground disc */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        onPointerUp={endDrag}
        onPointerLeave={() => {
          endDrag();
          lastPresence.current = null;
          useStoryworldV2.getState().setPresence(null);
        }}
      >
        <circleGeometry args={[17, 64]} />
        <meshStandardMaterial color="#0f1218" roughness={0.95} metalness={0.05} />
      </mesh>

      {/* The Path — a faint luminous inlay spiraling inward (§1.2) */}
      <mesh geometry={pathGeometry}>
        <meshStandardMaterial
          color="#1e252e"
          emissive="#2a4a48"
          emissiveIntensity={0.22}
          roughness={0.6}
          metalness={0.2}
        />
      </mesh>

      {/* The visitor presence — attention, made visible (§4.2) */}
      <pointLight
        ref={presenceLightRef}
        color="#c8c2ba"
        intensity={0}
        distance={2.6}
        decay={2}
        position={[0, 0.35, 0]}
      />
    </group>
  );
}
