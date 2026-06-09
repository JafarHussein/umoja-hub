'use client';

import { useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { useStoryworldV2 } from '@/lib/storyworld/v2/store';
import { WorldGround } from './WorldGround';
import { CameraRigV2 } from './CameraRigV2';
import { TheLedger } from './TheLedger';
import { Districts } from './Districts';
import { CharacterSystem } from './Characters';
import { ConversationLayer } from './ConversationLayer';
import { InteractionLayer } from './InteractionLayer';
import { Filaments } from './Filaments';

// Adaptive quality manager (§13.3): rolling FPS window, one-way sheds.
function AdaptiveQuality() {
  const frames = useRef(0);
  const windowStart = useRef(0);
  const demotions = useRef(0);

  useFrame(({ clock }) => {
    frames.current++;
    const t = clock.getElapsedTime();
    if (windowStart.current === 0) windowStart.current = t;
    if (t - windowStart.current >= 2) {
      const fps = frames.current / (t - windowStart.current);
      frames.current = 0;
      windowStart.current = t;
      if (fps < 48 && demotions.current < 2) {
        demotions.current++;
        useStoryworldV2.getState().demoteTier();
      }
    }
  });

  return null;
}

function SceneLightingV2() {
  return (
    <>
      <ambientLight intensity={0.32} color="#f2f0ec" />
      <directionalLight position={[4, 9, 3]} intensity={0.95} color="#f2f0ec" />
      <directionalLight position={[-6, 5, -4]} intensity={0.3} color="#8a919a" />
      <directionalLight position={[0, 3, -9]} intensity={0.35} color="#2e7d78" />
    </>
  );
}

export function SceneV2() {
  const tier = useStoryworldV2(s => s.tier);

  return (
    <Canvas
      dpr={tier === 1 ? [1, 1.5] : tier === 2 ? [1, 1.25] : [1, 1]}
      camera={{ position: [0, 7.5, 19], fov: 42 }}
      gl={{
        antialias: tier < 3,
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.45,
      }}
      frameloop="always"
      style={{ background: '#0d1014', touchAction: 'pan-y' }}
    >
      <fogExp2 attach="fog" args={['#0d1014', 0.038]} />

      <SceneLightingV2 />
      <WorldGround />
      <TheLedger />
      <Districts />
      <CharacterSystem />
      <Filaments />
      <InteractionLayer />
      <ConversationLayer />
      <CameraRigV2 />
      <AdaptiveQuality />
    </Canvas>
  );
}
