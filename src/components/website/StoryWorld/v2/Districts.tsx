'use client';

import { useMemo, useRef } from 'react';
import type { ComponentType } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { DISTRICTS, ROLES } from '@/lib/storyworld/v2/config';
import { useStoryworldV2 } from '@/lib/storyworld/v2/store';
import type { ConsequenceId, DistrictId, RoleId } from '@/lib/storyworld/v2/types';

// District kits (§3). Every kit has a working loop on the World Clock and reacts to
// fired consequences. All ambient motion is phase-offset (§7.4 anti-loop rule).

const STONE = '#1a2128';
const PANEL = '#1e252e';
const WOOD = '#3a3128';

type Mat = THREE.MeshStandardMaterial | null;

function fired(id: ConsequenceId): boolean {
  return useStoryworldV2.getState().world.consequencesFired.includes(id);
}

function settled(role: RoleId): boolean {
  return useStoryworldV2.getState().world.settled.includes(role);
}

function approach(mat: Mat, target: number, delta: number, speed = 3) {
  if (!mat) return;
  mat.emissiveIntensity += (target - mat.emissiveIntensity) * Math.min(1, delta * speed);
}

// ─── The Fields (Farmer) ──────────────────────────────────────────────────────

function FieldsKit() {
  const shrubRefs = useRef<(THREE.Mesh | null)[]>([]);
  const lampMat = useRef<Mat>(null);
  const phases = useMemo(
    () => Array.from({ length: 8 }, (_, i) => i * 1.31 + 0.4),
    []
  );

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();
    const rm = useStoryworldV2.getState().reducedMotion;
    shrubRefs.current.forEach((m, i) => {
      if (!m) return;
      const s = rm ? 1 : 1 + Math.sin(t * 0.45 + (phases[i] ?? 0)) * 0.07;
      m.scale.setScalar(s);
    });
    // Stall lamp: dark → escrow demonstrated → resident at work.
    const target = fired('escrow-flow') ? (settled('farmer') ? 0.7 : 0.4) : 0.05;
    approach(lampMat.current, target, delta);
  });

  return (
    <group>
      {/* Crop rows — two rows of four */}
      {Array.from({ length: 8 }, (_, i) => {
        const row = Math.floor(i / 4);
        const col = i % 4;
        return (
          <mesh
            key={i}
            ref={el => {
              shrubRefs.current[i] = el;
            }}
            position={[-1.1 + col * 0.7, 0.16, 0.7 + row * 0.6]}
          >
            <icosahedronGeometry args={[0.16, 0]} />
            <meshStandardMaterial color="#2a3d1e" roughness={0.9} />
          </mesh>
        );
      })}
      {/* Weighing scale */}
      <group position={[1.4, 0, 0.6]}>
        <mesh position={[0, 0.35, 0]}>
          <cylinderGeometry args={[0.03, 0.04, 0.7, 6]} />
          <meshStandardMaterial color={STONE} roughness={0.7} metalness={0.4} />
        </mesh>
        <mesh position={[0, 0.7, 0]}>
          <boxGeometry args={[0.55, 0.03, 0.08]} />
          <meshStandardMaterial color={STONE} roughness={0.6} metalness={0.5} />
        </mesh>
        <mesh position={[-0.24, 0.58, 0]}>
          <cylinderGeometry args={[0.09, 0.07, 0.04, 8]} />
          <meshStandardMaterial color="#8a8078" roughness={0.5} metalness={0.6} />
        </mesh>
        <mesh position={[0.24, 0.62, 0]}>
          <cylinderGeometry args={[0.09, 0.07, 0.04, 8]} />
          <meshStandardMaterial color="#8a8078" roughness={0.5} metalness={0.6} />
        </mesh>
      </group>
      {/* Harvest crates */}
      {[
        [-1.2, 0.2, -0.9],
        [-0.7, 0.2, -1.1],
        [-0.95, 0.55, -1.0],
      ].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]}>
          <boxGeometry args={[0.4, 0.35, 0.4]} />
          <meshStandardMaterial color={WOOD} roughness={0.85} />
        </mesh>
      ))}
      {/* Market stall */}
      <group position={[0.3, 0, -1.4]}>
        {[
          [-0.5, 0.45, -0.3],
          [0.5, 0.45, -0.3],
          [-0.5, 0.45, 0.3],
          [0.5, 0.45, 0.3],
        ].map((p, i) => (
          <mesh key={i} position={p as [number, number, number]}>
            <cylinderGeometry args={[0.03, 0.03, 0.9, 6]} />
            <meshStandardMaterial color={WOOD} roughness={0.85} />
          </mesh>
        ))}
        <mesh position={[0, 0.95, 0]}>
          <boxGeometry args={[1.2, 0.05, 0.8]} />
          <meshStandardMaterial color="#4a3f30" roughness={0.8} />
        </mesh>
        <mesh position={[0, 1.08, 0]}>
          <sphereGeometry args={[0.06, 10, 8]} />
          <meshStandardMaterial
            ref={el => {
              lampMat.current = el;
            }}
            color="#8B5E3C"
            emissive="#c89a6a"
            emissiveIntensity={0.05}
            roughness={0.3}
          />
        </mesh>
      </group>
    </group>
  );
}

