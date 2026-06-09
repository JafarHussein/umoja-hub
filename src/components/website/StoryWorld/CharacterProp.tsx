'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { CharacterId } from '@/lib/storyworld/types';

interface PropProps { color: string }

function FarmerProp({ color }: PropProps) {
  return (
    <mesh position={[0.38, 0.55, 0.12]} rotation={[0.1, -0.3, 0.05]}>
      <boxGeometry args={[0.28, 0.38, 0.02]} />
      <meshStandardMaterial color={color} roughness={0.5} metalness={0.1} transparent opacity={0.85} />
    </mesh>
  );
}

function BuyerProp({ color }: PropProps) {
  return (
    <mesh position={[-0.38, 0.55, 0.12]} rotation={[0.1, 0.3, -0.05]}>
      <boxGeometry args={[0.24, 0.34, 0.015]} />
      <meshStandardMaterial color={color} roughness={0.4} metalness={0.2} transparent opacity={0.85} />
    </mesh>
  );
}

function StudentProp({ color }: PropProps) {
  return (
    <group position={[0.32, 0.62, 0.0]}>
      {([
        { p: [0, 0, 0] as [number, number, number], r: [0, -0.2, 0.1] as [number, number, number], o: 0.9 },
        { p: [0.09, 0.04, 0.025] as [number, number, number], r: [0, -0.1, 0.05] as [number, number, number], o: 0.75 },
        { p: [0.18, 0.08, 0.05] as [number, number, number], r: [0, 0, 0] as [number, number, number], o: 0.6 },
      ]).map((d, i) => (
        <mesh key={i} position={d.p} rotation={d.r}>
          <boxGeometry args={[0.12, 0.15, 0.02]} />
          <meshStandardMaterial color={color} roughness={0.5} metalness={0.1} transparent opacity={d.o} />
        </mesh>
      ))}
    </group>
  );
}

function LecturerProp({ color }: PropProps) {
  return (
    <mesh position={[0, 0.78, 0.38]} rotation={[0.3, 0, 0]}>
      <cylinderGeometry args={[0.14, 0.14, 0.03, 6]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} roughness={0.3} metalness={0.5} />
    </mesh>
  );
}

function EmployerProp({ color }: PropProps) {
  return (
    <mesh position={[-0.32, 0.78, 0.22]} rotation={[0, 0.25, 0]}>
      <boxGeometry args={[0.18, 0.48, 0.02]} />
      <meshStandardMaterial color={color} roughness={0.4} metalness={0.15} transparent opacity={0.8} />
    </mesh>
  );
}

function CooperativeProp({ color }: PropProps) {
  const geo = useMemo(() => {
    const pts = new Float32Array([
      0, 0, 0,   0.14, 0.1, 0,
      0, 0, 0,  -0.14, 0.1, 0,
      0, 0, 0,   0, -0.13, 0,
      0.14, 0.1, 0,  0.22, 0.2, 0,
      -0.14, 0.1, 0, -0.22, 0.2, 0,
    ]);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pts, 3));
    return g;
  }, []);

  const nodes: [number, number, number][] = [
    [0, 0, 0], [0.14, 0.1, 0], [-0.14, 0.1, 0], [0, -0.13, 0], [0.22, 0.2, 0],
  ];

  return (
    <group position={[0.32, 0.62, 0.2]}>
      <lineSegments geometry={geo}>
        <lineBasicMaterial color={color} />
      </lineSegments>
      {nodes.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.024, 6, 6]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
        </mesh>
      ))}
    </group>
  );
}

// Admin prop (used by TheGuide — orbiting ring)
export function GuideProp({ color }: PropProps) {
  const ringRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ringRef.current) {
      ringRef.current.rotation.z = clock.getElapsedTime() * 0.65;
      ringRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.28) * 0.25;
    }
  });
  return (
    <mesh ref={ringRef} position={[0, 1.1, 0]}>
      <torusGeometry args={[0.3, 0.015, 6, 48]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} roughness={0.1} metalness={0.9} />
    </mesh>
  );
}

export function CharacterProp({ characterId, color }: { characterId: CharacterId; color: string }) {
  switch (characterId) {
    case 'C01': return <FarmerProp color={color} />;
    case 'C02': return <BuyerProp color={color} />;
    case 'C03': return <StudentProp color={color} />;
    case 'C04': return <LecturerProp color={color} />;
    case 'C05': return <EmployerProp color={color} />;
    case 'C06': return <CooperativeProp color={color} />;
  }
}
