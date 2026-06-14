'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CHARACTERS, COUNCIL_RING_POS } from '@/lib/storyworld/config';
import { useStoryworldStore } from '@/lib/storyworld/store';
import type { CharacterId } from '@/lib/storyworld/types';

const COUNCIL_IDS = Object.keys(CHARACTERS) as CharacterId[];

export function TheArch() {
  const outerRef = useRef<THREE.Mesh>(null);
  const middleRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const innerMatRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(() => {
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
    <group>
      {/* Dais — base platform */}
      <mesh position={[0, 0.03, 0]}>
        <cylinderGeometry args={[1.4, 1.5, 0.06, 48]} />
        <meshStandardMaterial color="#1a2128" roughness={0.9} metalness={0.1} />
      </mesh>

      {/* Outer ring */}
      <mesh ref={outerRef} position={[0, 0.8, 0]}>
        <torusGeometry args={[1.4, 0.025, 8, 80]} />
        <meshStandardMaterial
          color="#c8c2ba"
          emissive="#c8c2ba"
          emissiveIntensity={0.06}
          roughness={0.2}
          metalness={0.85}
        />
      </mesh>

      {/* Middle ring */}
      <mesh ref={middleRef} position={[0, 0.8, 0]}>
        <torusGeometry args={[0.9, 0.022, 8, 64]} />
        <meshStandardMaterial
          color="#8a8078"
          emissive="#8a8078"
          emissiveIntensity={0.05}
          roughness={0.35}
          metalness={0.7}
        />
      </mesh>

      {/* Inner ring — teal, glowing */}
      <mesh ref={innerRef} position={[0, 0.8, 0]}>
        <torusGeometry args={[0.45, 0.02, 8, 48]} />
        <meshStandardMaterial
          ref={innerMatRef}
          color="#2e7d78"
          emissive="#56a8a2"
          emissiveIntensity={0.4}
          roughness={0.0}
          metalness={1.0}
        />
      </mesh>

      {/* Council Ring strands — one per character */}
      {COUNCIL_IDS.map(id => (
        <CouncilStrand key={id} characterId={id} />
      ))}
    </group>
  );
}

function CouncilStrand({ characterId }: { characterId: CharacterId }) {
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const episodeMap: Record<CharacterId, number> = {
    C01: 0, C02: 1, C03: 2, C04: 3, C05: 4, C06: 5,
  };
  const episodeIndex = episodeMap[characterId];
  const pos = COUNCIL_RING_POS[characterId];
  const color = CHARACTERS[characterId].color;

  useFrame(() => {
    if (!matRef.current) return;
    const { completedEpisodes } = useStoryworldStore.getState();
    const isActive = completedEpisodes.includes(episodeIndex);
    const targetIntensity = isActive ? 0.7 : 0.0;
    matRef.current.emissiveIntensity +=
      (targetIntensity - matRef.current.emissiveIntensity) * 0.04;
  });

  return (
    <group position={[pos[0], 0, pos[2]]}>
      {/* Base disc */}
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.4, 0.42, 0.04, 24]} />
        <meshStandardMaterial color="#1a2128" roughness={0.9} metalness={0.2} />
      </mesh>
      {/* Light strand */}
      <mesh position={[0, 0.52, 0]}>
        <cylinderGeometry args={[0.018, 0.018, 1.0, 6]} />
        <meshStandardMaterial
          ref={matRef}
          color={color}
          emissive={color}
          emissiveIntensity={0.0}
          roughness={0.1}
          metalness={0.6}
          transparent
          opacity={0.9}
        />
      </mesh>
    </group>
  );
}
