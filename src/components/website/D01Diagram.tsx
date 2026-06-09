'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

const COPPER = '#b86a3d';
const TEAL = '#2e7d78';
const SPINE_COLOR = '#c8c2ba';
const RING_EMIT = '#56a8a2';

// Slowly orbits the camera around Y axis
function OrbitCamera() {
  useFrame(({ camera, clock }) => {
    const t = clock.getElapsedTime() * 0.12;
    camera.position.set(Math.sin(t) * 8, 2.8, Math.cos(t) * 8);
    camera.lookAt(0, 0, 0);
  });
  return null;
}

// Central verification spine — vertical column with glowing decision rings
function Spine() {
  const matRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(({ clock }) => {
    if (matRef.current) {
      matRef.current.emissiveIntensity = 0.18 + Math.sin(clock.getElapsedTime() * 1.3) * 0.07;
    }
  });

  return (
    <group>
      <mesh>
        <cylinderGeometry args={[0.055, 0.055, 4.2, 12]} />
        <meshStandardMaterial
          ref={matRef}
          color={SPINE_COLOR}
          emissive={SPINE_COLOR}
          emissiveIntensity={0.18}
          roughness={0.2}
          metalness={0.85}
        />
      </mesh>
      {/* Three decision-point rings — human anchors */}
      {([-1.4, 0, 1.4] as number[]).map(y => (
        <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.24, 0.028, 8, 32]} />
          <meshStandardMaterial
            color="#878078"
            emissive={RING_EMIT}
            emissiveIntensity={0.6}
            roughness={0.1}
            metalness={0.9}
          />
        </mesh>
      ))}
    </group>
  );
}

// Hub node: flat box + three orbiting satellite spheres representing sub-components
function Hub({ position, color, satellites }: {
  position: [number, number, number];
  color: string;
  satellites: number;
}) {
  const satRefs = useRef<(THREE.Mesh | null)[]>([]);
  const dir = position[0] < 0 ? 1 : -1;

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * 0.35;
    satRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const angle = t * dir + (i / satellites) * Math.PI * 2;
      mesh.position.set(Math.cos(angle) * 0.6, 0, Math.sin(angle) * 0.6);
    });
  });

  return (
    <Float speed={0.8} floatIntensity={0.35} rotationIntensity={0}>
      <group position={position}>
        <mesh>
          <boxGeometry args={[1.15, 0.3, 0.3]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.3}
            roughness={0.25}
            metalness={0.65}
          />
        </mesh>
        {Array.from({ length: satellites }, (_, i) => (
          <mesh key={i} ref={el => { satRefs.current[i] = el; }}>
            <sphereGeometry args={[0.085, 8, 8]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={0.55}
              roughness={0.15}
              metalness={0.75}
            />
          </mesh>
        ))}
      </group>
    </Float>
  );
}

// Connection beam between a hub and the spine origin
function Beam({ start, end, color }: {
  start: [number, number, number];
  end: [number, number, number];
  color: string;
}) {
  const midX = (start[0] + end[0]) / 2;
  const length = Math.abs(start[0] - end[0]);
  return (
    <mesh position={[midX, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[0.018, 0.018, length, 6]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.25}
        transparent
        opacity={0.35}
        roughness={0.5}
        metalness={0.5}
      />
    </mesh>
  );
}

// Particles flowing from a hub to the spine — represents data/documents in transit
function DataParticles({ from, to, color, count, speed }: {
  from: [number, number, number];
  to: [number, number, number];
  color: string;
  count: number;
  speed: number;
}) {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const fromVec = useMemo(() => new THREE.Vector3(...from), [from]);
  const toVec = useMemo(() => new THREE.Vector3(...to), [to]);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const offsets = useMemo(() => Array.from({ length: count }, (_, i) => i / count), [count]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    offsets.forEach((offset, i) => {
      const mesh = refs.current[i];
      if (!mesh) return;
      const p = (t * speed + offset) % 1;
      tmp.lerpVectors(fromVec, toVec, p);
      mesh.position.copy(tmp);
      (mesh.material as THREE.MeshBasicMaterial).opacity = Math.sin(p * Math.PI) * 0.9;
    });
  });

  return (
    <>
      {offsets.map((_, i) => (
        <mesh key={i} ref={el => { refs.current[i] = el; }}>
          <sphereGeometry args={[0.048, 6, 6]} />
          <meshBasicMaterial color={color} transparent opacity={0} />
        </mesh>
      ))}
    </>
  );
}

export function D01Diagram() {
  const foodPos: [number, number, number] = [-3.3, 0, 0];
  const eduPos: [number, number, number] = [3.3, 0, 0];
  const origin: [number, number, number] = [0, 0, 0];

  return (
    <div className="w-full h-[400px] bg-[#131619] rounded-[2px] overflow-hidden">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 2.8, 8], fov: 40 }}
        gl={{ antialias: true, powerPreference: 'low-power' }}
      >
        <OrbitCamera />
        <fog attach="fog" args={['#131619', 12, 22]} />

        <ambientLight intensity={0.25} />
        <directionalLight position={[0, 6, 4]} intensity={0.4} color="#f2f0ec" />
        <pointLight position={foodPos} intensity={2.5} color={COPPER} distance={5.5} decay={2} />
        <pointLight position={eduPos} intensity={2.5} color={TEAL} distance={5.5} decay={2} />
        <pointLight position={[0, 2, 0]} intensity={0.6} color={SPINE_COLOR} distance={4} decay={2} />

        <Spine />
        <Hub position={foodPos} color={COPPER} satellites={3} />
        <Hub position={eduPos} color={TEAL} satellites={3} />
        <Beam start={foodPos} end={origin} color={COPPER} />
        <Beam start={eduPos} end={origin} color={TEAL} />
        <DataParticles from={foodPos} to={origin} color={COPPER} count={5} speed={0.22} />
        <DataParticles from={eduPos} to={origin} color={TEAL} count={5} speed={0.22} />
      </Canvas>
    </div>
  );
}
