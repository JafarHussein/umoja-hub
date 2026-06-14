'use client';

import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { CAMERA_KEYFRAMES } from '@/lib/storyworld/v2/config';
import { useStoryworldV2 } from '@/lib/storyworld/v2/store';

// Path-following camera (§1.2): scroll walks the spiral; drag-orbit adds a bounded
// lateral offset around the current look point; reduced motion snaps between viewpoints.

const targetPos = new THREE.Vector3();
const targetLook = new THREE.Vector3();
const currentLook = new THREE.Vector3(0, 1.4, 0);
const offsetV = new THREE.Vector3();

function smoothstep(t: number) {
  return t * t * (3 - 2 * t);
}

function sampleKeyframes(progress: number, pos: THREE.Vector3, look: THREE.Vector3) {
  const frames = CAMERA_KEYFRAMES;
  let i = 0;
  while (i < frames.length - 1 && (frames[i + 1]?.at ?? Infinity) <= progress) i++;
  const a = frames[i];
  const b = frames[Math.min(i + 1, frames.length - 1)] ?? a;
  if (!a || !b) return;
  const span = Math.max(1e-6, b.at - a.at);
  const t = smoothstep(THREE.MathUtils.clamp((progress - a.at) / span, 0, 1));
  pos.set(
    THREE.MathUtils.lerp(a.pos[0], b.pos[0], t),
    THREE.MathUtils.lerp(a.pos[1], b.pos[1], t),
    THREE.MathUtils.lerp(a.pos[2], b.pos[2], t)
  );
  look.set(
    THREE.MathUtils.lerp(a.look[0], b.look[0], t),
    THREE.MathUtils.lerp(a.look[1], b.look[1], t),
    THREE.MathUtils.lerp(a.look[2], b.look[2], t)
  );
}

export function CameraRigV2() {
  const { camera } = useThree();
  const initialized = useRef(false);

  useFrame((_, delta) => {
    const { scrollProgress, orbit, reducedMotion } = useStoryworldV2.getState();
    sampleKeyframes(scrollProgress, targetPos, targetLook);

    // Apply the drag-orbit: rotate the camera position around the look point (Y axis).
    if (Math.abs(orbit) > 0.0005) {
      offsetV.copy(targetPos).sub(targetLook);
      offsetV.applyAxisAngle(THREE.Object3D.DEFAULT_UP, orbit);
      targetPos.copy(targetLook).add(offsetV);
    }

    if (reducedMotion || !initialized.current) {
      camera.position.copy(targetPos);
      currentLook.copy(targetLook);
      initialized.current = true;
    } else {
      // The ScrollTrigger scrub already smooths scroll input — this damping only
      // irons out keyframe corners. Keep it fast or the camera feels rubber-banded.
      const k = 1 - Math.exp(-delta * 7);
      camera.position.lerp(targetPos, k);
      currentLook.lerp(targetLook, k);
    }
    camera.lookAt(currentLook);
  });

  return null;
}
