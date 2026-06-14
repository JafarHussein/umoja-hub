# People Ecosystem — Experience Architecture
**Working title:** "The People Behind The Platform"  
**Position:** S5 — between Verification in Practice and Audience Routing  
**Status:** Architecture complete. Awaiting approval before implementation begins.

---

## Overview

This document is the sole authoritative design brief for the People Ecosystem section. Nothing is built until every decision in this document is resolved and signed off. This is not a specification to be interpreted — it is a blueprint to be followed.

The fundamental shift: we do not explain UmojaHub through statistics. We explain it through the people who need it to exist.

---

## 1. Narrative Structure

The section tells a four-act story. The story is triggered entirely by scroll position. The visitor does not click, do not interact, does not control pacing. They witness.

### The Emotional Arc

| State | What the visitor feels |
|-------|----------------------|
| Before the section | Informed but detached |
| Act 1 | Recognition — these are real people |
| Act 2 | Investment — something is happening here |
| Act 3 | Belief — this platform solves real problems |
| Act 4 | Trust — the ecosystem is real and ongoing |

### The Four Acts

**Act 1 — Arrival (0%–25% scroll progress)**

The ecosystem is empty. Quiet. The central UmojaHub object exists at the center — suspended, rotating slowly, radiating a faint pulse.

One by one, characters walk in from the edges of the scene.

They do not speak yet. They look at each other. They look at the center object. Uncertainty is present. Trust has not yet been established.

The visitor feels: *People are here. They don't know each other yet. Something is about to happen.*

---

**Act 2 — Connection (25%–50% scroll progress)**

The first conversations begin. Sparse. Careful. A farmer asks a question. The platform responds. A student mentions a review.

Characters move closer to the center object. Connections between characters begin to light up — faint lines, barely visible, representing the relationships forming.

The visitor feels: *These people have questions. The platform is answering them. Something is working.*

---

**Act 3 — Activity (50%–75% scroll progress)**

The ecosystem is alive. Multiple conversations overlap. A transaction completes. A portfolio gets verified. A cooperative adjusts a listing. An NGO receives an audit report.

The character-to-character connections are bright now. The central object pulses with each verification event. Characters who have completed transactions emit a brief visual signal.

The visitor feels: *This is real commerce. Real education. Real coordination. This is infrastructure.*

---

**Act 4 — Community (75%–100% scroll progress)**

The conversations slow — not because activity has stopped, but because it has become natural. Routine. The ecosystem has found its rhythm.

Characters are distributed across the scene in clusters of 2–3, in mid-conversation. The central object is fully illuminated. The connections between characters form a visible web — the verification network made visible.

The section ends with the ecosystem at rest in its active state: a living community.

The visitor feels: *This exists. These people need each other. UmojaHub is the reason they found each other.*

---

## 2. Characters

Nine characters. Every character has a defined role, visual signature, and position in the ecosystem.

### Visual Design Codex

**Style:** Geometric minimalism. Not cartoony — no round eyes, no smiling mouths, no exaggerated proportions. Not realistic — no skin texture, no hair detail, no facial expression modeling. The goal is abstraction with personality: a silhouette and a color that communicates the role before any label is read.

**Form language:**
- Heads: slightly flattened ellipsoid (distinguishable from the body, no face geometry)
- Bodies: tapered cylinder, wider at shoulders
- Height: approximately 1.5 units in scene space
- No hands or feet as distinct features — the body terminates cleanly
- Props and accessories communicate role identity

**Materials:**
- Base material: `MeshStandardMaterial`, roughness 0.65, metalness 0.05
- Each character has one primary color (see below)
- Subtle ambient occlusion baked into geometry
- No textures — procedural shading only
- Character color is used as emissive at very low intensity (0.04) to distinguish from pure matte

---

### Character Definitions

**C01 — The Farmer**
- Primary color: `#8B5E3C` (warm earth, distinct from copper UI accent)
- Prop: a small flat disc (representing land document / ID) floating at hip height
- Position in ecosystem: left side, slightly forward
- Conversations: initiates market queries, responds to buyer verifications, coordinates with cooperative leader
- Act 1 behavior: arrives first, looks toward center object with recognition

