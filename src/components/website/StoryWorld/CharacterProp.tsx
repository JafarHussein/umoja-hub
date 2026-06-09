'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { CharacterId } from '@/lib/storyworld/types';

// CharacterBase measurements (for prop alignment):
//   Torso:  CylinderGeometry(0.205, 0.155, 0.74), center y=0.37 → y: 0→0.74
//   Neck:   center y=0.805 → y: 0.74→0.87
//   Head:   SphereGeometry(0.195), center y=0.98, scale.y=0.86 → top y≈1.15
//   Ground: y=-0.01 (props below ground are invisible)

interface PropProps {
  color: string;
}

// ── C01 Farmer ──────────────────────────────────────────────────────────────
// Recognition: wide-brimmed field hat (above head, visible from any angle)
//              + kiondo basket at right hip
//              + gumboot cuffs overlaying lower torso

function FarmerProp({ color: _color }: PropProps) {
  const HAT   = '#a8935a'; // straw/canvas
  const BOOT  = '#2a3d1e'; // dark rubber green
  const BSKT  = '#c4a882'; // woven straw
  const BOOTL = '#1e2d16'; // boot cuff lip, darker

  const hatBrimGeo  = useMemo(() => new THREE.CylinderGeometry(0.315, 0.315, 0.030, 16), []);
  const hatCrownGeo = useMemo(() => new THREE.CylinderGeometry(0.125, 0.140, 0.185, 10), []);
  const hatBandGeo  = useMemo(() => new THREE.CylinderGeometry(0.143, 0.143, 0.026, 10), []);

  // Gumboot cuffs — sit at very bottom of visible torso (y=0→0.22)
  const bootGeo     = useMemo(() => new THREE.CylinderGeometry(0.096, 0.088, 0.24, 10), []);
  const bootLipGeo  = useMemo(() => new THREE.CylinderGeometry(0.098, 0.098, 0.022, 10), []);

  // Kiondo basket
  const basketGeo   = useMemo(() => new THREE.CylinderGeometry(0.140, 0.080, 0.155, 12), []);
  const basketRimGeo = useMemo(() => new THREE.TorusGeometry(0.142, 0.016, 6, 16), []);
  const produceGeo  = useMemo(() => new THREE.SphereGeometry(0.038, 6, 5), []);

  return (
    <>
      {/* ── Field hat ── */}
      {/* Brim: the primary high-camera-angle silhouette cue */}
      <mesh geometry={hatBrimGeo} position={[0, 1.13, 0]}>
        <meshStandardMaterial color={HAT} roughness={0.88} metalness={0.0} />
      </mesh>
      {/* Crown */}
      <mesh geometry={hatCrownGeo} position={[0, 1.255, 0]}>
        <meshStandardMaterial color={HAT} roughness={0.88} metalness={0.0} />
      </mesh>
      {/* Hat band — slightly darker strip around crown base */}
      <mesh geometry={hatBandGeo} position={[0, 1.15, 0]}>
        <meshStandardMaterial color="#6e5e30" roughness={0.80} metalness={0.0} />
      </mesh>

      {/* ── Gumboot cuffs (overlay bottom of torso) ── */}
      {/* Left boot */}
      <mesh geometry={bootGeo} position={[-0.088, 0.12, 0]}>
        <meshStandardMaterial color={BOOT} roughness={0.72} metalness={0.04} />
      </mesh>
      <mesh geometry={bootLipGeo} position={[-0.088, 0.242, 0]}>
        <meshStandardMaterial color={BOOTL} roughness={0.65} metalness={0.06} />
      </mesh>
      {/* Right boot */}
      <mesh geometry={bootGeo} position={[0.088, 0.12, 0]}>
        <meshStandardMaterial color={BOOT} roughness={0.72} metalness={0.04} />
      </mesh>
      <mesh geometry={bootLipGeo} position={[0.088, 0.242, 0]}>
        <meshStandardMaterial color={BOOTL} roughness={0.65} metalness={0.06} />
      </mesh>

      {/* ── Kiondo basket at right hip, forward ── */}
      <group position={[0.38, 0.22, 0.25]}>
        <mesh geometry={basketGeo}>
          <meshStandardMaterial color={BSKT} roughness={0.92} metalness={0.0} />
        </mesh>
        {/* Woven rim ring at basket top */}
        <mesh geometry={basketRimGeo} position={[0, 0.078, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial color={BSKT} roughness={0.85} metalness={0.0} />
        </mesh>
        {/* Produce — tomato, leaf-green, mango-yellow */}
        <mesh geometry={produceGeo} position={[-0.042, 0.092, 0.040]}>
          <meshStandardMaterial color="#c0392b" roughness={0.68} />
        </mesh>
        <mesh geometry={produceGeo} position={[0.048, 0.100, -0.018]}>
          <meshStandardMaterial color="#27ae60" roughness={0.70} />
        </mesh>
        <mesh geometry={produceGeo} position={[0.010, 0.108, 0.055]}>
          <meshStandardMaterial color="#e67e22" roughness={0.68} />
        </mesh>
      </group>
    </>
  );
}

// ── C02 Buyer ───────────────────────────────────────────────────────────────
// Recognition: clipboard held upright at chest height — the evaluator's tool.
//              Metal clip bar at top is the silhouette differentiator.

function BuyerProp({ color: _color }: PropProps) {
  const BOARD = '#c8a56a'; // tan cardboard
  const PAPER = '#f0ebe0'; // cream paper
  const CLIP  = '#8a8a8a'; // metal
  const LINE  = '#b4a998'; // faint document lines
  const PEN   = '#2d4068';

  const boardGeo  = useMemo(() => new THREE.BoxGeometry(0.225, 0.345, 0.024), []);
  const clipGeo   = useMemo(() => new THREE.BoxGeometry(0.225, 0.050, 0.040), []);
  const paperGeo  = useMemo(() => new THREE.BoxGeometry(0.192, 0.272, 0.005), []);
  const lineGeo   = useMemo(() => new THREE.BoxGeometry(0.140, 0.009, 0.004), []);
  const penGeo    = useMemo(() => new THREE.CylinderGeometry(0.010, 0.008, 0.185, 6), []);

  return (
    <group position={[0.05, 0.63, 0.300]} rotation={[-0.20, 0.06, 0]}>
      {/* Clipboard board */}
      <mesh geometry={boardGeo}>
        <meshStandardMaterial color={BOARD} roughness={0.62} metalness={0.04} />
      </mesh>
      {/* Metal clip at top — the primary distinctive element */}
      <mesh geometry={clipGeo} position={[0, 0.197, 0.010]}>
        <meshStandardMaterial color={CLIP} roughness={0.28} metalness={0.78} />
      </mesh>
      {/* Paper sheet on board face */}
      <mesh geometry={paperGeo} position={[0, -0.010, 0.016]}>
        <meshStandardMaterial color={PAPER} roughness={0.80} metalness={0.0} />
      </mesh>
      {/* Document lines */}
      <mesh geometry={lineGeo} position={[0,  0.082, 0.020]}>
        <meshStandardMaterial color={LINE} roughness={0.85} />
      </mesh>
      <mesh geometry={lineGeo} position={[0,  0.032, 0.020]}>
        <meshStandardMaterial color={LINE} roughness={0.85} />
      </mesh>
      <mesh geometry={lineGeo} position={[0, -0.022, 0.020]}>
        <meshStandardMaterial color={LINE} roughness={0.85} />
      </mesh>
      <mesh geometry={lineGeo} position={[0, -0.074, 0.020]}>
        <meshStandardMaterial color={LINE} roughness={0.85} />
      </mesh>
      {/* Pen clipped to right edge */}
      <mesh geometry={penGeo} position={[0.124, 0.045, 0.020]} rotation={[0, 0, 0.10]}>
        <meshStandardMaterial color={PEN} roughness={0.38} metalness={0.35} />
      </mesh>
    </group>
  );
}

// ── C03 Student ─────────────────────────────────────────────────────────────
// Recognition: backpack — box behind body extending above shoulder line.
//              Chest straps are always visible from front.
//              Notebook held at chest confirms learning context.

function StudentProp({ color: _color }: PropProps) {
  const PACK  = '#1e3a5f'; // dark navy — contrast against character blue
  const STRAP = '#162d4a';
  const COVER = '#2d4a1e'; // dark green notebook cover
  const BOTTL = '#4a8a6a'; // teal water bottle

  const packGeo    = useMemo(() => new THREE.BoxGeometry(0.245, 0.320, 0.160), []);
  const handleGeo  = useMemo(() => new THREE.BoxGeometry(0.090, 0.038, 0.040), []);
  const bottleGeo  = useMemo(() => new THREE.CylinderGeometry(0.024, 0.024, 0.135, 8), []);
  const strapGeo   = useMemo(() => new THREE.BoxGeometry(0.030, 0.305, 0.030), []);
  const notebkGeo  = useMemo(() => new THREE.BoxGeometry(0.168, 0.218, 0.026), []);

  return (
    <>
      {/* ── Backpack body — behind character ── */}
      <group position={[0, 0.54, -0.215]}>
        <mesh geometry={packGeo}>
          <meshStandardMaterial color={PACK} roughness={0.84} metalness={0.03} />
        </mesh>
        {/* Top carry handle */}
        <mesh geometry={handleGeo} position={[0, 0.185, 0.058]}>
          <meshStandardMaterial color={STRAP} roughness={0.82} metalness={0.0} />
        </mesh>
        {/* Water bottle in right side pocket */}
        <mesh geometry={bottleGeo} position={[0.142, 0.025, 0.022]}>
          <meshStandardMaterial color={BOTTL} roughness={0.48} metalness={0.12} transparent opacity={0.90} />
        </mesh>
      </group>

      {/* ── Shoulder straps — on the FRONT of the body, always camera-visible ── */}
      {/* Left strap runs from shoulder (y≈0.70) down to waist (y≈0.22) */}
      <mesh geometry={strapGeo} position={[-0.072, 0.490, -0.052]}>
        <meshStandardMaterial color={STRAP} roughness={0.82} metalness={0.0} />
      </mesh>
      {/* Right strap */}
      <mesh geometry={strapGeo} position={[0.072, 0.490, -0.052]}>
        <meshStandardMaterial color={STRAP} roughness={0.82} metalness={0.0} />
      </mesh>

      {/* ── Notebook held at chest ── */}
      <mesh geometry={notebkGeo} position={[0.345, 0.600, 0.165]} rotation={[0.08, -0.18, 0.04]}>
        <meshStandardMaterial color={COVER} roughness={0.72} metalness={0.0} />
      </mesh>
    </>
  );
}

// ── C04 Lecturer ────────────────────────────────────────────────────────────
// Recognition: reading glasses — two tori at face level with temples.
//              Review papers held at a reading angle (someone else's work, not their own).

function LecturerProp({ color: _color }: PropProps) {
  const FRAME = '#5c4a35'; // tortoiseshell brown
  const STACK = '#d4cfc4'; // slightly yellowed paper stack
  const PAPER = '#f0ebe0'; // top sheet
  const MARK  = '#6a8a6a'; // reviewer's green ink
  const GREY  = '#9a9898'; // pencil marks

  const lensGeo    = useMemo(() => new THREE.TorusGeometry(0.056, 0.012, 6, 14), []);
  const bridgeGeo  = useMemo(() => new THREE.BoxGeometry(0.040, 0.012, 0.012), []);
  const templeGeo  = useMemo(() => new THREE.BoxGeometry(0.095, 0.012, 0.012), []);
  const stackGeo   = useMemo(() => new THREE.BoxGeometry(0.232, 0.304, 0.038), []);
  const topGeo     = useMemo(() => new THREE.BoxGeometry(0.216, 0.286, 0.006), []);
  const annotGeo   = useMemo(() => new THREE.BoxGeometry(0.148, 0.010, 0.005), []);

  return (
    <>
      {/* ── Reading glasses — in front of face ── */}
      {/* Positioned at brow level, protruding forward from head */}
      <group position={[0, 1.040, 0.198]}>
        <mesh geometry={lensGeo} position={[-0.077, 0, 0]}>
          <meshStandardMaterial color={FRAME} roughness={0.40} metalness={0.08} />
        </mesh>
        <mesh geometry={lensGeo} position={[ 0.077, 0, 0]}>
          <meshStandardMaterial color={FRAME} roughness={0.40} metalness={0.08} />
        </mesh>
        {/* Nose bridge */}
        <mesh geometry={bridgeGeo}>
          <meshStandardMaterial color={FRAME} roughness={0.40} metalness={0.08} />
        </mesh>
        {/* Left temple arm angling back to ear */}
        <mesh geometry={templeGeo} position={[-0.133, 0, -0.042]} rotation={[0,  0.52, 0]}>
          <meshStandardMaterial color={FRAME} roughness={0.40} metalness={0.08} />
        </mesh>
        {/* Right temple arm */}
        <mesh geometry={templeGeo} position={[ 0.133, 0, -0.042]} rotation={[0, -0.52, 0]}>
          <meshStandardMaterial color={FRAME} roughness={0.40} metalness={0.08} />
        </mesh>
      </group>

      {/* ── Review papers — someone else's work, held at reading distance ── */}
      <group position={[0.10, 0.675, 0.320]} rotation={[-0.30, 0.08, 0.04]}>
        {/* Stack (visible bulk signals multiple submissions) */}
        <mesh geometry={stackGeo}>
          <meshStandardMaterial color={STACK} roughness={0.78} metalness={0.0} />
        </mesh>
        {/* Top paper, slightly lighter */}
        <mesh geometry={topGeo} position={[0, 0, 0.022]}>
          <meshStandardMaterial color={PAPER} roughness={0.80} metalness={0.0} />
        </mesh>
        {/* Green ink annotation — the reviewer's mark */}
        <mesh geometry={annotGeo} position={[ 0.020,  0.085, 0.026]}>
          <meshStandardMaterial color={MARK} roughness={0.82} />
        </mesh>
        <mesh geometry={annotGeo} position={[-0.010,  0.030, 0.026]}>
          <meshStandardMaterial color={GREY} roughness={0.82} />
        </mesh>
        <mesh geometry={annotGeo} position={[ 0.015, -0.032, 0.026]}>
          <meshStandardMaterial color={GREY} roughness={0.82} />
        </mesh>
      </group>
    </>
  );
}

// ── C05 Employer ─────────────────────────────────────────────────────────────
// Recognition: lanyard + ID badge hanging from neck (institutional affiliation).
//              Closed candidate folder — not a procurement clipboard, a candidate file.

function EmployerProp({ color: _color }: PropProps) {
  const CORD   = '#5B7FA6'; // blue lanyard ribbon
  const BADGE  = '#f8f8f8'; // white card
  const STRIPE = '#5B7FA6'; // institutional color bar on badge
  const FOLDER = '#3d1f2a'; // deep burgundy
  const TAB    = '#4a2535';

  // Neck is at y≈0.87; badge hangs to y≈0.62
  const cordGeo   = useMemo(() => new THREE.BoxGeometry(0.011, 0.255, 0.011), []);
  const badgeGeo  = useMemo(() => new THREE.BoxGeometry(0.102, 0.074, 0.015), []);
  const stripeGeo = useMemo(() => new THREE.BoxGeometry(0.102, 0.022, 0.017), []);
  const folderGeo = useMemo(() => new THREE.BoxGeometry(0.268, 0.352, 0.035), []);
  const tabGeo    = useMemo(() => new THREE.BoxGeometry(0.090, 0.056, 0.037), []);

  return (
    <>
      {/* ── Lanyard cord — from neck-base down to badge ── */}
      {/* Cord: center at y=(0.87+0.62)/2=0.745, height=0.255, at chest plane */}
      <mesh geometry={cordGeo} position={[0, 0.745, 0.245]}>
        <meshStandardMaterial color={CORD} roughness={0.58} metalness={0.0} />
      </mesh>
      {/* ID Badge at y=0.62 */}
      <mesh geometry={badgeGeo} position={[0, 0.618, 0.248]}>
        <meshStandardMaterial color={BADGE} roughness={0.48} metalness={0.0} />
      </mesh>
      {/* Institutional color stripe at top of badge */}
      <mesh geometry={stripeGeo} position={[0, 0.640, 0.250]}>
        <meshStandardMaterial color={STRIPE} roughness={0.48} metalness={0.0} />
      </mesh>

      {/* ── Candidate folder — closed, held at chest ── */}
      <group position={[0, 0.655, 0.295]} rotation={[-0.14, 0, 0]}>
        <mesh geometry={folderGeo}>
          <meshStandardMaterial color={FOLDER} roughness={0.52} metalness={0.05} />
        </mesh>
        {/* Filing tab protruding at top-right */}
        <mesh geometry={tabGeo} position={[0.090, 0.203, 0.002]}>
          <meshStandardMaterial color={TAB} roughness={0.52} metalness={0.05} />
        </mesh>
      </group>
    </>
  );
}

// ── C06 Cooperative Leader ───────────────────────────────────────────────────
// Recognition: ochre cooperative vest (wider than body = immediately visible silhouette change).
//              Gold insignia badge on chest.
//              Thick group register in right arm (bulk signals many members).

function CooperativeProp({ color: _color }: PropProps) {
  const VEST  = '#C47C35'; // warm ochre — the primary recognition color
  const VNECK = '#a86828'; // darker collar
  const BADGE = '#e8c040'; // gold insignia
  const REG   = '#1a2424'; // dark register cover
  const SPINE = '#0f1818'; // register spine

  // Vest: noticeably wider than body (body radius: 0.205 top, 0.155 bottom)
  const vestGeo   = useMemo(() => new THREE.CylinderGeometry(0.272, 0.210, 0.58, 12), []);
  const vestColGeo = useMemo(() => new THREE.CylinderGeometry(0.108, 0.118, 0.076, 12), []);
  const badgeGeo  = useMemo(() => new THREE.CylinderGeometry(0.028, 0.028, 0.010, 10), []);
  const regGeo    = useMemo(() => new THREE.BoxGeometry(0.230, 0.312, 0.065), []);
  const spineGeo  = useMemo(() => new THREE.BoxGeometry(0.065, 0.312, 0.068), []);
  const coverGeo  = useMemo(() => new THREE.BoxGeometry(0.230, 0.312, 0.010), []);

  return (
    <>
      {/* ── Cooperative vest — the silhouette-widening layer ── */}
      <mesh geometry={vestGeo} position={[0, 0.370, 0]}>
        <meshStandardMaterial color={VEST} roughness={0.74} metalness={0.02} />
      </mesh>
      {/* Vest collar */}
      <mesh geometry={vestColGeo} position={[0, 0.726, 0]}>
        <meshStandardMaterial color={VNECK} roughness={0.70} metalness={0.02} />
      </mesh>
      {/* Gold cooperative insignia on chest */}
      <mesh geometry={badgeGeo} position={[0.158, 0.665, 0.274]}>
        <meshStandardMaterial
          color={BADGE}
          emissive={BADGE}
          emissiveIntensity={0.12}
          roughness={0.28}
          metalness={0.65}
        />
      </mesh>

      {/* ── Group register — thick, signals organizational scope ── */}
      <group position={[0.38, 0.580, 0.160]} rotation={[0.04, -0.18, 0]}>
        {/* Register spine on left edge */}
        <mesh geometry={spineGeo} position={[-0.148, 0, 0]}>
          <meshStandardMaterial color={SPINE} roughness={0.70} metalness={0.0} />
        </mesh>
        {/* Register body */}
        <mesh geometry={regGeo}>
          <meshStandardMaterial color={REG} roughness={0.66} metalness={0.0} />
        </mesh>
        {/* Front cover — slightly lighter to show depth */}
        <mesh geometry={coverGeo} position={[0, 0, 0.038]}>
          <meshStandardMaterial color="#263030" roughness={0.66} metalness={0.0} />
        </mesh>
      </group>
    </>
  );
}

// ── Guide prop — orbiting teal verification ring ──────────────────────────────
// The Guide (Administrator) is the only character whose prop is abstract —
// the ring represents the platform's verification system rotating around them.

export function GuideProp({ color }: { color: string }) {
  const ringRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ringRef.current) {
      ringRef.current.rotation.z = clock.getElapsedTime() * 0.65;
      ringRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.28) * 0.25;
    }
  });
  return (
    <mesh ref={ringRef} position={[0, 1.1, 0]}>
      <torusGeometry args={[0.30, 0.015, 6, 48]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.60}
        roughness={0.10}
        metalness={0.90}
      />
    </mesh>
  );
}

// ── Dispatch ──────────────────────────────────────────────────────────────────

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
