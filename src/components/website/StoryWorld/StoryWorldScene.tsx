'use client';

import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { SceneLighting } from './SceneLighting';
import { ThePlaza } from './ThePlaza';
import { TheArch } from './TheArch';
import { TheGuide } from './TheGuide';
import { EpisodeManager } from './EpisodeManager';
import { CameraRig } from './CameraRig';

export function StoryWorldScene() {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 6, 12], fov: 38 }}
      gl={{
        antialias: true,
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.15,
      }}
      frameloop="always"
      style={{ background: '#0d1014' }}
    >
      <fogExp2 attach="fog" args={['#0d1014', 0.055]} />

      <SceneLighting />
      <ThePlaza />
      <TheArch />
      <TheGuide />
      <EpisodeManager />
      <CameraRig />
    </Canvas>
  );
}
