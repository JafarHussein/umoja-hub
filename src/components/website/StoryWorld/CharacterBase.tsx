'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface CharacterBaseProps {
  color: string;
  isActive?: boolean;
  /** Height scale — Guide is slightly taller (1.2) */
  heightScale?: number;
}

export function CharacterBase({ color, isActive = false, heightScale = 1.0 }: CharacterBaseProps) {
  const groupRef = useRef<THREE.Group>(null);
  const bodyMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const headMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const breathOffset = useRef(Math.random() * Math.PI * 2);

  // Torso slightly slimmer at waist to suggest a more human silhouette
  const torsoGeo = useMemo(() => new THREE.CylinderGeometry(0.205, 0.155, 0.74, 12), []);
  // Neck bridges the gap between torso top (y≈0.74) and head sphere bottom (y≈0.80)
  const neckGeo = useMemo(() => new THREE.CylinderGeometry(0.068, 0.072, 0.13, 8), []);
  // Head — slightly oblate, not a perfect sphere
  const headGeo = useMemo(() => new THREE.SphereGeometry(0.195, 12, 8), []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const targetEmissive = isActive ? 0.12 : 0.04;

    if (bodyMatRef.current) {
      bodyMatRef.current.emissiveIntensity +=
        (targetEmissive - bodyMatRef.current.emissiveIntensity) * 0.1;
    }
    if (headMatRef.current) {
      headMatRef.current.emissiveIntensity +=
        (targetEmissive - headMatRef.current.emissiveIntensity) * 0.1;
    }

    if (groupRef.current) {
      // Breathing: subtle vertical scale oscillation, reduced when in conversation
      const breathAmp = isActive ? 0.008 : 0.005;
      const breathe = 1.0 + Math.sin(t * 0.58 + breathOffset.current) * breathAmp;
      groupRef.current.scale.y = breathe * heightScale;
      // Slight lateral sway complement to breathing
      groupRef.current.scale.x = isActive ? 1.025 : 1.0;
      groupRef.current.scale.z = isActive ? 1.025 : 1.0;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Torso — bottom at y=0 (ground), top at y≈0.74 */}
      <mesh geometry={torsoGeo} position={[0, 0.37, 0]}>
        <meshStandardMaterial
          ref={bodyMatRef}
          color={color}
          emissive={color}
          emissiveIntensity={0.04}
          roughness={0.68}
          metalness={0.04}
        />
      </mesh>

      {/* Neck — y=0.74 to y=0.87 */}
      <mesh geometry={neckGeo} position={[0, 0.805, 0]}>
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.03}
          roughness={0.65}
          metalness={0.0}
        />
      </mesh>

      {/* Head — center y=0.98, oblate (wider than tall) */}
      <mesh geometry={headGeo} position={[0, 0.98, 0]} scale={[1.0, 0.86, 0.92]}>
        <meshStandardMaterial
          ref={headMatRef}
          color={color}
          emissive={color}
          emissiveIntensity={0.04}
          roughness={0.62}
          metalness={0.04}
        />
      </mesh>
    </group>
  );
}
