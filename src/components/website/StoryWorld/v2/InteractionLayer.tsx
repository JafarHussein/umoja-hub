'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { DISCOVERY_COLOR, DISTRICTS, LEDGER_CENTER, ROLES } from '@/lib/storyworld/v2/config';
import { FACT_CARDS, HIDDEN_RECORDS } from '@/lib/storyworld/v2/data';
import { useStoryworldV2 } from '@/lib/storyworld/v2/store';
import type { DistrictId, FactCard, HiddenRecordDef } from '@/lib/storyworld/v2/types';

// Interaction layer (§4.4, §4.6): inspectables open platform-true fact cards;
// hidden records reward the wandering eye and write white-gold rings.

function districtCenter(district: DistrictId): [number, number, number] {
  if (district === 'ledger') return LEDGER_CENTER;
  return DISTRICTS[district].center;
}

function districtColor(district: DistrictId): string {
  const role = Object.values(ROLES).find(r => r.district === district);
  return role ? role.color : DISCOVERY_COLOR;
}

function worldAnchor(district: DistrictId, offset: [number, number, number]) {
  const c = districtCenter(district);
  return [c[0] + offset[0], c[1] + offset[1], c[2] + offset[2]] as [number, number, number];
}

// ── Inspectable marker ────────────────────────────────────────────────────────

function InspectableMarker({ card }: { card: FactCard }) {
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const phase = useRef(Math.random() * Math.PI * 2);
  const pos = worldAnchor(card.district, card.offset);

  useFrame(({ clock }) => {
    if (!matRef.current) return;
    const { reducedMotion, inspecting } = useStoryworldV2.getState();
    const open = inspecting === card.id;
    matRef.current.emissiveIntensity = open
      ? 0.7
      : reducedMotion
        ? 0.25
        : 0.18 + Math.sin(clock.getElapsedTime() * 1.1 + phase.current) * 0.1;
  });

  function handleClick(e: ThreeEvent<MouseEvent>) {
    e.stopPropagation();
    const store = useStoryworldV2.getState();
    store.firstInteraction('inspect');
    store.setInspecting(store.inspecting === card.id ? null : card.id);
  }

  return (
    <group position={pos}>
      <mesh
        onClick={handleClick}
        onPointerOver={() => {
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = '';
        }}
      >
        <sphereGeometry args={[0.24, 8, 6]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh>
        <octahedronGeometry args={[0.06, 0]} />
        <meshStandardMaterial
          ref={matRef}
          color={DISCOVERY_COLOR}
          emissive={DISCOVERY_COLOR}
          emissiveIntensity={0.18}
          roughness={0.3}
          metalness={0.4}
        />
      </mesh>
    </group>
  );
}

// ── Hidden record tile (§4.6) ─────────────────────────────────────────────────

function HiddenRecordTile({ record }: { record: HiddenRecordDef }) {
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const groupRef = useRef<THREE.Group>(null);
  const phase = useRef(Math.random() * Math.PI * 2);
  const pos = worldAnchor(record.district, record.offset);

  useFrame(({ clock }, delta) => {
    const store = useStoryworldV2.getState();
    const discovered = store.world.discoveredHidden.includes(record.district);
    if (matRef.current) {
      matRef.current.emissiveIntensity = discovered
        ? 0.5
        : store.reducedMotion
          ? 0.06
          : 0.03 + Math.max(0, Math.sin(clock.getElapsedTime() * 0.5 + phase.current)) * 0.07;
    }
    if (groupRef.current) {
      const targetY = discovered ? 0.5 : 0;
      groupRef.current.position.y +=
        (targetY - groupRef.current.position.y) *
        Math.min(1, delta * (store.reducedMotion ? 60 : 2.2));
    }
  });

  function handleClick(e: ThreeEvent<MouseEvent>) {
    e.stopPropagation();
    const store = useStoryworldV2.getState();
    store.discover(record.district);
    store.setInspecting(record.id);
  }

  return (
    <group position={pos}>
      <group ref={groupRef}>
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          onClick={handleClick}
          onPointerOver={() => {
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            document.body.style.cursor = '';
          }}
        >
          <planeGeometry args={[0.34, 0.34]} />
          <meshStandardMaterial
            ref={matRef}
            color="#1e252e"
            emissive={DISCOVERY_COLOR}
            emissiveIntensity={0.03}
            roughness={0.6}
            metalness={0.3}
          />
        </mesh>
      </group>
    </group>
  );
}

// ── Fact card panel ───────────────────────────────────────────────────────────

function FactCardPanel() {
  const inspecting = useStoryworldV2(s => s.inspecting);
  if (!inspecting) return null;

  const fact = FACT_CARDS.find(c => c.id === inspecting);
  const hidden = fact ? undefined : HIDDEN_RECORDS.find(h => h.id === inspecting);
  const item = fact ?? hidden;
  if (!item) return null;

  const anchor = worldAnchor(item.district, [
    item.offset[0],
    item.offset[1] + 0.7,
    item.offset[2],
  ]);
  const tick = hidden ? DISCOVERY_COLOR : districtColor(item.district);

  return (
    <Html position={anchor} center distanceFactor={9} zIndexRange={[30, 21]}>
      <div
        style={{
          width: '290px',
          backgroundColor: 'rgba(13,16,20,0.96)',
          border: '1px solid #2e363f',
          borderTop: `2px solid ${tick}`,
          borderRadius: '4px',
          padding: '14px 16px',
          fontFamily: 'var(--font-ibm-plex-mono), monospace',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: '6px',
          }}
        >
          <span
            style={{
              color: tick,
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
            }}
          >
            {item.title}
          </span>
          <button
            type="button"
            aria-label="Close"
            onClick={() => useStoryworldV2.getState().setInspecting(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#6b7280',
              cursor: 'pointer',
              fontSize: '12px',
              lineHeight: 1,
              padding: '0 0 0 8px',
            }}
          >
            ×
          </button>
        </div>
        <p style={{ color: '#c8c2ba', fontSize: '11px', lineHeight: 1.65, margin: 0 }}>
          {item.body}
        </p>
        {fact?.mono && (
          <p
            style={{
              color: '#6b7280',
              fontSize: '10px',
              lineHeight: 1.5,
              margin: '8px 0 0',
              borderTop: '1px solid #1e252e',
              paddingTop: '8px',
            }}
          >
            {fact.mono}
          </p>
        )}
      </div>
    </Html>
  );
}

export function InteractionLayer() {
  return (
    <>
      {FACT_CARDS.map(card => (
        <InspectableMarker key={card.id} card={card} />
      ))}
      {HIDDEN_RECORDS.map(record => (
        <HiddenRecordTile key={record.id} record={record} />
      ))}
      <FactCardPanel />
    </>
  );
}
