'use client';

import { useMemo } from 'react';
import * as THREE from 'three';

export function ThePlaza() {
  // Meridian line inlays — 8 lines radiating from center
  const meridianGeo = useMemo(() => {
    const points: number[] = [];
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      points.push(0, 0.001, 0);
      points.push(Math.cos(angle) * 13, 0.001, Math.sin(angle) * 13);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(points), 3));
    return geo;
  }, []);

  return (
    <group>
      {/* Ground disc */}
      <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[14, 80]} />
        <meshStandardMaterial color="#0f1218" roughness={1.0} metalness={0.0} />
      </mesh>

      {/* Meridian inlays — barely visible geometric lines */}
      <lineSegments geometry={meridianGeo}>
        <lineBasicMaterial color="#1e252e" transparent opacity={0.7} />
      </lineSegments>
    </group>
  );
}