// ─── The Depot (Buyer) ────────────────────────────────────────────────────────

function DepotKit() {
  const produceRefs = useRef<(THREE.Mesh | null)[]>([]);
  const tileMats = useRef<Mat[]>([]);
  const phases = useMemo(() => [0.7, 2.9, 4.6], []);

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();
    const rm = useStoryworldV2.getState().reducedMotion;
    produceRefs.current.forEach((m, i) => {
      if (!m || rm) return;
      const phase = phases[i] ?? 0;
      m.rotation.y = t * 0.3 + phase;
      m.position.y = 0.78 + Math.sin(t * 0.5 + phase) * 0.03;
    });
    // Comparison board: tile 0 = the Farmer's Trust Score entry. It appears with
    // buyer-verification (Ep1) and increments — brightens — in Ep2 (§3.2 continuity).
    const t0 = fired('trust-score-increment') ? 0.85 : fired('buyer-verification') ? 0.4 : 0.04;
    approach(tileMats.current[0] ?? null, t0, delta);
    for (let i = 1; i < 6; i++) {
      approach(tileMats.current[i] ?? null, settled('buyer') ? 0.18 : 0.04, delta);
    }
  });

  return (
    <group>
      {/* Evaluation benches */}
      {[
        [-0.9, 0.25, 0.7],
        [0.6, 0.25, 1.0],
      ].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]}>
          <boxGeometry args={[1.1, 0.5, 0.45]} />
          <meshStandardMaterial color={STONE} roughness={0.8} metalness={0.15} />
        </mesh>
      ))}
      {/* Sample plinths with rotating produce forms */}
      {(
        [
          [1.2, 0.4],
          [0.5, -0.6],
          [-1.4, -0.3],
        ] as [number, number][]
      ).map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 0.3, 0]}>
            <cylinderGeometry args={[0.16, 0.18, 0.6, 10]} />
            <meshStandardMaterial color={PANEL} roughness={0.7} metalness={0.2} />
          </mesh>
          <mesh
            ref={el => {
              produceRefs.current[i] = el;
            }}
            position={[0, 0.78, 0]}
          >
            <dodecahedronGeometry args={[0.13, 0]} />
            <meshStandardMaterial color="#c0392b" roughness={0.65} />
          </mesh>
        </group>
      ))}
      {/* Comparison board — six entry tiles */}
      <group position={[-1.1, 0, -1.1]} rotation={[0, 0.5, 0]}>
        <mesh position={[0, 0.9, 0]}>
          <boxGeometry args={[1.4, 1.0, 0.06]} />
          <meshStandardMaterial color={PANEL} roughness={0.6} metalness={0.3} />
        </mesh>
        {Array.from({ length: 6 }, (_, i) => (
          <mesh
            key={i}
            position={[-0.4 + (i % 3) * 0.4, 1.05 - Math.floor(i / 3) * 0.35, 0.04]}
          >
            <planeGeometry args={[0.3, 0.22]} />
            <meshStandardMaterial
              ref={el => {
                tileMats.current[i] = el;
              }}
              color="#22282f"
              emissive="#8B5E3C"
              emissiveIntensity={0.04}
              roughness={0.5}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// ─── The Studio (Student) ─────────────────────────────────────────────────────

function StudioKit() {
  const cubeRef = useRef<THREE.Mesh>(null);
  const cubeMat = useRef<Mat>(null);
  const spineMats = useRef<Mat[]>([]);

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();
    const rm = useStoryworldV2.getState().reducedMotion;
    // The work loop: a draft rises from the bench, turns, and — once reviewed —
    // holds a sealed edge glow (hash-sealed).
    if (cubeRef.current && !rm) {
      const cycle = (t * 0.18) % 1;
      cubeRef.current.position.y = 0.62 + Math.sin(cycle * Math.PI) * 0.35;
      cubeRef.current.rotation.y = t * 0.4;
      cubeRef.current.rotation.x = Math.sin(t * 0.3) * 0.2;
    }
    approach(cubeMat.current, fired('hash-sealed') ? 0.5 : 0.08, delta);
    // Portfolio spine gains lines as the episode's consequences land.
    approach(spineMats.current[0] ?? null, fired('portfolio-docked') ? 0.7 : 0.04, delta);
    approach(spineMats.current[1] ?? null, fired('hash-sealed') ? 0.7 : 0.04, delta);
    approach(spineMats.current[2] ?? null, fired('review-on-record') ? 0.7 : 0.04, delta);
  });

  return (
    <group>
      {/* Workbench */}
      <mesh position={[0.6, 0.4, 0.5]}>
        <boxGeometry args={[1.2, 0.08, 0.7]} />
        <meshStandardMaterial color={WOOD} roughness={0.8} />
      </mesh>
      {[
        [0.15, 0.2, 0.25],
        [1.05, 0.2, 0.25],
        [0.15, 0.2, 0.75],
        [1.05, 0.2, 0.75],
      ].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]}>
          <cylinderGeometry args={[0.03, 0.03, 0.4, 6]} />
          <meshStandardMaterial color={STONE} roughness={0.7} />
        </mesh>
      ))}
      {/* Drafts — two docked, one alive */}
      <mesh position={[0.35, 0.55, 0.45]} rotation={[0, 0.4, 0]}>
        <boxGeometry args={[0.2, 0.2, 0.2]} />
        <meshStandardMaterial color="#1e3a5f" roughness={0.7} />
      </mesh>
      <mesh position={[0.85, 0.55, 0.6]} rotation={[0, -0.3, 0]}>
        <boxGeometry args={[0.2, 0.2, 0.2]} />
        <meshStandardMaterial color="#1e3a5f" roughness={0.7} />
      </mesh>
      <mesh ref={cubeRef} position={[0.6, 0.62, 0.3]}>
        <boxGeometry args={[0.22, 0.22, 0.22]} />
        <meshStandardMaterial
          ref={el => {
            cubeMat.current = el;
          }}
          color="#2a4a72"
          emissive="#5B7FA6"
          emissiveIntensity={0.08}
          roughness={0.5}
        />
      </mesh>
      {/* Prototype shelf */}
      <group position={[-1.0, 0, -0.8]} rotation={[0, 0.6, 0]}>
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[1.0, 0.04, 0.3]} />
          <meshStandardMaterial color={WOOD} roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.95, 0]}>
          <boxGeometry args={[1.0, 0.04, 0.3]} />
          <meshStandardMaterial color={WOOD} roughness={0.8} />
        </mesh>
      </group>
      {/* Portfolio spine — gains an emissive line per landed consequence */}
      <group position={[0.2, 0, -1.3]}>
        <mesh position={[0, 0.9, 0]}>
          <boxGeometry args={[0.12, 1.8, 0.12]} />
          <meshStandardMaterial color={PANEL} roughness={0.5} metalness={0.4} />
        </mesh>
        {[0.6, 0.95, 1.3].map((y, i) => (
          <mesh key={i} position={[0, y, 0.07]}>
            <planeGeometry args={[0.09, 0.05]} />
            <meshStandardMaterial
              ref={el => {
                spineMats.current[i] = el;
              }}
              color="#22282f"
              emissive="#5B7FA6"
              emissiveIntensity={0.04}
              roughness={0.4}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// ─── The Review Chamber (Lecturer) ────────────────────────────────────────────

function ReviewChamberKit() {
  const formRef = useRef<THREE.Mesh>(null);
  const hexMats = useRef<Mat[]>([]);

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();
    const rm = useStoryworldV2.getState().reducedMotion;
    // A submission slides along the rail toward the lectern, repeating.
    if (formRef.current && !rm) {
      const cycle = (t * 0.1) % 1;
      formRef.current.position.x = -0.7 + cycle * 1.2;
      formRef.current.position.y = 0.62 + Math.sin(cycle * Math.PI) * 0.04;
    }
    // Credential wall: hexagons light as judgment goes on record.
    const litCount = (fired('review-queue') ? 1 : 0) + (fired('review-on-record') ? 2 : 0);
    hexMats.current.forEach((m, i) => {
      const base = i < litCount ? 0.6 : settled('lecturer') && i < litCount + 2 ? 0.18 : 0.04;
      approach(m, base, delta);
    });
  });

  return (
    <group>
      {/* Lectern */}
      <group position={[0.7, 0, 0.5]}>
        <mesh position={[0, 0.45, 0]}>
          <cylinderGeometry args={[0.05, 0.08, 0.9, 6]} />
          <meshStandardMaterial color={STONE} roughness={0.7} metalness={0.3} />
        </mesh>
        <mesh position={[0, 0.95, 0]} rotation={[-0.4, 0, 0]}>
          <boxGeometry args={[0.5, 0.04, 0.4]} />
          <meshStandardMaterial color={WOOD} roughness={0.7} />
        </mesh>
      </group>
      {/* Queue rail with a traveling submission form */}
      <group position={[-0.4, 0, 1.0]}>
        <mesh position={[0, 0.55, 0]}>
          <boxGeometry args={[1.6, 0.03, 0.05]} />
          <meshStandardMaterial color={PANEL} roughness={0.5} metalness={0.5} />
        </mesh>
        <mesh ref={formRef} position={[-0.7, 0.62, 0]}>
          <planeGeometry args={[0.18, 0.24]} />
          <meshStandardMaterial color="#d4cfc4" roughness={0.8} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[-0.5, 0.62, -0.02]}>
          <planeGeometry args={[0.18, 0.24]} />
          <meshStandardMaterial color="#b8b2a6" roughness={0.8} side={THREE.DoubleSide} />
        </mesh>
      </group>
      {/* Credential wall */}
      <group position={[-0.2, 0, -1.2]} rotation={[0, 0.15, 0]}>
        <mesh position={[0, 0.85, 0]}>
          <boxGeometry args={[1.5, 1.1, 0.06]} />
          <meshStandardMaterial color={PANEL} roughness={0.6} metalness={0.3} />
        </mesh>
        {Array.from({ length: 8 }, (_, i) => (
          <mesh
            key={i}
            position={[-0.5 + (i % 4) * 0.33, 1.05 - Math.floor(i / 4) * 0.4, 0.045]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry args={[0.09, 0.09, 0.02, 6]} />
            <meshStandardMaterial
              ref={el => {
                hexMats.current[i] = el;
              }}
              color="#22282f"
              emissive="#6B7280"
              emissiveIntensity={0.04}
              roughness={0.4}
              metalness={0.3}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// ─── The Bureau (Employer) ────────────────────────────────────────────────────

function BureauKit() {
  const tileMats = useRef<Mat[]>([]);
  const slotMats = useRef<Mat[]>([]);
  const scanIndex = useRef(0);

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();
    const rm = useStoryworldV2.getState().reducedMotion;
    // The scan loop: one wall tile at a time brightens under evaluation.
    if (!rm) scanIndex.current = Math.floor(t * 0.4) % 9;
    tileMats.current.forEach((m, i) => {
      // Tile 4 (center) is the Student's docked project — chosen in Ep5 (§3.5).
      const isChainTile = i === 4 && fired('chain-unfolded');
      const isScanned = settled('employer') && i === scanIndex.current;
      approach(m, isChainTile ? 0.7 : isScanned ? 0.3 : 0.04, delta);
    });
    approach(slotMats.current[0] ?? null, fired('dual-review') ? 0.65 : 0.04, delta);
    for (let i = 1; i < 3; i++) approach(slotMats.current[i] ?? null, 0.04, delta);
  });

  return (
    <group>
      {/* Portfolio wall — 3×3 entry tiles */}
      <group position={[0.4, 0, -1.1]} rotation={[0, -0.2, 0]}>
        <mesh position={[0, 1.0, 0]}>
          <boxGeometry args={[1.7, 1.3, 0.06]} />
          <meshStandardMaterial color={PANEL} roughness={0.6} metalness={0.3} />
        </mesh>
        {Array.from({ length: 9 }, (_, i) => (
          <mesh
            key={i}
            position={[-0.5 + (i % 3) * 0.5, 1.38 - Math.floor(i / 3) * 0.38, 0.045]}
          >
            <planeGeometry args={[0.36, 0.26]} />
            <meshStandardMaterial
              ref={el => {
                tileMats.current[i] = el;
              }}
              color="#22282f"
              emissive="#5B7FA6"
              emissiveIntensity={0.04}
              roughness={0.5}
            />
          </mesh>
        ))}
      </group>
      {/* Shortlist rail — three elevated slots */}
      <group position={[-1.0, 0, 0.6]} rotation={[0, 0.7, 0]}>
        <mesh position={[0, 0.75, 0]}>
          <boxGeometry args={[1.2, 0.03, 0.05]} />
          <meshStandardMaterial color={PANEL} roughness={0.5} metalness={0.5} />
        </mesh>
        {[-0.4, 0, 0.4].map((x, i) => (
          <mesh key={i} position={[x, 0.85, 0]}>
            <planeGeometry args={[0.24, 0.17]} />
            <meshStandardMaterial
              ref={el => {
                slotMats.current[i] = el;
              }}
              color="#22282f"
              emissive="#374151"
              emissiveIntensity={0.04}
              roughness={0.5}
              side={THREE.DoubleSide}
            />
          </mesh>
        ))}
      </group>
      {/* Interview table */}
      <mesh position={[0.7, 0.35, 0.8]}>
        <cylinderGeometry args={[0.5, 0.5, 0.06, 16]} />
        <meshStandardMaterial color={STONE} roughness={0.7} metalness={0.2} />
      </mesh>
      <mesh position={[0.7, 0.17, 0.8]}>
        <cylinderGeometry args={[0.06, 0.09, 0.3, 8]} />
        <meshStandardMaterial color={STONE} roughness={0.7} metalness={0.3} />
      </mesh>
    </group>
  );
}

// ─── The Circle (Cooperative) ─────────────────────────────────────────────────

function CircleKit() {
  const seatMats = useRef<Mat[]>([]);
  const formRef = useRef<THREE.Mesh>(null);
  const slabMat = useRef<Mat>(null);

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();
    const rm = useStoryworldV2.getState().reducedMotion;
    const isSettled = settled('cooperative');
    // Seats illuminate in drifting clusters before settlement; all hold after (§3.6).
    seatMats.current.forEach((m, i) => {
      const clusterLit = !rm && Math.sin(t * 0.3 + i * 0.45) > 0.55;
      approach(m, isSettled ? 0.35 : clusterLit ? 0.2 : 0.03, delta, 2);
    });
    // The consolidated group-order form floats above the ledger stone.
    if (formRef.current) {
      formRef.current.visible = fired('group-order');
      if (!rm) {
        formRef.current.position.y = 1.0 + Math.sin(t * 0.7) * 0.06;
        formRef.current.rotation.y = t * 0.2;
      }
    }
    approach(slabMat.current, fired('methodology-published') ? 0.55 : 0.05, delta);
  });

  return (
    <group>
      {/* Fourteen member seats */}
      {Array.from({ length: 14 }, (_, i) => {
        const a = (i / 14) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 1.5, 0.07, Math.sin(a) * 1.5]}>
            <cylinderGeometry args={[0.14, 0.16, 0.14, 10]} />
            <meshStandardMaterial
              ref={el => {
                seatMats.current[i] = el;
              }}
              color={STONE}
              emissive="#5C7A4A"
              emissiveIntensity={0.03}
              roughness={0.8}
            />
          </mesh>
        );
      })}
      {/* The shared ledger stone */}
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[0.6, 0.6, 0.6]} />
        <meshStandardMaterial color={STONE} roughness={0.75} metalness={0.2} />
      </mesh>
      {/* Consolidated group-order form (visible after the consequence fires) */}
      <mesh ref={formRef} position={[0, 1.0, 0]} visible={false}>
        <planeGeometry args={[0.4, 0.3]} />
        <meshStandardMaterial
          color="#d4cfc4"
          emissive="#5C7A4A"
          emissiveIntensity={0.4}
          roughness={0.6}
          side={THREE.DoubleSide}
          transparent
          opacity={0.9}
        />
      </mesh>
      {/* Methodology slab — published, readable, leaning at the rim */}
      <mesh position={[-1.3, 0.35, -0.6]} rotation={[0, 0.8, -0.15]}>
        <boxGeometry args={[0.5, 0.7, 0.05]} />
        <meshStandardMaterial
          ref={el => {
            slabMat.current = el;
          }}
          color={PANEL}
          emissive="#5C7A4A"
          emissiveIntensity={0.05}
          roughness={0.6}
        />
      </mesh>
    </group>
  );
}

