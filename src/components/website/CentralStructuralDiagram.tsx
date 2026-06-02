import React from 'react';

// IDs exposed for GSAP animation in Sprint 1 (diagramActivation() in src/lib/motion.ts):
//   #csd-food-group   — Food Security Hub nodes  (CSS opacity, phase 1)
//   #csd-edu-group    — Education Hub nodes       (CSS opacity, phase 2)
//   #csd-vl-group     — Verification Layer        (CSS opacity, phase 4)
//   [data-csd="conn"] — all connector paths       (stroke-dashoffset, phases 3+5)

const GF = 'var(--font-geist, sans-serif)';
const GM = 'var(--font-geist-mono, monospace)';

// ─── Shared colour constants (ws-* token values) ───────────────────────────
const C = {
  foodBg: '#F7F7F7',
  foodBorder: '#D4D4D2',
  actorBg: '#F0F0F0',
  vlBg: '#0A0A09',
  vlBorder: '#2A2A28',
  nodeDark: '#1E1E1C',
  textPrimary: '#111110',
  textBright: '#F5F5F3',
  textDim: '#9B9B99',
  textTertiary: '#9A9A98',
  textFaint: '#5E5E5C',
  green: '#16A34A',
  greenTint: '#F0FDF4',
  greenBorder: '#86EFAC',
  blue: '#2563EB',
  blueTint: '#EFF6FF',
  blueBorder: '#93C5FD',
  connGrey: '#D4D4D2',
};

// ─── Reusable SVG primitives ───────────────────────────────────────────────

function ActorNode({
  x,
  y,
  w,
  label,
  dark = false,
  dashed = false,
}: {
  x: number;
  y: number;
  w: number;
  label: string;
  dark?: boolean;
  dashed?: boolean;
}): React.ReactElement {
  const h = 30;
  const fill = dark ? C.nodeDark : C.actorBg;
  const stroke = dark ? C.vlBorder : C.foodBorder;
  const textFill = dark ? (dashed ? C.textDim : C.textBright) : C.textPrimary;
  return (
    <>
      <rect
        x={x} y={y} width={w} height={h} rx="2"
        fill={fill} stroke={stroke} strokeWidth="1"
        strokeDasharray={dashed ? '4 2' : undefined}
      />
      <text
        x={x + w / 2} y={y + h * 0.65}
        textAnchor="middle"
        fontSize="13"
        fontFamily={GF}
        fill={textFill}
        fontStyle={dashed ? 'italic' : undefined}
      >
        {label}
      </text>
    </>
  );
}

function HubCaption({
  x, y, label, dark,
}: { x: number; y: number; label: string; dark?: boolean }): React.ReactElement {
  return (
    <text
      x={x} y={y} textAnchor="middle"
      fontSize="10" fontFamily={GM}
      fill={dark ? C.textFaint : C.textTertiary}
      letterSpacing="0.06em"
    >
      {label}
    </text>
  );
}

function StatusPill({
  x, y, w, h, label, hub,
}: {
  x: number; y: number; w: number; h: number; label: string; hub: 'food' | 'edu';
}): React.ReactElement {
  const bg = hub === 'food' ? C.greenTint : C.blueTint;
  const border = hub === 'food' ? C.greenBorder : C.blueBorder;
  const textFill = hub === 'food' ? C.green : C.blue;
  return (
    <>
      <rect x={x} y={y} width={w} height={h} rx={h / 2} fill={bg} stroke={border} strokeWidth="1" />
      <text
        x={x + w / 2} y={y + h * 0.65}
        textAnchor="middle"
        fontSize="10" fontFamily={GM}
        fill={textFill} letterSpacing="0.04em"
      >
        {label}
      </text>
    </>
  );
}

// ─── Desktop SVG (840 × 290) ───────────────────────────────────────────────
// Layout: [Food Security Hub] ─green→ [Verification Layer] ←blue─ [Education Hub]
// Three actor rows connect horizontally into the shared center.
// Output section below actor rows shows TRUSTED / PORTFOLIO VERIFIED badges.