**C02 — The Buyer**
- Primary color: `#4A5568` (slate blue-gray — institutional, reliable)
- Prop: a thin rectangular volume (representing purchase order)
- Position: right side, facing farmer
- Conversations: asks about Trust Score, confirms verified status, initiates M-Pesa payment sequence
- Act 1 behavior: arrives second, faces farmer at a cautious distance

**C03 — The Student**
- Primary color: `#5B7FA6` (cool blue — aspiration, learning)
- Prop: a floating geometric cluster of 3 small cubes (3 project documents)
- Position: upper-left cluster with lecturer
- Conversations: mentions peer review, asks about submission status, receives revision notes
- Act 1 behavior: arrives alone, moves toward lecturer's position

**C04 — The Lecturer**
- Primary color: `#6B7280` (warm gray — authority, experience)
- Prop: a hexagonal disc (representing academic credential)
- Position: upper-left, behind student
- Conversations: leaves revision notes, confirms peer review completion, explains review criteria
- Act 1 behavior: appears from background, positions behind student

**C05 — The Employer**
- Primary color: `#374151` (dark gray — professional, formal)
- Prop: a thin vertical panel (representing portfolio review interface)
- Position: upper-right, facing student cluster
- Conversations: requests portfolio verification, receives verification confirmation, asks about reviewer credentials
- Act 1 behavior: arrives last in left cluster, stops at a distance from student/lecturer

**C06 — The Cooperative Leader**
- Primary color: `#5C7A4A` (forest green — collective, land)
- Prop: a branching line structure (representing group coordination)
- Position: lower-left, near farmer
- Conversations: shares price intelligence, coordinates group listing adjustments, discusses regional logistics
- Act 1 behavior: walks toward farmer, brief moment of recognition

**C07 — The NGO Representative**
- Primary color: `#7C6B9A` (muted violet — mission, oversight)
- Prop: a small floating grid (representing impact metrics / audit report)
- Position: upper-center, slightly back from other characters
- Conversations: requests regional data, receives audit availability confirmation, discusses coverage metrics
- Act 1 behavior: arrives to a neutral position, observes before engaging

**C08 — The Institution Representative**
- Primary color: `#9A7B4E` (ochre — academic institution, established)
- Prop: a cylindrical seal shape (representing institutional authority)
- Position: upper-right cluster with employer
- Conversations: confirms institutional affiliation, asks about verification chain integrity, validates portfolio entries
- Act 1 behavior: arrives with employer, slower movement

**C09 — The Administrator**
- Primary color: `#3D4F5C` (deep blue-gray — neutral authority, platform)
- Prop: a small orbiting ring around their position (representing the verification queue)
- Position: center-back, closest to the central UmojaHub object
- Conversations: confirms all review outputs, provides audit reports, references accountability records
- Act 1 behavior: already present when the scene begins — they are the platform's human face

---

## 3. Character Behaviors

### Idle State (when not in active conversation)

