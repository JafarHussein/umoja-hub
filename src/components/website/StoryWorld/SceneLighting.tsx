'use client';

import { CHARACTERS, COUNCIL_RING_POS } from '@/lib/storyworld/config';

export function SceneLighting() {
  return (
    <>
      {/* Key — everything lit by the platform, from The Arch direction */}
      <directionalLight position={[0, 6, 3]} intensity={0.85} color="#f2f0ec" />
      {/* Fill — no character in full shadow */}
      <directionalLight position={[-5, 4, -3]} intensity={0.18} color="#8a919a" />
      {/* Rim — teal, separates characters from dark bg */}
      <directionalLight position={[0, -1, -7]} intensity={0.32} color="#2e7d78" />
      <ambientLight intensity={0.15} color="#f2f0ec" />

      {/* Per-character point lights at council ring positions */}
      {(Object.keys(CHARACTERS) as (keyof typeof CHARACTERS)[]).map(id => (
        <pointLight
          key={id}
          position={COUNCIL_RING_POS[id]}
          intensity={0.35}
          color={CHARACTERS[id].color}
          distance={4}
          decay={2}
        />
      ))}
    </>
  );
}