function DesktopDiagram(): React.ReactElement {
  // Column x origins
  const fX = 0;    // Food hub: 0–240
  const vX = 300;  // Verification: 300–540
  const eX = 600;  // Education: 600–840
  const colW = 240;
  const nodeW = colW - 24; // 216, with 12px inset each side

  // Actor Y-positions (4 rows)
  const rows = [28, 68, 108, 148] as const;
  // Connector y-midpoints (rows 0–2 get connectors; row 3 is hub-only)
  const connY = rows.slice(0, 3).map((y) => y + 15);

  return (
    <svg
      viewBox="0 0 840 290"
      width="100%"
      preserveAspectRatio="xMidYMid meet"
      className="hidden md:block"
      aria-hidden="true"
    >
      <defs>
        {/* Single arrowhead marker — orient="auto" rotates it for any direction */}
        <marker id="csd-arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <polygon points="0 0, 6 3, 0 6" fill={C.connGrey} />
        </marker>
        <marker id="csd-arr-g" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <polygon points="0 0, 6 3, 0 6" fill={C.green} />
        </marker>
        <marker id="csd-arr-b" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <polygon points="0 0, 6 3, 0 6" fill={C.blue} />
        </marker>
      </defs>

      {/* ── Food Security Hub ── */}
      <g id="csd-food-group">
        <rect x={fX} y="0" width={colW} height="290" fill={C.foodBg} stroke={C.foodBorder} strokeWidth="1" />
        <HubCaption x={fX + colW / 2} y={18} label="FOOD SECURITY HUB" />
        <ActorNode x={fX + 12} y={rows[0]} w={nodeW} label="Farmer" />
        <ActorNode x={fX + 12} y={rows[1]} w={nodeW} label="Buyer" />
        <ActorNode x={fX + 12} y={rows[2]} w={nodeW} label="Supplier" />
        <ActorNode x={fX + 12} y={rows[3]} w={nodeW} label="Cooperative" />
      </g>

      {/* ── Food → VL connectors (green, going RIGHT) ── */}
      {connY.map((y) => (
        <path
          key={`f${y}`}
          d={`M${fX + nodeW + 12} ${y} H${vX}`}
          stroke={C.green} strokeWidth="1.5" fill="none"
          markerEnd="url(#csd-arr-g)"
          data-csd="conn"
        />
      ))}

      {/* ── Verification Layer ── */}
      <g id="csd-vl-group">
        <rect x={vX} y="0" width={colW} height="290" fill={C.vlBg} stroke={C.vlBorder} strokeWidth="1" />
        <HubCaption x={vX + colW / 2} y={18} label="VERIFICATION LAYER" dark />
        <ActorNode x={vX + 12} y={rows[0]} w={nodeW} label="Platform Admin" dark />
        <ActorNode x={vX + 12} y={rows[1]} w={nodeW} label="Document Review" dark dashed />
        <ActorNode x={vX + 12} y={rows[2]} w={nodeW} label="Audit Log" dark dashed />
        <ActorNode x={vX + 12} y={rows[3]} w={nodeW} label="Trust Record" dark dashed />
      </g>

      {/* ── Education → VL connectors (blue, going LEFT) ── */}
      {connY.map((y) => (
        <path
          key={`e${y}`}
          d={`M${eX} ${y} H${vX + colW}`}
          stroke={C.blue} strokeWidth="1.5" fill="none"
          markerEnd="url(#csd-arr-b)"
          data-csd="conn"
        />
      ))}

      {/* ── Education Hub ── */}
      <g id="csd-edu-group">
        <rect x={eX} y="0" width={colW} height="290" fill={C.foodBg} stroke={C.foodBorder} strokeWidth="1" />
        <HubCaption x={eX + colW / 2} y={18} label="EDUCATION HUB" />
        <ActorNode x={eX + 12} y={rows[0]} w={nodeW} label="Student" />
        <ActorNode x={eX + 12} y={rows[1]} w={nodeW} label="Lecturer" />
        <ActorNode x={eX + 12} y={rows[2]} w={nodeW} label="Employer" />
        <ActorNode x={eX + 12} y={rows[3]} w={nodeW} label="Institution" />
      </g>

      {/* ── Section separators ── */}
      <line x1="1" y1="196" x2="239" y2="196" stroke={C.foodBorder} strokeWidth="0.5" />
      <line x1={vX + 1} y1="196" x2={vX + colW - 1} y2="196" stroke={C.vlBorder} strokeWidth="0.5" />
      <line x1={eX + 1} y1="196" x2={eX + colW - 1} y2="196" stroke={C.foodBorder} strokeWidth="0.5" />

      {/* ── Output connectors: vertical trunk then two branches ── */}
      {/* Trunk: center of VL → y=240 */}
      <path d="M420 196 V240" stroke={C.connGrey} strokeWidth="1.5" fill="none" data-csd="conn" />
      {/* Left branch to food hub center (x=120) */}
      <line x1="420" y1="240" x2="120" y2="240" stroke={C.connGrey} strokeWidth="1.5" />
      <line x1="120" y1="240" x2="120" y2="256"
        stroke={C.connGrey} strokeWidth="1.5"
        markerEnd="url(#csd-arr)"
        data-csd="conn"
      />
      {/* Right branch to edu hub center (x=720) */}
      <line x1="420" y1="240" x2="720" y2="240" stroke={C.connGrey} strokeWidth="1.5" />
      <line x1="720" y1="240" x2="720" y2="256"
        stroke={C.connGrey} strokeWidth="1.5"
        markerEnd="url(#csd-arr)"
        data-csd="conn"
      />

      {/* ── Output status badges ── */}
      <StatusPill x={52} y={258} w={136} h={24} label="TRUSTED" hub="food" />
      <StatusPill x={648} y={258} w={144} h={24} label="PORTFOLIO VERIFIED" hub="edu" />
    </svg>
  );
}