// ─── The Field Station (NGO) ──────────────────────────────────────────────────

function FieldStationKit() {
  const gridMats = useRef<Mat[]>([]);
  const markerMats = useRef<Mat[]>([]);
  const sheetMat = useRef<Mat>(null);

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();
    const rm = useStoryworldV2.getState().reducedMotion;
    const streaming = fired('impact-stream');
    // Survey markers pulse in sequence — data collection.
    markerMats.current.forEach((m, i) => {
      const pulse = !rm && (Math.floor(t * 0.8) % 4) === i;
      approach(m, pulse ? 0.6 : 0.08, delta, 4);
    });
    // The grid reorganizes: cells light in a sweep, stronger once streaming.
    gridMats.current.forEach((m, i) => {
      const sweep = !rm && Math.sin(t * 0.9 - i * 0.5) > 0.6;
      approach(m, sweep ? (streaming ? 0.7 : 0.25) : streaming ? 0.15 : 0.04, delta, 4);
    });
    approach(sheetMat.current, fired('audit-logged') ? 0.5 : 0.04, delta);
  });

  return (
    <group>
      {/* The impact grid instrument */}
      <group position={[0.2, 0, -0.9]}>
        <mesh position={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.04, 0.06, 1.0, 6]} />
          <meshStandardMaterial color={STONE} roughness={0.7} metalness={0.3} />
        </mesh>
        <mesh position={[0, 1.15, 0]}>
          <boxGeometry args={[0.75, 0.75, 0.05]} />
          <meshStandardMaterial color={PANEL} roughness={0.6} metalness={0.3} />
        </mesh>
        {Array.from({ length: 9 }, (_, i) => (
          <mesh
            key={i}
            position={[-0.22 + (i % 3) * 0.22, 1.37 - Math.floor(i / 3) * 0.22, 0.035]}
          >
            <planeGeometry args={[0.16, 0.16]} />
            <meshStandardMaterial
              ref={el => {
                gridMats.current[i] = el;
              }}
              color="#22282f"
              emissive="#7C6B9A"
              emissiveIntensity={0.04}
              roughness={0.5}
            />
          </mesh>
        ))}
      </group>
      {/* Survey markers in an arc */}
      {Array.from({ length: 4 }, (_, i) => {
        const a = -0.5 + i * 0.55;
        return (
          <group key={i} position={[Math.cos(a) * 1.4, 0, Math.sin(a) * 1.4 + 0.3]}>
            <mesh position={[0, 0.25, 0]}>
              <cylinderGeometry args={[0.015, 0.02, 0.5, 5]} />
              <meshStandardMaterial color={STONE} roughness={0.8} />
            </mesh>
            <mesh position={[0, 0.53, 0]}>
              <sphereGeometry args={[0.04, 8, 6]} />
              <meshStandardMaterial
                ref={el => {
                  markerMats.current[i] = el;
                }}
                color="#7C6B9A"
                emissive="#7C6B9A"
                emissiveIntensity={0.08}
                roughness={0.3}
              />
            </mesh>
          </group>
        );
      })}
      {/* Report stack */}
      <group position={[-1.2, 0, 0.5]}>
        {[0.04, 0.1, 0.16].map((y, i) => (
          <mesh key={i} position={[0, y, 0]} rotation={[0, i * 0.18, 0]}>
            <boxGeometry args={[0.4, 0.05, 0.3]} />
            <meshStandardMaterial
              {...(i === 2
                ? {
                    ref: (el: THREE.MeshStandardMaterial | null) => {
                      sheetMat.current = el;
                    },
                  }
                : {})}
              color="#b8b2a6"
              emissive="#7C6B9A"
              emissiveIntensity={i === 2 ? 0.04 : 0}
              roughness={0.8}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// ─── District wrapper — threshold inlay + settled light + kit ─────────────────

const KITS: Record<Exclude<DistrictId, 'ledger'>, ComponentType> = {
  fields: FieldsKit,
  depot: DepotKit,
  studio: StudioKit,
  'review-chamber': ReviewChamberKit,
  bureau: BureauKit,
  circle: CircleKit,
  'field-station': FieldStationKit,
};

function District({ id }: { id: Exclude<DistrictId, 'ledger'> }) {
  const def = DISTRICTS[id];
  const role = (Object.values(ROLES).find(r => r.district === id) ?? ROLES.admin).id;
  const color = ROLES[role].color;
  const lightRef = useRef<THREE.PointLight>(null);
  const thresholdMat = useRef<Mat>(null);
  const Kit = KITS[id];

  useFrame((_, delta) => {
    const isSettled = settled(role);
    if (lightRef.current) {
      const target = isSettled ? 1.0 : 0.3;
      lightRef.current.intensity +=
        (target - lightRef.current.intensity) * Math.min(1, delta * 2);
    }
    approach(thresholdMat.current, isSettled ? 0.22 : 0.08, delta, 2);
  });

  const thresholdPos: [number, number, number] = [
    def.center[0] + def.outward[0] * 1.9,
    0.012,
    def.center[2] + def.outward[2] * 1.9,
  ];

  return (
    <group>
      {/* Territory threshold — color before geometry (§1.2) */}
      <mesh position={thresholdPos} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.42, 0.58, 24]} />
        <meshStandardMaterial
          ref={el => {
            thresholdMat.current = el;
          }}
          color={color}
          emissive={color}
          emissiveIntensity={0.08}
          roughness={0.8}
          transparent
          opacity={0.3}
        />
      </mesh>
      <pointLight
        ref={lightRef}
        position={[def.center[0], 2.2, def.center[2]]}
        color={color}
        intensity={0.12}
        distance={6}
        decay={2}
      />
      <group position={def.center} rotation={[0, def.facing, 0]}>
        <Kit />
      </group>
    </group>
  );
}

export function Districts() {
  return (
    <>
      {(Object.keys(KITS) as Exclude<DistrictId, 'ledger'>[]).map(id => (
        <District key={id} id={id} />
      ))}
    </>
  );
}
