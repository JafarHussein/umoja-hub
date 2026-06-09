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

  const bodyGeo = useMemo(() => new THREE.CylinderGeometry(0.22, 0.16, 0.78, 12), []);
  const headGeo = useMemo(() => new THREE.SphereGeometry(0.19, 12, 8), []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const targetEmissive = isActive ? 0.10 : 0.04;

    if (bodyMatRef.current) {
      bodyMatRef.current.emissiveIntensity +=
        (targetEmissive - bodyMatRef.current.emissiveIntensity) * 0.1;
    }
    if (headMatRef.current) {
      headMatRef.current.emissiveIntensity +=
        (targetEmissive - headMatRef.current.emissiveIntensity) * 0.1;
    }

    if (groupRef.current) {
      const breathe = 0.98 + Math.sin(t * 0.55 + breathOffset.current) * 0.01;
      groupRef.current.scale.y = (isActive ? 1.03 : 1.0) * breathe * heightScale;
      const s = isActive ? 1.03 : 1.0;
      groupRef.current.scale.x = s;
      groupRef.current.scale.z = s;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh geometry={bodyGeo} position={[0, 0.39, 0]}>
        <meshStandardMaterial
          ref={bodyMatRef}
          color={color}
          emissive={color}
          emissiveIntensity={0.04}
          roughness={0.65}
          metalness={0.05}
        />
      </mesh>
      <mesh geometry={headGeo} position={[0, 0.98, 0]} scale={[1, 0.85, 1]}>
        <meshStandardMaterial
          ref={headMatRef}
          color={color}
          emissive={color}
          emissiveIntensity={0.04}
          roughness={0.65}
          metalness={0.05}
        />
      </mesh>
    </group>
  );
}