Every character has a breathing animation: a slow scale pulse on Y axis, 0.98–1.00, period 3–4 seconds (randomized per character so they don't all breathe in sync).

Characters slowly rotate toward the nearest active conversation — not full rotation, a 10–15 degree lean suggesting attention.

The administrator's orbiting ring prop rotates continuously at all times.

### Movement

Characters do not walk with a leg-cycle animation. Movement is a smooth position interpolation — they glide, slightly above ground level, as if the concept of locomotion has been abstracted. This is intentional and consistent with the geometric, non-realistic aesthetic.

Movement speed: 0.8–1.2 units/second (scene space). Never rushed.

### During Conversation

When a character initiates or receives a bubble, they orient fully toward the target. Scale increases by 1.03 on all axes for the duration of the bubble. Their emissive intensity increases to 0.10 from baseline 0.04.

When a transaction completes, both characters in that exchange emit a brief radial pulse from their position (a ring geometry that expands and fades over 0.8s).

### Reduced Motion

All position interpolations, rotations, and scale animations are disabled. Characters appear at their Act 4 positions. Conversations still cycle, but appear/disappear instantly without easing. The central object does not rotate.

---

## 4. Conversation System

### Bubble Design

Not chat bubbles. Not tooltips. Not speech balloons with tails.

The conversation system uses floating text panels — a `RoundedBox` from drei at a fixed width (0.85 units), with:
- Background: `rgba(19, 22, 25, 0.92)` — nearly black, matching the hero section background
- Border: 1px, `#39414a`
- Text: IBM Plex Mono, rendered via drei's `Text` component
- Speaker label: SemiBold, 0.055 size, color = character's primary color
- Content: Regular, 0.048 size, `#c8c2ba`
- Corner radius: 0.04 units

The bubble appears above and slightly to the character's side — never occluding other characters.

Appear: fade in over 0.35s + slight upward translation (0.08 units)  
Hold: duration depends on character count (base 3.5s + 0.3s per word)  
Dismiss: fade out 0.25s

### Conversation Sequencing

Conversations run from a scripted pool during each act, not randomly. Random selection creates incoherence. The progression must feel authored.

Each conversation has:
- `actTrigger`: which act it belongs to
- `initiator`: character ID
- `target`: character ID or `'platform'`
- `initiatorLine`: string
- `targetLine`: string
- `educatesAbout`: what platform feature this demonstrates
- `scrollRange`: [start, end] as percentage within the act

### Conversation Library (30 scripted exchanges)

**Act 1 — Arrival (trust uncertain)**

```
C01 → C02: "Are you a verified buyer?" / "Registration is pending. I submitted last week."
C03 → C04: "My submission is in the queue." / "I'll be assigned to review it."
C07 → C09: "How many farmers are active in Meru County?" / "Checking the live registry."
C06 → C01: "The group has twelve members now." / "Have they all submitted documents?"
C05 → C08: "Can institutions request bulk portfolio reports?" / "Contact the administrator for access."
```

**Act 2 — Connection (verification occurs)**

```
C02 → C01: "Your Trust Score is visible on the listing." / "It reflects six completed orders."
C04 → C03: "Your peer review is complete. Two annotations." / "I'll revise section three."
C09 → C07: "The audit report for Q2 is available." / "I'll share it with the field team."
C01 → C06: "Current price for maize in Nairobi?" / "Market benchmark updated this morning."
C08 → C05: "The reviewer's credentials are on record." / "I'll flag this for our hiring team."
C02 → C09: "Payment held pending dispatch confirmation?" / "Yes. M-Pesa releases on delivery."
C03 → C04: "The revision is complete. Resubmitting now." / "I'll review within 48 hours."
C06 → C01: "Group order confirmed. Dispatch Friday." / "I'll mark my listing as reserved."
```

**Act 3 — Activity (transactions happen)**

```
C01 → C02: "Order dispatched. Confirmation sent." / "Payment released. Thank you."
C04 → C03: "Revision accepted. Portfolio entry created." / "The hash is visible now?"
C04 → C03: "Yes. It cannot be altered." / "That's what the employer needs to see."
C05 → C08: "I verified three entries this morning." / "The review chain is intact."
C07 → C09: "Impact metric: forty-two first-time transactions." / "Regional coverage expanding."
C06 → C01: "Three new farmers joined the cooperative." / "All submitted verification docs?"
C06 → C01: "Pending. Two have land documentation." / "The third needs support."
C02 → C09: "The seller's Trust Score dropped after a dispute." / "The dispute record is public."
C08 → C05: "Our institution verified eleven portfolios this term." / "All peer-reviewed?"
C08 → C05: "Yes. Lecturer credentials recorded for each." / "This is what we needed."
```

**Act 4 — Community (ecosystem is stable)**

```
C01 → C02: "I have fifteen active listings this season." / "I follow your Trust Score."
C03 → C05: "My portfolio has seven verified entries." / "Your reviewer is listed on each."
C06 → C01: "The cooperative placed a bulk order for next week." / "Noted. I'll set aside stock."
C07 → C09: "The methodology is disclosed on the transparency page." / "Available in the audit log."
C04 → C03: "You reviewed your first peer submission today." / "It felt important."
C02 → C01: "Twenty-third order. Fastest delivery yet." / "Trust makes things simpler."
C09 → [ALL]: "Verification queue processing. Next review in 4 hours." / [no response — ambient]
C05 → C08: "The talent we need is in this portfolio." / "We found them through verification."
```

### Educational Mapping

| Feature | Taught by conversation(s) |
|---------|--------------------------|
| Trust Score | C02→C01 (Act 2), C02→C01 (Act 4), C02→C09 (Act 3) |
| M-Pesa escrow | C02→C09 (Act 2) |
| Farmer verification | C01→C02 (Act 1), C09→C07 (Act 1) |
| Portfolio system | C04→C03 (Act 2), C03→C05 (Act 4) |
| Peer review | C04→C03 (Act 1), C03→C04 (Act 2) |
| Document hash | C04→C03 (Act 3) |
| Dispute records | C02→C09 (Act 3) |
| Cooperative orders | C06→C01 (Acts 2–4) |
| Transparency | C07→C09 (Act 4) |
| Admin accountability | C09 ambient (Act 4) |

---

## 5. Story Progression — Scroll Map

The section is pinned for the full scroll distance. Scroll drives story, not time.

**Section height:** `500vh` (pinned canvas = `100vh`)

| Scroll % | Story event |
|----------|-------------|
| 0% | Scene begins — only C09 (Administrator) and the central object visible |
| 5% | C01 (Farmer) enters from lower-left |
| 10% | C02 (Buyer) enters from lower-right |
| 14% | C06 (Cooperative Leader) enters near C01 |
| 18% | C03 (Student) enters from upper-left |
| 22% | C04 (Lecturer) enters behind C03 |
| 25% | C05 (Employer) enters from upper-right — **Act 1 complete** |
| 26% | C07 (NGO Rep) enters from upper-center |
| 28% | C08 (Institution Rep) enters near C05 |
| 30% | First conversations begin |
| 35% | Connection lines begin appearing between characters — **Act 2 begins** |
| 40% | Central object first pulse event (first verification) |
| 45% | Transaction pulse between C01 and C02 |
| 50% | Portfolio verification pulse between C03, C04, C05 — **Act 2 complete** |
| 55% | Multiple simultaneous conversations — **Act 3 begins** |
| 60% | Connection web is fully illuminated |
| 70% | Central object at full luminosity |
| 75% | Cooperative group order completion pulse — **Act 3 complete** |
| 80% | Conversations slow to 1 at a time — **Act 4 begins** |
| 85% | Characters settle into their final cluster positions |
| 90% | Ecosystem at full rest — all connections lit |
| 100% | Final ambient state: ecosystem alive and stable |

---

## 6. Visual Language

### Palette (3D scene — distinct from UI palette)

| Role | Hex | Usage |
|------|-----|-------|
| Scene background | `#0d1014` | Slightly deeper than hero `#131619` — the ecosystem exists in its own space |
| Ground plane | `#161b20` | A very subtle disc, matte |
| Central object — base | `#c8c2ba` | Same as spine color in D01 |
| Central object — emit | `#56a8a2` | Teal glow, same as UI teal |
| Connection lines | `#39414a` | Low opacity (0.3), become `#56a8a2` at 0.6 opacity when active |
| Conversation bubble bg | `rgba(19,22,25,0.92)` | Near-black, glassmorphic |
| Bubble border | `#39414a` | UI border color |
| Bubble speaker text | Character primary color | |
| Bubble content text | `#c8c2ba` | Warm off-white |
| Transaction pulse | `#f2f0ec` | Brief, bright, 0.8s fade |
| Verification pulse | `#56a8a2` | Teal, 1.2s fade |

### Lighting Philosophy

Three-point lighting with a narrative purpose:

1. **Key light:** `#f2f0ec`, directional, slightly above, from the direction of the central object — everything is lit by the platform
2. **Fill light:** `#8a919a`, low intensity (0.2), from the opposite side — no character is in full shadow
3. **Rim light:** `#2e7d78` (teal), from behind characters — separates them from the dark background, subtly connects them to the platform color

Point lights on each character's position at very low intensity using their primary color — they emit their own light. This reinforces that each person brings something to the ecosystem.

### Rendering Style

- `MeshStandardMaterial` throughout — no custom shaders in the first implementation
- `ACES Filmic` tone mapping on the renderer: `THREE.ACESFilmicToneMapping`
- Exposure: `1.1`
- No post-processing in the first implementation (no bloom, no DOF) — the scene must be stable before effects are layered
- Anti-aliasing: MSAA x2 (using `antialias: true` on WebGLRenderer)
- Shadow maps: disabled (cost not justified, ambient occlusion handles depth)

---

## 7. Asset Requirements

### 7.1 Characters (9)

Each character is a single merged `BufferGeometry` produced in Blender or via Three.js procedural geometry. Polygon budget per character: **800–1200 triangles**. This is a hard limit.

Character geometry is identical in structure across all 9. The only differences are:
- Primary color (via material parameter)
- Prop geometry (a separate child mesh)

This means: **one rigged base geometry + 9 material variants + 9 prop meshes** = the character system.

No skeletal animation. All animation is driven by shader uniforms and Three.js Object3D transforms via GSAP.

**Prop designs:**

| Character | Prop | Geometry |
|-----------|------|----------|
| Farmer | Land document | Thin flat box (0.3 × 0.4 × 0.02) |
| Buyer | Purchase order | Thinner flat box (0.25 × 0.35 × 0.015) |
| Student | 3 project documents | Three micro-boxes in a cluster |
| Lecturer | Academic credential | Hexagonal disc (flat cylinder, 8 sides) |
| Employer | Portfolio panel | Vertical thin box (0.2 × 0.5 × 0.02) |
| Cooperative Leader | Group network | 5-node line structure (LineSegments) |
| NGO Rep | Audit grid | 3×3 line grid (LineSegments) |
| Institution Rep | Institutional seal | Cylinder with ring (torus around it) |
| Administrator | Verification queue | Torus orbiting at 0.4 radius |

### 7.2 Central UmojaHub Object

**Form:** A low-poly dodecahedron (12 faces) at approximately 0.6 units radius.

A dodecahedron is chosen because:
- 12 faces: one for each month, one for each type of user relationship — implicitly meaningful
- Pentagons as faces: the pentagon is nature's coordination shape (found in biological systems, optimal packing)
- Low-poly: the sharp edges read as designed, not organic — it is infrastructure, not decoration
- Rotates cleanly without visual aliasing

Inside the dodecahedron: a smaller icosahedron (`wireframeGeometry`) in teal, contra-rotating at 60% the speed of the outer shell. This creates visible complexity through simplicity — two objects, two speeds, one coherent form.

**Materials:**
- Outer: `MeshStandardMaterial`, `#c8c2ba`, roughness 0.15, metalness 0.85, wireframe: false
- Inner: `MeshStandardMaterial`, `#2e7d78`, roughness 0.0, metalness 1.0, wireframe: true
- Emissive on outer: `#56a8a2`, intensity `0.05` baseline, pulses to `0.35` on verification events

**Animation:**
- Outer: slow Y-axis rotation, 0.03 rad/frame (about 1 revolution per 3.5 minutes)
- Inner: slow Y+X combined rotation, 0.05 rad/frame
- On verification event: scale pulse (1.0 → 1.12 → 1.0 over 0.8s, ease out-in)
- On transaction event: brief teal ring emission (a torus at equator, expands from 0.6 to 1.5 radius, fades over 0.6s)

### 7.3 Environment

**Ground disc:** A flat circle geometry (radius 8 units, 64 segments) at y = -0.8. Color: `#161b20`. No texture. MeshStandardMaterial, roughness 1.0, metalness 0.0.

**Connection lines:** `Line2` from drei (supports linewidth > 1). Each connection is drawn between pairs of characters that have exchanged at least one conversation. Lines are invisible in Act 1, appear gradually in Act 2, become fully lit by Act 3.

**Fog:** `FogExp2`, color `#0d1014`, density `0.045`. This softens character edges at the scene boundary without a hard cutoff.

---

## 8. Three.js Architecture

### Scene Graph

```
<Canvas>
  ├── <OrbitCameraRig />           — driven by scroll progress, not user input
  ├── <SceneLighting />            — three-point + character point lights
  ├── <Fog />
  │
  ├── <CentralObject />            — dodecahedron + inner icosahedron
  │
  ├── <GroundDisc />
  │
  ├── <CharacterGroup>             — 9 character instances
  │   ├── <Character id="C01" />  — base geometry + prop + point light
  │   ├── <Character id="C02" />
  │   └── ... (C03–C09)
  │
  ├── <ConnectionWeb />            — LineSegments between character pairs
  │
  ├── <ConversationSystem />       — manages bubble lifecycle
  │   └── <ConversationBubble />  — per active conversation
  │
  └── <EventSystem />             — listens to scroll progress, emits events
```

### State Model

A single `useEcosystemStore` (Zustand or useReducer — Zustand preferred for this complexity) manages:

```typescript
interface EcosystemState {
  scrollProgress: number;           // 0–1 mapped from GSAP ScrollTrigger
  act: 1 | 2 | 3 | 4;
  charactersVisible: CharacterId[];
  activeConnections: [CharacterId, CharacterId][];
  activeConversations: Conversation[];
  verificationEvents: VerificationEvent[];
  reducedMotion: boolean;
}
```

The `EventSystem` component translates scroll progress into state updates. All components read from this store — no prop drilling.

### Camera

Camera does not orbit (the D01 diagram orbits — this scene should not). 

Camera position: fixed at `[0, 4.5, 10]`, looking at `[0, 0.5, 0]`. FOV: 42.

**Why no orbit:** The 9 characters are spread across the scene. An orbiting camera would constantly move characters behind the viewer. A fixed camera with a slightly elevated angle provides a stable "audience perspective" — the visitor watches the ecosystem, they do not move through it.

In Act 4, a very slow dolly: camera z moves from 10 to 8.5 over the entire 20% scroll range — an almost imperceptible push-in that creates a sense of drawing closer to the community without calling attention to itself.

### Renderer Configuration

```typescript
<Canvas
  dpr={[1, 1.5]}
  gl={{
    antialias: true,
    powerPreference: 'low-power',
    toneMapping: THREE.ACESFilmicToneMapping,
    toneMappingExposure: 1.1,
  }}
  camera={{ position: [0, 4.5, 10], fov: 42 }}
  frameloop="always"
>
```

---

## 9. Motion Architecture

### GSAP Integration

The scroll progress value is the single source of truth for all scene state. GSAP ScrollTrigger reads the pinned section's scroll position and writes a normalized `progress` value (0–1) to the Zustand store via a `ScrollDriver` component outside the canvas.

```typescript
// ScrollDriver.tsx (outside Canvas)
useEffect(() => {
  const trigger = ScrollTrigger.create({
    trigger: sectionRef.current,
    start: 'top top',
    end: 'bottom bottom',
    scrub: 1.5,           // lag for smooth feeling
    onUpdate: self => {
      useEcosystemStore.getState().setScrollProgress(self.progress);
    },
    pin: sectionRef.current,
  });
  return () => trigger.kill();
}, []);
```

### Character Animation Rigs

Character position and rotation are driven by GSAP timelines anchored to scroll progress. Positions are defined in a static config file:

```typescript
// ecosystem.config.ts
export const CHARACTER_POSITIONS = {
  C01: {
    entry: [-4.5, 0, 1.5] as Vector3Tuple,     // off-screen entry point
    act1:  [-3.2, 0, 0.8] as Vector3Tuple,
    act2:  [-2.8, 0, 0.5] as Vector3Tuple,
    act4:  [-2.5, 0, 0.3] as Vector3Tuple,     // settled final position
  },
  // ... all 9 characters
};
```

GSAP `gsap.to()` calls interpolate between these waypoints as scroll crosses act boundaries. `ease: 'power2.inOut'` for all character movement.

### Conversation Bubble Animation

Bubbles are React components rendered in the DOM (not in the Three.js canvas) positioned using `useFrame` + `project` from drei's `Html` component. This allows full CSS and font rendering without texture baking.

```typescript
<Html
  position={bubbleWorldPosition}
  center
  distanceFactor={6}
  occlude
>
  <ConversationBubble conversation={conv} />
</Html>
```

Bubble appear/dismiss animations are CSS transitions on the wrapper element, not GSAP — simpler and more predictable at this scale.

---

## 10. Scroll Choreography — Detailed

**Pin behavior:** The `section` element is `500vh` tall. A sticky inner `div` (100vh, `position: sticky`, `top: 0`) contains the canvas. GSAP ScrollTrigger additionally pins the section for scroll-scrub precision.

**Scroll milestones as GSAP ScrollTrigger triggers:**

```
0%    → Set act = 1, show C09 and central object
5%    → C01 enters (gsap.to position from entry → act1)
10%   → C02 enters
14%   → C06 enters
18%   → C03 enters
22%   → C04 enters
25%   → C05 enters (Act 1 complete)
26%   → C07 enters
28%   → C08 enters
30%   → First conversation (C01→C02: Act 1 pool)
35%   → Connection lines begin fading in (Act 2)
40%   → First verification pulse on central object
45%   → Transaction pulse C01↔C02
50%   → Portfolio verification pulse C03↔C04↔C05 (Act 2 complete)
55%   → Act 3 — multiple simultaneous conversations
60%   → All connection lines visible
70%   → Central object at max luminosity
75%   → Cooperative pulse (Act 3 complete)
80%   → Act 4 — single conversations, slow
85%   → Characters move to final cluster positions
90%   → Full connection web
100%  → Ecosystem stable — ambient only
```

---

## 11. Mobile Strategy

### Detection

```typescript
const isMobile = useMediaQuery('(max-width: 768px)');
const isLowEnd = navigator.hardwareConcurrency <= 4;
```

### Mobile Scene — Simplified Version

On screens narrower than 768px, a fundamentally different scene renders:

- **4 characters only:** C01 (Farmer), C02 (Buyer), C03 (Student), C09 (Administrator)
- **No connection web** (performance cost too high on mobile GPU)
- **Central object only:** dodecahedron outer shell, no inner icosahedron
- **1 conversation at a time** (no overlapping bubbles)
- **Camera:** slightly closer, FOV 52 (wider for smaller screen)
- **No fog** (removed for performance)
- **Scroll-to-story still applies** but with simplified act structure (2 acts instead of 4)
- **DPR capped at 1** (`dpr={[1, 1]}`)

### Very Low-End Fallback (hardwareConcurrency ≤ 2 OR no WebGL2)

A static 2D SVG illustration is shown instead of the Three.js scene. This SVG should be designed in Figma and exported — it shows the 9 character silhouettes arranged around the central object, with 3 static conversation bubbles. No animation.

---

## 12. Performance Strategy

### Budgets

| Metric | Target | Hard Limit |
|--------|--------|------------|
| Triangle count | ~18,000 | 30,000 |
| Draw calls | ~35 | 60 |
| Texture memory | 0 MB | 8 MB |
| JS bundle (Three.js excluded) | < 40 KB | 60 KB |
| Time to First Interactive | < 1.2s on mobile 4G | 2s |
| Sustained FPS (desktop) | 60 | 45 minimum |
| Sustained FPS (mobile) | 30 | 25 minimum |

### Loading Strategy

The canvas is not loaded until the user scrolls to within 400px of the section (`IntersectionObserver` with root margin `-400px 0px`). Before that, a static placeholder is shown: the background color with the section title only.

```typescript
<Suspense fallback={<EcosystemSkeleton />}>
  <EcosystemScene />
</Suspense>
```

`EcosystemScene` is dynamically imported with `ssr: false` via the same Client Component wrapper pattern used for D01Diagram.

### Instancing

All 9 characters share one base `BufferGeometry` instance (`useMemo` at the scene level). Only the transform and material color differ per character.

The conversation bubble DOM elements are removed from the DOM when not visible — not just hidden — to avoid accumulating layout nodes.

### Memory Management

On section exit (IntersectionObserver fires out), the canvas suspends (`frameloop="never"`) to stop GPU work. On re-entry, it resumes. Geometry and materials are never disposed mid-session — only on full component unmount.

---

## 13. Accessibility Strategy

### Reduced Motion

`prefers-reduced-motion: reduce` is detected via `window.matchMedia` in a `useReducedMotion` hook. When active:

- All character movement is instantaneous (no interpolation)
- No breathing animation
- No pulse events
- Conversations appear and dismiss instantly (no fade transition)
- Central object does not rotate — it is static
- Connection lines are all shown immediately at Act 4 opacity

The scene is still rendered and readable — reduced motion does not degrade to a blank screen.

### Screen Reader

The canvas element has `aria-hidden="true"`. Adjacent to the section, an `sr-only` div contains a structured text description:

```html
<div class="sr-only">
  <h2>The People Behind The Platform</h2>
  <p>
    UmojaHub is a verification infrastructure connecting nine types of participants:
    farmers, buyers, students, lecturers, employers, cooperative leaders,
    NGO representatives, institution representatives, and administrators.
    These participants interact through verified transactions, portfolio reviews,
    audit reports, and coordinated group orders — all anchored by human decision-makers.
  </p>
  <p>Sample platform conversations:</p>
  <ul>
    <li>Farmer to Buyer: "Your Trust Score is visible on the listing." — "It reflects six completed orders."</li>
    <li>Lecturer to Student: "Revision accepted. Portfolio entry created." — "The hash is visible now?"</li>
    <li>NGO to Administrator: "The audit report for Q2 is available." — "I'll share it with the field team."</li>
  </ul>
</div>
```

### Keyboard Navigation

The section is non-interactive — no focusable elements within the canvas. Tab order skips over the canvas entirely. The `sr-only` description is placed before the canvas in DOM order so screen reader users receive the narrative without encountering the canvas.

---

## 14. Asset Production Workflow

### Phase A — Character Concept Design (Figma)

Before any 3D geometry is produced, all 9 character silhouettes must be designed in Figma as flat 2D illustrations. This serves two purposes: (1) the style is validated before 3D investment, and (2) the Figma designs become the reference images for 3D modeling.

Deliverable: A Figma page `04 / Character Concepts` with all 9 characters at three views: front, 45-degree, side.

### Phase B — Central Object Design (Figma)

The dodecahedron + inner icosahedron must be approved in Figma as a 2D projection before modeling. Perspective views, rotation stills, material samples.

Deliverable: A Figma page `04 / Central Object` with design reference frames.

### Phase C — Procedural Geometry Implementation

Character geometry is built procedurally in Three.js, not imported as GLTF. This keeps bundle size minimal and ensures geometry is always consistent with the design system.

Prop geometry is also procedural. No external files are needed for the initial implementation.

### Phase D — Conversation Content Review

All 30 scripted conversations in Section 4 of this document must be reviewed for:
- Accuracy (do they correctly represent platform behavior?)
- Tone (do they feel like real people, not marketing copy?)
- Educational completeness (is every major platform feature taught?)

This review is a human task, not a code task.

### Phase E — Mobile SVG Fallback Design

The 2D SVG fallback is designed in Figma alongside the 3D work. It is produced and exported before the Three.js scene ships — it is the safety net.

---

## 15. Figma Integration Strategy

### Design System Bridge

The 3D scene uses the same color tokens as the website design system. The palette in Section 6 of this document maps directly to Figma variable names. No color value appears in the Three.js code without a corresponding Figma variable.

### The `04 / Character Concepts` Figma Page

This page is created before any code is written. It contains:
- Character silhouette concepts (all 9)
- Prop designs (all 9)
- Central object design studies (3–5 directions)
- A composition mock showing all characters arranged in the scene (flat 2D projection)
- Conversation bubble design (the `RoundedBox + Html` widget, as a Figma component)

### Review Gate

The architecture document is complete when this file exists and is approved.  
The Figma `04 / Character Concepts` page is complete when the character designs are approved.  
Implementation begins only after both approvals.

---

## Open Decisions

These items require a human decision before implementation can begin:

| # | Decision | Options | Impact |
|---|----------|---------|--------|
| 1 | Section title | "The People Behind The Platform" / "The Ecosystem" / "Nine Participants. One Platform." | Copy on page |
| 2 | Section background | `#0d1014` (deeper dark) vs `#f5f4f0` (light — high contrast from D01's dark) | Lighting setup changes |
| 3 | Central object final form | Dodecahedron (proposed) / Other geometric form | Core 3D asset |
| 4 | Character silhouette approval | Via Figma — Phase A deliverable | All character geometry |
| 5 | Conversation content approval | Via Section 4 review | All bubble text |
| 6 | Mobile experience depth | Simplified 4-character version vs. full 2D SVG only on mobile | Engineering effort |

---

*Architecture complete. No implementation proceeds until open decisions are resolved.*