// ─── Mobile SVG (360 × 520) ───────────────────────────────────────────────
// Layout: Food Security Hub → Verification Layer → Education Hub (vertical stack)
// Fully resolved static — no animation on mobile.

function MobileDiagram(): React.ReactElement {
  const w = 360;
  const nodeW = w - 24;

  return (
    <svg
      viewBox="0 0 360 520"
      width="100%"
      preserveAspectRatio="xMidYMid meet"
      className="block md:hidden"
      aria-hidden="true"
    >
      <defs>
        <marker id="csd-m-arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <polygon points="0 0, 6 3, 0 6" fill={C.connGrey} />
        </marker>
        <marker id="csd-m-arr-g" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <polygon points="0 0, 6 3, 0 6" fill={C.green} />
        </marker>
      </defs>

      {/* ── Food Security Hub (top, 0–150) ── */}
      <rect x="0" y="0" width={w} height="150" fill={C.foodBg} stroke={C.foodBorder} strokeWidth="1" />
      <HubCaption x={w / 2} y={18} label="FOOD SECURITY HUB" />
      {/* 2 × 2 grid of actors */}
      <ActorNode x={12} y={28} w={158} label="Farmer" />
      <ActorNode x={190} y={28} w={158} label="Buyer" />
      <ActorNode x={12} y={68} w={158} label="Supplier" />
      <ActorNode x={190} y={68} w={158} label="Cooperative" />

      {/* ── Green connector (down) ── */}
      <line x1="180" y1="150" x2="180" y2="185"
        stroke={C.green} strokeWidth="1.5"
        markerEnd="url(#csd-m-arr-g)"
      />

      {/* ── Verification Layer (middle, 185–355) ── */}
      <rect x="0" y="185" width={w} height="170" fill={C.vlBg} stroke={C.vlBorder} strokeWidth="1" />
      <HubCaption x={w / 2} y={203} label="VERIFICATION LAYER" dark />
      <ActorNode x={12} y={213} w={nodeW} label="Platform Admin" dark />
      <ActorNode x={12} y={253} w={nodeW} label="Document Review" dark dashed />
      <ActorNode x={12} y={293} w={nodeW} label="Audit Log" dark dashed />

      {/* ── Grey connector (down) ── */}
      <line x1="180" y1="355" x2="180" y2="390"
        stroke={C.connGrey} strokeWidth="1.5"
        markerEnd="url(#csd-m-arr)"
      />

      {/* ── Education Hub (bottom, 390–520) ── */}
      <rect x="0" y="390" width={w} height="130" fill={C.foodBg} stroke={C.foodBorder} strokeWidth="1" />
      <HubCaption x={w / 2} y={408} label="EDUCATION HUB" />
      <ActorNode x={12} y={418} w={158} label="Student" />
      <ActorNode x={190} y={418} w={158} label="Lecturer" />
      <ActorNode x={12} y={458} w={158} label="Employer" />
      <ActorNode x={190} y={458} w={158} label="Institution" />
    </svg>
  );
}

// ─── Public export ─────────────────────────────────────────────────────────

export function CentralStructuralDiagram(): React.ReactElement {
  return (
    <figure
      aria-label="Architecture diagram: Food Security Hub and Education Hub share a common Verification Layer. Both hubs submit participants for verification, and the layer produces trusted credentials returned to each hub."
    >
      <DesktopDiagram />
      <MobileDiagram />
    </figure>
  );
}
