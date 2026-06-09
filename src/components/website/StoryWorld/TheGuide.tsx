'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CharacterBase } from './CharacterBase';
import { GuideProp } from './CharacterProp';
import { GUIDE_POS, GUIDE_COLOR, GUIDE_EMISSIVE } from '@/lib/storyworld/config';
import { useStoryworldStore } from '@/lib/storyworld/store';

const BASE_POS = new THREE.Vector3(...GUIDE_POS);

export function TheGuide() {
  const groupRef = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current || !matRef.current) return;

    // Faint teal emissive pulse — 4s cycle
    const t = clock.getElapsedTime();
    matRef.current.emissiveIntensity = 0.06 + Math.sin(t * (Math.PI / 2)) * 0.03;

    // The Guide always faces the current episode's active character
    const { episodeIndex } = useStoryworldStore.getState();
    if (episodeIndex >= 0) {
      // Lean slightly toward the active episode direction
      const targetRotY = episodeIndex % 2 === 0 ? -0.15 : 0.15;
      groupRef.current.rotation.y += (targetRotY - groupRef.current.rotation.y) * 0.02;
    }

    groupRef.current.position.copy(BASE_POS);
  });

  return (
    <group ref={groupRef} position={GUIDE_POS}>
      <CharacterBase color={GUIDE_COLOR} heightScale={1.2} />

      {/* Guide's distinguishing glow material overlaid — the teal pulse that marks them */}
      <mesh position={[0, 0.39, 0]}>
        <cylinderGeometry args={[0.23, 0.17, 0.79, 12]} />
        <meshStandardMaterial
          ref={matRef}
          color={GUIDE_COLOR}
          emissive={GUIDE_EMISSIVE}
          emissiveIntensity={0.06}
          roughness={0.5}
          metalness={0.2}
          transparent
          opacity={0.0}
        />
      </mesh>

      {/* Orbiting verification ring — the Guide's prop */}
      <GuideProp color={GUIDE_EMISSIVE} />
    </group>
  );
}
