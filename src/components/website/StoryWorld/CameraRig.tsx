'use client';

import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useStoryworldStore } from '@/lib/storyworld/store';

// Camera starts at [0, 6, 12] and dollies to [0, 5.2, 7.5] across all 6 episodes
const START = new THREE.Vector3(0, 6, 12);
const END = new THREE.Vector3(0, 5.2, 7.5);
const LOOK_AT = new THREE.Vector3(0, 0.5, 0);
const tmp = new THREE.Vector3();

export function CameraRig() {
  const { camera } = useThree();
  const currentPosRef = useRef(START.clone());

  useFrame(() => {
    const { completedEpisodes, reducedMotion } = useStoryworldStore.getState();
    const t = completedEpisodes.length / 6; // 0 → 1 as episodes complete
    tmp.lerpVectors(START, END, t);

    if (reducedMotion) {
      camera.position.copy(START);
    } else {
      currentPosRef.current.lerp(tmp, 0.015);
      camera.position.copy(currentPosRef.current);
    }

    camera.lookAt(LOOK_AT);
  });

  return null;
}
