# UmojaHub Storyworld V2 — Experience Architecture
**Working title:** "The Commons"
**Tagline (internal):** *You don't read about UmojaHub. You spend time inside it.*
**Position:** Homepage — replaces the V1 Witness section in place
**Status:** Architecture draft. No implementation until approved.

---

## What V1 Got Right — and What V2 Rejects

V1 ("Before They Trusted Us, They Had Questions") was a theatre. The visitor sat in a balcony seat, the lights dimmed, and eight people crossed a stage. The dialogue was honest, the structure was clean, and the Council Ring payoff worked.

But a theatre has one fatal property: **the audience is not in the play.**

V2 rejects the following V1 assumptions explicitly:

| V1 Assumption | Why It Fails | V2 Replacement |
|---|---|---|
| The visitor is an audience member | Watching is forgettable; doing is memorable | The visitor is a *presence in the world* — noticed, responded to, remembered |
| One fixed camera, one stage | A single vantage point makes a world feel like a diorama | A path through eight districts; the camera *walks*, the world surrounds |
| Characters exist only during their episode | Characters who despawn make the world feel like a slideshow | Every character persists, settles into their district, and keeps living |
| The world moves only when scroll moves | A scroll-frozen world is a paused video, not a place | Two clocks: scroll directs the story, real time keeps the world alive |
| Dialogue is the payload; visuals decorate it | Words evaporate; consequences persist | Every answer triggers a permanent, visible change in the world |
| The Guide is an abstraction | An abstract guide belongs to no one | The Guide **is the Administrator** — the eighth resident, a real platform role |
| The Arch is a destination | A destination is passive; a heart is generative | The Arch becomes **The Ledger** — a structure that visibly accumulates everything that happens, including what *you* do |
| Interaction is forbidden ("experiential, not interactive") | This is the single biggest ceiling on memorability | Interaction is the medium. Curiosity is the mechanic. Discovery is the reward |

One sentence governs everything below:

> **The world remembers.** Every conversation, every verification, every visitor interaction writes a permanent visible trace into the world. By the end, the world the visitor leaves is not the world they entered — and they helped change it.

---

## 1. World Architecture

### 1.1 The Concept

The Commons is a small settlement at dusk, built around a central structure where trust becomes operational. It is not a plaza with a stage. It is a **place with districts** — eight of them, one per role — connected by a single luminous path.

The visitor does not watch the Commons from a balcony. The visitor **walks the path**. Scroll is the walk.

### 1.2 Physical Layout

The world is a disc of dark ground, ~30 units across, dissolving into fog at its edge (`FogExp2`, `#0d1014`, density tuned per tier).

- **The Path:** a continuous curve — a flattened spiral — that enters the world at its outer edge, passes through or beside all seven outer districts, and terminates at the center. Rendered as a faint inlay in the ground (`#1e252e`), brightening to a low glow (`#2a4a48`) in the segment the camera currently occupies. The Path is the spine of the camera dolly and the literal shape of the narrative: *every story leads inward.*
- **Seven outer districts**, arranged radially at 9–12 units from center, each a 4–5 unit pocket of geometry, light, and activity (detailed in §3).
- **The center: The Ledger** — the Administrator's domain and the heart of the world (§1.4).
- **District thresholds:** where the Path enters a district, the ground inlay takes on that role's signature color for ~1.5 units. You feel territory change before you see it.

### 1.3 Two Clocks — The Core Liveness Principle

The world runs on two independent clocks:

1. **The Story Clock (scroll-driven).** Camera position along the Path, episode progression, narrative dialogue, demonstrations. Scrubbing back rewinds camera and dialogue — but *not* world state (see §1.5).
2. **The World Clock (real time).** Ambient behaviors never stop: characters shift weight, props rotate, couriers carry crates between districts, lights breathe, completed-episode characters continue their work. When the visitor stops scrolling, the film pauses — **the world does not.**

This is the difference between a paused video and a living place. A visitor who stops mid-scroll to watch should see at least three independent motions within any 5-second window, anywhere in the frame.

### 1.4 The Ledger (evolved from V1's Arch)

The Arch's three rings survive — Identity, Evidence, Verification — but they are no longer a monument. They are the **mechanism at the top of a working structure.**

**Form:** a vertical column, 0.5 units radius, rising 3.2 units from a circular dais. The three V1 rings (outer `#c8c2ba`, middle `#8a8078`, inner teal `#2e7d78` / emissive `#56a8a2`) orbit its crown, rotating exactly as in V1 — that motion language is proven and kept.

**Behavior — the central V2 invention:** every meaningful event in the world writes a **record ring** into the column — a thin band of light (0.012 units tall) that slides down from the crown and stacks permanently onto the column, colored by the role that generated it.

Record rings are written when:
- A demonstration completes (verification, payment escrow, portfolio review…)
- A character settles into their district at episode end
- **The visitor discovers a hidden record (§4.6)**
- **The visitor completes any first-time interaction** (first inspect, first follow-up question, first character moment)

By the finale, the column carries 30–45 rings — a visible, scrollable history of the session. Some of those rings exist *only because this visitor was curious.* That is participation made permanent.

**Symbolism:** V1's Arch asked "Are you ready to be known?" The Ledger answers a different question: *"What happens after you are known?"* You become part of a record that outlasts the moment.

### 1.5 World State Is Monotonic

Scroll can scrub the camera backward; it cannot un-happen events. Once a verification fires, a connection forms, a ring writes, a character settles — that state persists for the rest of the session. Scrolling back up shows the *changed* world from an earlier vantage point. This single rule does more for "alive" than any animation: places accumulate history; videos reset.

### 1.6 Environmental Progression

| World state | Visual condition |
|---|---|
| Arrival | Only the Ledger crown and the Path's first segment are lit. Districts are silhouettes with one or two points of ambient activity each — visible but unexplained. The world *precedes* you. |
| Per settled episode | That district's working lights come on; its resident begins their loop; a faint **connection filament** (§3.9) extends from the district to the Ledger |
| 4 episodes | Ambient base light +12%; courier traffic between completed districts begins |
| 7 episodes | All filaments active; the Ledger column's accumulated rings cast collective light onto the ground |
| Finale | The Commons at full life — not bright, *inhabited* (§5.6) |

---

## 2. Character Architecture

### 2.1 The Cast

Eight residents. Seven arrive over the course of the story; one was always here.

| # | Role | Color | District | Core anxiety |
|---|---|---|---|---|
| R1 | Farmer | `#8B5E3C` warm earth | The Fields | "Brokers know the buyer. I don't." |
| R2 | Buyer | `#4A5568` slate | The Depot | "I paid once for produce that never matched the listing." |
| R3 | Student | `#5B7FA6` aspirational blue | The Studio | "My work is real. I can't prove it." |
| R4 | Lecturer | `#6B7280` authority gray | The Review Chamber | "I want my judgment to count — and be on record." |
| R5 | Employer | `#374151` professional dark | The Bureau | "Every portfolio claims everything. I trust none of them." |
| R6 | Cooperative Leader | `#5C7A4A` forest | The Circle | "I answer for fourteen people, not one." |
| R7 | NGO Representative | `#7C6B9A` mission violet | The Field Station | "Funders need proof, not stories." |
| R8 | **Administrator** | `#2e7d78` teal (platform) | The Ledger | None — their burden is *being accountable to everyone else's.* |

The V1 Guide and the V1 Institution Rep are both retired. The **Administrator absorbs the Guide's function** and makes it honest: the person who answers your questions on UmojaHub is not a mascot — it is a named human with a real role (the platform's actual ADMIN role), whose name goes on every verification. The character *is* the transparency claim.

### 2.2 Recognition Geometry

Procedural geometry only (no GLTF). Each role must be identifiable in silhouette at 12 units distance. The existing role-specific recognition geometry work (commit `57b8c50`) is the foundation; V2 adds the requirement that **the prop is now a tool, not a badge** — it gets *used* in the district loop (the Farmer's tablet gets consulted at the scale; the Lecturer's hexagonal credential gets pressed onto reviewed work like a seal).

The Administrator: 1.8 units tall (others 1.5), base material `#2a3540`, breathing teal emissive (4s cycle, intensity 0.06 ↔ 0.10), and the miniature inner ring orbiting their left side — all retained from V1's Guide. New: the mini-ring occasionally detaches, flies to the Ledger crown, circles it once, and returns. The steward and the structure are one system.

### 2.3 The Behavior State Machine

Every character runs a five-state machine, evaluated on the World Clock:

```
DORMANT ──(episode approach)──▶ ARRIVING ──▶ ENGAGED ──▶ SETTLING ──▶ RESIDENT
                                    │            │
                                    └── AWARE ◀──┘  (visitor proximity, any state except DORMANT)
```

- **DORMANT:** off-stage; a faint silhouette at the world's edge near their future path (the world hints at who is coming).
- **ARRIVING:** path-following toward conversation position. Glide locomotion (V1's proven `power2.inOut` interpolation) with added **gait personality** (§7.3).
- **ENGAGED:** in dialogue. Orients to interlocutor, emissive 0.04→0.10, subtle scale 1.03. Idle micro-motions continue underneath (no statue freezing).
- **SETTLING:** the walk to their district (not to a council ring — to *their own place*), 3.5–4s.
- **RESIDENT:** runs their **district loop** (§3) forever after. This is the headline change: completed characters do not become a glow at a ring position. They go to work.

### 2.4 AWARE — Characters Notice You

The cursor casts a soft presence into the world (§4.2). When it dwells within a character's awareness radius (~1.6 world units, raycast-projected) for >300ms:

- Head turns toward the presence (max 30°, spring-damped, 0.6s)
- Emissive +0.03
- Their prop performs a single acknowledgment beat (tablet tilts up, cubes pause their orbit, seal glints)
- After 4s of continued attention, one **aside line** may appear (§6.5) — once per character per session

When attention leaves: a 1.2s relaxation back to their loop, with follow-through — they return to work the way a person does, not the way a video resumes.

This is the cheapest, highest-yield aliveness mechanic in the entire document. A world that looks back at you is alive by definition.

### 2.5 The Ambient Cast

Beyond the eight protagonists: 6–10 **ambient figures** (Tier 1 only; instanced, simplified two-piece geometry, 200 triangles each, no dialogue, no awareness). Couriers walking crates along the Path between settled districts; a second farmer working a far crop row; a figure reading at the Field Station. They exist for one reason: a world with exactly eight inhabitants is a cast; a world where un-named people are also busy is a *place*.

---

## 3. Environment Architecture

Each district is a mini-world that teaches the role by **showing the role's work**. Rules for all districts:

1. Every district has a **working loop** — a 12–25 second ambient cycle that runs on the World Clock once its resident settles, and at reduced intensity even before (run by ambient cast or by the props themselves).
2. Every district has 2–4 **inspectables** (§4.4) — objects that open a fact card grounded in the real platform.
3. Every district contains exactly one **hidden record** (§4.6).
4. District props are platform-true: nothing decorative that doesn't map to a real mechanism (M-Pesa escrow, document hashing, named verification, dispute records, audit logs, group orders).

### 3.1 The Fields (Farmer)

- **Geometry:** four crop rows (instanced low shrubs with slow growth scale-cycling), a weighing scale, three harvest crates, a half-prepared market stall.
- **Loop:** Farmer inspects a row → consults tablet → a crate fills (particles settle into it) → crate moves to the stall → stall lamp brightens one step.
- **Inspectables:** the scale ("Listings carry weight and grade — confirmed at dispatch"), a crate (produce record card), the stall ledger ("Price set by the farmer; market benchmarks visible").
- **Episode consequence:** when payment escrow is demonstrated, a teal escrow filament forms from the Depot to the Ledger to the Fields — and *remains* for the session.

### 3.2 The Depot (Buyer)

- **Geometry:** two evaluation benches, three sample plinths (slowly rotating produce forms), a comparison board (a panel of small glowing entries).
- **Loop:** Buyer lifts a sample → holds it to the light → a verification glyph resolves beside it (✓ shape drawn as geometry, not UI) → entry on the comparison board brightens or dims.
- **Inspectables:** a plinth ("Every listing links to a verified farmer profile"), the comparison board ("Trust Scores are transaction history, not reviews"), a dispute slate ("Disputes are records, public and permanent").
- **Episode consequence:** the Farmer's Trust Score — first shown in Episode 1 — physically *increments* on the comparison board when Episode 2's transaction completes. Cross-episode continuity, made spatial.

### 3.3 The Studio (Student)

- **Geometry:** a workbench with three floating project drafts (the V1 orbiting cubes, now *docked* at the bench), a prototype shelf, a tall thin display spine showing a portfolio entry.
- **Loop:** Student works at the bench → a draft cube rises, rotates, gains an edge highlight → docks onto the shelf → the portfolio spine gains a line.
- **Inspectables:** a draft cube ("Submission hash: the document can never be silently changed" — show a real-looking short hash in IBM Plex Mono), the portfolio spine ("Public URL — readable without an account"), the shelf ("Submission history shows the work, including revisions").
- **Episode consequence:** the reviewed-project card from the dialogue doesn't dissolve (V1) — it **flies to the shelf and docks.** The Studio owns it now.

### 3.4 The Review Chamber (Lecturer)

- **Geometry:** a lectern, a queue rail with two waiting submission forms, a credential wall (small hexagonal tiles, mostly dark).
- **Loop:** a submission form slides from the rail to the lectern → the Lecturer's hexagonal seal presses onto it (the V1 prop, now used) → the form gains a named-review band → returns along the rail toward the Studio direction → one hexagon on the credential wall lights.
- **Inspectables:** the lectern ("Reviewer name + institution on every review"), the queue rail ("Matched by subject area — no quotas"), the credential wall ("Reviews remain on record; affiliations are dated").
- **Episode consequence:** the first sealed review travels visibly along the Path from the Chamber to the Studio shelf. Mentorship as freight.

### 3.5 The Bureau (Employer)

- **Geometry:** a portfolio wall (grid of dim entry tiles), a shortlist rail (three elevated slots), an interview table.
- **Loop:** Employer scans the wall → one tile brightens → its verification chain unfolds beside it (three linked nodes: hash → peer review → named lecturer review) → tile moves to the shortlist rail or dims back.
- **Inspectables:** a wall tile ("The chain doesn't end at the platform — institutional directories are linked"), the shortlist rail ("Two independent assessments, different accountability structures"), the chain nodes (each names its mechanism).
- **Episode consequence:** the Student's docked project from §3.3 is the tile that gets shortlisted. The visitor watches work they saw created get *chosen*.

### 3.6 The Circle (Cooperative)

- **Geometry:** a ring of fourteen low seats around a shared ledger stone; pooled crates at the rim.
- **Loop:** seats illuminate in small clusters (members "arriving") → the ledger stone projects a group order form above itself → the form consolidates fourteen small lights into one → the consolidated order departs along the Path toward the Ledger.
- **Inspectables:** the ledger stone ("One order, fourteen verified members, one cooperative account"), a seat ("Each member is individually verified"), the methodology slab ("Trust Score methodology is published — readable before anyone registers").
- **Episode consequence:** all fourteen seats hold a permanent low glow once the Cooperative settles. The leader spoke for fourteen; the world seats fourteen.

### 3.7 The Field Station (NGO)

- **Geometry:** the impact grid (V1's 3×3 matrix, now a standing field instrument), survey markers staked in a small arc, a report stack.
- **Loop:** markers pulse in sequence (data collection) → points stream from the markers into the grid → the grid reorganizes into a simple chart form → a report sheet slides onto the stack.
- **Inspectables:** the grid ("Impact = completed verified transactions. Registrations don't count."), a marker ("Regional breakdowns by farmer location"), the stack ("Audit requests and responses are both logged").
- **Episode consequence:** after Episode 7, the grid begins drawing live points from *actual world events* — every record ring written to the Ledger also registers as a point streaming into the NGO's grid. The measurement loop becomes literal.

### 3.8 The Ledger Grounds (Administrator)

- **Geometry:** the Ledger column (§1.4), the dais, four low **audit lanterns** around it, an open registry plinth.
- **Loop:** the Administrator circles the column slowly, pauses at a lantern, raises it — a recent record ring's detail glows above the lantern briefly — sets it down. The steward audits their own structure, endlessly. *That is the brand.*
- **Inspectables:** the registry plinth ("Verification record: name of approving administrator, date, evidence reviewed"), a lantern ("Records are hashed; hashes are stored apart from the operational database"), the column itself (a count: "Records this visit: N" — N includes the visitor's own contributions).

### 3.9 Connection Filaments

Every settled district extends one persistent curved filament of light (~0.008 radius tube, role color at 25% emissive) to the Ledger. Couriers and record-pulses travel along filaments on the World Clock. By the finale, the Commons has a visible circulatory system — and its heart is unmistakable.

---

## 4. Interaction Architecture

### 4.1 Design Stance

Interaction is **invited, never required.** A visitor who only scrolls receives a complete story (this is also the accessibility and Tier-3/4 spine). A visitor who explores is rewarded — proportionally, immediately, and permanently. The grammar has five verbs, learned in the first thirty seconds because the world teaches them (§4.7).

### 4.2 The Presence

The cursor projects into the scene as a soft, small light on the ground plane — warm-neutral `#c8c2ba` at very low intensity, 0.4 units radius falloff. It is not a flashlight or a character; it is *attention, made visible.* Characters react to it (§2.4). On touch devices the presence appears at touch points, fading after release.

### 4.3 The Interaction Grammar

| Verb | Input | Target | Result |
|---|---|---|---|
| **Notice** | hover / dwell | character | AWARE state; possible aside line |
| **Inspect** | click / tap | inspectable object | fact card opens (§4.4); first-ever inspect writes a record ring |
| **Ask** | click follow-up chip | active conversation | branch dialogue (§6.4) |
| **Turn** | horizontal drag on ground / scene | world | camera orbits ±18° around current Path point, spring-returns on release |
| **Lift** | press-and-drag on a character | a RESIDENT character | see §4.5 |

No double-clicks, no right-clicks, no modifier keys, no hidden gestures. Five verbs, total.

### 4.4 Inspectables

Clicking an inspectable opens a **fact card**: a DOM panel (drei `<Html>`), anchored to the object, sharing the conversation bubble's visual language (§6.6) but bordered in `#2e363f` with a 1px corner tick in the district color. Content: 1 heading line + 2–3 lines of platform truth + where real, a mono detail (hash fragment, record ID). One card open at a time; opening another closes the first with a soft handoff. Dismiss: click anywhere, Esc, or scroll >5% of a chapter.

Every fact card is real. If the platform cannot honestly support a sentence, the sentence does not ship.

### 4.5 Lifting Characters — Personality Under Pressure

Resident characters can be gently picked up and moved within their district (clamped to a 2-unit radius around their home position; they cannot be removed from their district or thrown).

- **Lift:** character eases upward 0.4 units, prop dangles below them with pendulum physics, their loop pauses, head turns toward the presence.
- **Hold:** subtle sway; after 2s, a once-per-session lifted line may appear (e.g., Farmer: *"Careful. The tomatoes bruise."* Administrator cannot be lifted — attempting it triggers: *"The steward stays with the ledger."* and a polite emissive pulse).
- **Release:** spring-settle to the ground with squash recovery, a beat of re-orientation, then the loop resumes *from where it makes sense*, not from frame zero.

This is the single most "alive" feeling interaction in the experience, and it is bounded enough to never break the story.

### 4.6 Hidden Records — The Curiosity Economy

Eight discoverables, one per district, visually marked only by a faint slow shimmer (a 0.06-emissive flicker on a small ground tile or object — noticeable to a wandering eye, invisible to a scroller). Inspecting one:

1. Plays a 1.5s reveal: the tile lifts, a record form rises from it.
2. Shows one **deep-lore fact card** — the layer beneath the marketing layer (e.g., in the Fields: a record of a *rejected* verification with its reason and resubmission path — the platform showing its failures on purpose).
3. Writes a record ring to the Ledger in white-gold (`#c8c2ba`) — visibly different from story rings.

Finding all eight triggers the **Constellation** (§5.7). The discovery count is shown nowhere — no gamified "3/8" counter. The world knows; the Ledger shows; that is enough.

### 4.7 Teaching Without Tutorials

No overlay instructions, no pulsing "click me" rings. The world demonstrates:

- At ~3% scroll, the Administrator looks directly at the visitor's presence and nods once — establishing "it sees you."
- The first inspectable (the registry plinth, dead ahead at arrival) emits one slow shimmer cycle as the camera passes it.
- The first follow-up chip (§6.4) appears in Episode 1 attached to the bubble itself, styled as part of the comic language.

If the visitor ignores all three, the experience never mentions interaction again. Dignity over engagement metrics.

---

## 5. Narrative Architecture

### 5.1 The Spine

Seven episodes + prologue + finale, traversed by walking the Path. The V1 five-act episode structure survives (Arrival → Question → Demonstration → Shift → Crossing) with one structural change: **Act V (the Crossing) goes to the character's district, not a council ring** — and the district comes alive as they arrive.

Episode order is V1's proven meta-arc, minus the retired Institution episode:

1. **Farmer** (the tangible trade story)
2. **Buyer** (closes the first trust loop — the Farmer's score increments before your eyes)
3. **Student** (the knowledge economy opens)
4. **Lecturer** (judgment goes on record; the sealed review travels to the Studio)
5. **Employer** (the chain is tested with the hardest questions; the Student's work is shortlisted)
6. **Cooperative** (trust at the scale of fourteen)
7. **NGO** (the world's activity becomes measurable proof)

The Administrator carries V1's strongest institutional material (record permanence, hash separation, "if the platform fails, the hashes survive") into the **finale**, where it lands harder — spoken beside a column physically made of records.

### 5.2 The Prologue — Arriving Somewhere That Already Works

0–6% scroll. The camera descends to the Path's outer end. The world is dim but **not asleep**: the Ledger turns, one courier moves in the distance, the Administrator audits a lantern. Critically — *activity precedes the visitor.* Nothing waits for you to begin. Then the Administrator notices the presence, nods (§4.7), and turns toward the first arrival path. The Farmer's silhouette appears at the fog line.

No headline inside the world. The section header above the canvas does the labeling; the world never reads like a slide.

### 5.3 Episode Anatomy (scroll-driven core)

Each episode's mandatory spine plays on scroll exactly as V1 proved out: arrival → 2–3 exchanges → demonstration → crossing. Two V2 upgrades:

- **The demonstration is diegetic.** It happens *in the district and to the district* (§3 "episode consequence"), never as a floating abstract chart. Then it persists.
- **The Shift is embodied.** When the character's questions soften (V1's Act IV), their body language shifts on the same beat — shoulders settle (body cylinder rotation −3°), prop lowers 0.1 units, emissive warms. The visitor reads the decision before the final line confirms it.

### 5.4 Branch Dialogue — Asking Is Participating

Each episode carries 1–2 optional exchanges, accessible only through follow-up chips (§6.4). Branches deepen, never redirect: the Farmer's branch covers dispute timelines; the Employer's covers collusion (V1's sharpest exchange — too good to make mandatory, perfect as a *reward* for the visitor who asks). Branches play in a scroll-paused pocket (§9.4) so they never desync the spine.

### 5.5 Secondary Stories — The World Talks to Itself

After Episode 2, settled residents occasionally interact **with each other** on the World Clock, no visitor input required: the Buyer walks to the Fields' stall and a small wordless exchange occurs (crate → escrow pulse → handshake beat). After Episode 5, the Employer visits the Studio. These vignettes are short (8–10s), wordless, and prove the thesis silently: *the platform exists so these people can transact without the Administrator standing between them.* The hub enables; it does not mediate forever.

### 5.6 The Finale — The Commons at Work

92–100% scroll. The camera completes the spiral, arriving at the Ledger grounds, then performs its only crane move — rising 4 units and turning back outward, showing everything at once: seven lit districts, filaments converging, couriers moving, the column striped with the session's record rings. The Administrator delivers the closing exchange (the record-permanence material), then — keeping V1's best ending beat — turns to face the camera. One final addition: **one last record ring writes as they turn.** This visit, too, was recorded.

### 5.7 The Constellation (hidden finale layer)

If all eight hidden records were found: during the finale crane, the eight white-gold rings rise off the column, ascend above the Commons, and hold as a faint ring of stars for the remainder of the session. Unannounced, unexplained. The visitors who earn it will tell people about it. That is the marketing strategy of this entire feature, condensed.

---

## 6. Conversation Architecture

### 6.1 From Chat Window to Comic Panel

V1 bubbles were positioned DOM cards — clean, but inert. V2 treats every bubble as a **living comic panel** with three properties: it is *anchored* (physically tied to its speaker), *elastic* (it moves, breathes, and reacts), and *consequential* (every Administrator answer is bound to a world event).

### 6.2 Anatomy

- **The panel:** background `rgba(13,16,20,0.94)`, border 1px `#2e363f` (Administrator: `#2a4a48` teal tint — V1's distinction, kept), radius 4px, padding 14×16, max-width 280px.
- **The tail:** no longer a CSS triangle. A short *drawn* connector — a 2-segment polyline rendered in the canvas from panel anchor to speaker's head, in the speaker's color at 40% opacity. It flexes as the character idles. The panel is tied to a living body and looks it.
- **Speaker label:** IBM Plex Mono SemiBold 10px, speaker color, letterspaced — unchanged from V1.
- **Body text:** IBM Plex Mono 11px `#c8c2ba`, line-height 1.6 — unchanged.

### 6.3 Lifecycle Motion

- **Appear:** panel unfolds from its tail point — scaleY 0.6→1 + opacity 0→1 over 0.4s, `cubicBezier(0.16, 1, 0.3, 1)`, with text revealed by a 60ms-staggered line mask (not typewriter — lines, like a comic letterer placing rows).
- **Breathing:** while open, ±1px translateY on a 3.5s sine, phase-locked to the speaker's idle. The panel is part of the body.
- **Reaction:** hover lifts the panel 2px and raises border opacity; if the speaker is in AWARE state the panel leans 1° toward the presence.
- **Dismiss:** fold back along the tail, 0.25s. Question→answer beat stays at V1's 1.2s — that pause reads as a person thinking, and it tested true.

### 6.4 Follow-Up Chips

When a branch exists, the final bubble of an exchange grows a small attached chip — same panel language, 11px mono, speaker-colored left tick: `"And if they dispute it? →"`. Click runs the branch (§5.4); ignored chips fold away with the bubble, no nagging. Chips are part of the comic panel, not buttons floating in space.

### 6.5 Aside and Lifted Lines

One-line micro-bubbles (max 8 words, no tail flex, 2.5s hold) triggered by AWARE dwell or lifting (§4.5). Each character has 2 asides and 1 lifted line, all written in-voice, none expository. Budget: 23 micro-lines total. These never overlap with spine dialogue — the spine always wins contention.

### 6.6 Conversation–Consequence Binding

A hard authoring rule, enforced by the data model (§14.4): **every Administrator answer line carries a `consequence` field naming a world event.** No answer ships without one. The bubble and the world-change fire on the same beat — the answer is *seen* in the same breath it is read. V1 had demonstrations for some lines; V2 makes it a schema-level invariant.

---

## 7. Motion Architecture

### 7.1 Principles

The quality bar is Ramp / Stripe / Linear / Apple / Arc — meaning, concretely:

1. **Mass.** Everything has weight. Nothing starts or stops instantly. Heavy things (crates, the Ledger rings) move slower than light things (record pulses, chips).
2. **Follow-through.** Motions settle; they do not stop. Props overshoot 2–4% and damp back. Characters re-orient after moving.
3. **One hero motion per beat.** When the demonstration fires, ambient motion in that district dims 40% for its duration. The eye is directed, never scattered.
4. **Motion means something.** Every animation answers "what does this teach?" A ring writing to the Ledger teaches permanence. A filament forming teaches connection. If a motion has no answer, it is cut.
5. **Banned:** generic fade-up-on-scroll, card slides, parallax-for-parallax, loop animations with visible reset frames, easing defaults (`power1.out` everywhere reads as template).

### 7.2 The Easing Vocabulary

A fixed palette, used consistently so the world has a recognizable physical character:

| Motion class | Curve | Duration band |
|---|---|---|
| Character locomotion | `power2.inOut` | 2.0–4.0s |
| Panel/chip unfold | `cubicBezier(0.16,1,0.3,1)` | 0.25–0.4s |
| Physical settle (lift release, crate landing) | spring (stiffness 120, damping 14) | natural |
| Record ring write | `power3.in` (drop) → `back.out(1.4)` (seat) | 0.9s |
| Camera (Path dolly) | scrub-driven, smoothed at `scrub: 1.5` | — |
| Camera (finale crane) | `power1.inOut` | 3.5s |
| Ambient loops | sine in/out, phase-offset per instance | 3–25s |

### 7.3 Gait Personality

All characters glide (V1's abstraction, kept), but each glide carries a personality envelope — a low-amplitude modulation on top of the base interpolation: the Student arrives with a 0.7Hz bob (eager), the Cooperative Leader with none and a slower base (weight of fourteen), the Buyer with a brisk start and early arrival deceleration (decisive). Eight characters, eight recognizably different arrivals from the same system. ~30 lines of code; disproportionate life.

### 7.4 Phase Offsetting — The Anti-Loop Rule

No two instances of the same ambient animation may share a phase. Crop rows, lantern breathing, seat glows, filament pulses — all receive randomized phase and ±10% period jitter at mount. Synchronized loops are the #1 tell of a fake world.

---

## 8. Three.js Architecture

### 8.1 Scene Graph

```
<Canvas>
 ├─ <CameraRig/>            — Path-following dolly + drag-orbit offset + finale crane
 ├─ <SceneLighting/>        — base three-point + per-district light groups (toggled by world state)
 ├─ <WorldGround/>          — disc + Path inlay (single mesh, vertex-colored segments)
 ├─ <TheLedger/>            — column + crown rings + RecordRingStack + audit lanterns
 ├─ <Districts/>            — 7 × <District/> (geometry kit + loop driver + inspectables)
 ├─ <CharacterSystem/>      — 8 protagonists (behavior FSM) + <AmbientCast/> (instanced)
 ├─ <FilamentSystem/>       — persistent connection curves + traveling pulses
 ├─ <ConsequenceLayer/>     — transient demonstration effects (pooled)
 ├─ <PresenceLight/>        — cursor projection (raycast → ground plane)
 └─ <ConversationLayer/>    — drei <Html> panels + canvas-drawn tails
```

### 8.2 The Simulation Tick

The World Clock runs as a fixed-step simulation (10Hz) **separate from the render loop**: behavior FSM transitions, district loop scheduling, courier dispatch, vignette triggers, awareness checks. `useFrame` only *renders* current simulation state with interpolation. This separation is what makes Tier 2/3 degradation clean — lower tiers reduce render cost without touching the story logic — and keeps behavior deterministic and testable in plain Jest (no canvas needed).

### 8.3 State Model (Zustand, three stores)

```typescript
// Story Clock — scroll-derived, scrubable
interface StorySlice {
  scrollProgress: number;
  chapter: number;                 // 0=prologue, 1–7 episodes, 8=finale
  chapterProgress: number;
  branchActive: BranchId | null;   // scroll-pause pocket (§9.4)
}

// World Clock — monotonic, never rewinds
interface WorldSlice {
  settled: RoleId[];
  records: LedgerRecord[];         // every ring on the column, in order
  discoveredHidden: DistrictId[];
  firstInteractions: Set<InteractionVerb>;
  consequencesFired: ConsequenceId[];
  vignetteQueue: VignetteId[];
}

// Visitor — input + capability
interface VisitorSlice {
  presence: { worldPos: Vec3 | null; dwellTarget: CharacterId | null };
  lifted: CharacterId | null;
  inspecting: InspectableId | null;
  tier: 1 | 2 | 3 | 4;
  reducedMotion: boolean;
}
```

### 8.4 Rendering Strategy

- **Geometry sharing:** all character base geometry from one `useMemo` set; district kits built from a shared primitive library (~12 primitives) with per-district materials. Ambient cast and crop rows via `InstancedMesh`.
- **LOD by district:** the camera's current district + its two Path neighbors render full loops; far districts run loops at half rate with simplified materials (emissive flat, no roughness variance). Swap is distance-faded, never popping.
- **Raycasting budget:** one raycast per frame, against a dedicated low-poly hit-proxy layer (invisible simplified colliders for characters + inspectables), never against render meshes.
- **Pooling:** consequence effects, record rings, and traveling pulses draw from pre-allocated pools — zero allocation during scroll.
- **DPR** `[1, 1.5]` Tier 1, `[1, 1.25]` Tier 2, `[1, 1]` Tier 3. ACES tone mapping, exposure 1.15 (V1 values, kept).

---

## 9. GSAP Choreography

### 9.1 Structure: One Master, Many Locals

- **The Master Timeline** is scroll-scrubbed (`ScrollTrigger`, pin, `scrub: 1.5` — the shipped V1 driver pattern is retained at `StoryWorldSection` level) and contains only *story-spine* choreography: camera Path position, episode dialogue cueing, demonstrations, crossings. Labeled per chapter (`"ep1.arrive"`, `"ep1.demo"`, …) for debugging and for the keyboard navigation map (§10.3).
- **Local timelines** are time-based and triggered by simulation events: lift/release springs, ring writes, vignettes, fact cards. They are *not* children of the master — scrubbing must never scrub a physical settle in reverse.

### 9.2 Scroll Budget

Pinned section, `760vh` total (V1: 600vh):

| Segment | Budget |
|---|---|
| Prologue | 6% |
| Episodes 1–7 | 12% each (arrival 2 / exchange 3.5 / demonstration 2.5 / shift 2 / crossing + district awakening 2) |
| Finale (crane + closing exchange + tableau) | 10% |

### 9.3 The Hybrid Clock Rule

Scrub controls *when* spine events trigger; spine events that represent physics complete on their own clocks once fired (a ring, once dropping, finishes dropping). Implemented as: master timeline carries zero-duration callbacks at labels; callbacks dispatch simulation events; simulation owns the motion. Scrubbing backward past a label does not re-fire it (World Clock monotonicity, §1.5).

### 9.4 Branch Pockets

When a follow-up chip is clicked, scroll input is soft-locked (the pin holds, wheel deltas accumulate to a max buffer) for the branch's duration (8–14s), then released with the buffer discarded. The visitor chose to stay; the world honors the choice without letting the spine drift. Esc or a second click exits early.

### 9.5 Interrupt Discipline

Priority order when motions contend: **spine dialogue > demonstration > branch > vignette > aside > ambient.** Lower layers duck (dim/pause), never cancel, and resume with follow-through. A vignette interrupted by an episode beat walks back to position — visibly, on the World Clock — rather than teleporting.

---

## 10. Accessibility Architecture

### 10.1 Tier 4 — Reduced Motion Is a First-Class Cut, Not a Disabling

`prefers-reduced-motion: reduce` produces a deliberate experience, designed, not stripped:

- Camera moves by **crossfade between eight fixed Path viewpoints** (one per chapter) instead of dollying.
- Characters appear at positions via 0.4s opacity fades; no locomotion, no lift verb.
- Bubbles appear/dismiss with opacity only; the full dialogue spine, fact cards, follow-up chips, and hidden records all remain — **participation is preserved**, only kinetics are removed.
- Record rings appear in place on the column (no drop). The Ledger still accumulates. The world still remembers.
- All ambient loops freeze at their most legible pose; emissive breathing stops at mid-value.

### 10.2 Screen Reader Narrative

Canvas `aria-hidden`. Preceding `sr-only` region carries the complete experience as prose: section premise, then each episode as a titled block containing the full mandatory dialogue (verbatim, not summarized) plus a one-sentence description of its world consequence, then the finale. Branch dialogue is included inline, marked "In a follow-up exchange…". The SR experience is the screenplay — arguably the purest form of this content.

### 10.3 Keyboard Model

V2 has interaction, so V1's "tab passes through" is no longer acceptable:

- The section is one tab stop, labeled. Entering it enables: `←/→` step between chapter labels (smooth-scrolls the master timeline), `Enter` opens the nearest inspectable's fact card, `B` triggers the available follow-up branch, `Esc` closes/exits.
- Fact cards and chips are real DOM (drei `<Html>`), so they receive genuine focus and screen-reader semantics when opened via keyboard.
- A visually-hidden live region announces chapter changes ("Chapter 3: The Student") and consequence summaries ("A verified portfolio entry was added to the Studio shelf").

### 10.4 Color & Contrast

All text in DOM panels meets 4.5:1 against the panel background (existing `#c8c2ba` on `rgba(13,16,20,.94)` passes). Role colors are never the sole carrier of meaning — district identity is carried by geometry + position + label, color is reinforcement.

---

## 11. Mobile Architecture (Tier 3)

### 11.1 Reframing, Not Shrinking

Portrait phones get a **vertically composed** world: the camera rides higher and closer (FOV 52), framing one district at a time like a comic page panel, with the Ledger visible in the top third throughout as the constant landmark.

### 11.2 Scope

- **5 episodes:** Farmer, Buyer, Student, Lecturer, Employer (the two complete trust loops — trade and knowledge). Cooperative and NGO districts exist as lit set-dressing with one inspectable each.
- Section height `420vh`. Dialogue trimmed to 2 exchanges per episode. One vignette (Buyer→Fields) retained — liveness must survive on mobile.
- Ambient cast removed; district loops simplified to their hero motion only; filaments static (no traveling pulses); DPR `[1,1]`.

### 11.3 Touch Grammar

| Gesture | Result |
|---|---|
| Tap character | AWARE beat + aside (replaces hover) |
| Tap inspectable | fact card (full-width bottom sheet variant of the panel) |
| Tap follow-up chip | branch pocket (scroll-locked, X to exit) |
| Horizontal swipe on canvas | bounded orbit, spring-return |
| — | No lift verb on touch (conflicts with scroll; cut cleanly rather than done badly) |

### 11.4 Floor

`hardwareConcurrency <= 2` or WebGL context failure: the static composed SVG fallback (V1 Phase D asset, recomposed for V2's district layout) with three bubbles and the full SR text. No one gets a broken canvas.

---

## 12. Asset Production Roadmap

All 3D remains procedural — no GLTF. "Assets" means Figma design references, dialogue data, and the primitive library.

**Phase A — World Map & District Kits (Figma page `05 / The Commons`)**
Top-down world map (Path spiral, 7 districts + center, filament routes); per-district kit sheet (props, dimensions, materials, loop storyboard in 3 keyframes); Ledger column elevation with ring-stack states (0 / mid / full / constellation).

**Phase B — Character Behavior Sheets (extends `04 / Character Concepts`)**
Per character: AWARE pose, gait personality note, lifted pose, district work poses (2–3). Administrator sheet replaces the Guide sheet (audit-lantern loop storyboard).

**Phase C — Living Panel Component (Figma component set)**
`PanelParticipant`, `PanelAdministrator`, `PanelAside`, `FactCard`, `FollowUpChip` — states: unfolding / open / hover-lifted / folding. Tail polyline spec.

**Phase D — Consequence Boards**
For each of the 7 episode demonstrations + ring write + filament formation + constellation: 3-keyframe motion boards (start / peak / settled). These are the contract between narrative and Three.js implementation.

**Phase E — Dialogue Data Lock**
Full script as structured data (§14.4): 7 episode spines (reusing V1's dialogue where it survives — most of it does), 9 branches, 23 micro-lines, 24 fact cards, 8 hidden-record cards, finale. Copy-edited and frozen before scene work begins on any episode.

**Phase F — Tier 3/4 Comps**
Mobile vertical framing comps (3 chapters); reduced-motion viewpoint set (8 stills); SVG floor fallback recomposition.

---

## 13. Performance Strategy

### 13.1 Tier Definitions

| | Tier 1 | Tier 2 | Tier 3 | Tier 4 |
|---|---|---|---|---|
| Trigger | desktop, capable GPU | desktop, weak GPU / battery saver / sustained FPS drop | viewport < 768px | `prefers-reduced-motion` (any device) |
| Episodes | 7 | 7 | 5 | matches device tier |
| Ambient cast | 6–10 | 0 | 0 | 0 |
| District loops | full | hero motion only | hero motion only | frozen legible pose |
| Vignettes | all | 2 | 1 | described in live region only |
| Filament pulses | yes | yes | no | no |
| Lift verb | yes | yes | no | no |
| Hidden records | 8 | 8 | 5 | yes (all present in DOM) |
| DPR cap | 1.5 | 1.25 | 1.0 | device tier's cap |

**The story is identical across tiers.** Tiers trade spectacle, never meaning — every tier has dialogue, consequences, the Ledger accumulating, and at least one form of participation.

### 13.2 Budgets (Tier 1)

| Metric | Target | Hard limit |
|---|---|---|
| Peak triangles | 45,000 | 70,000 |
| Draw calls | 60 | 90 |
| JS (excl. three.js core) | 70 KB gz | 100 KB gz |
| Simulation tick cost | < 1.5ms @10Hz | 3ms |
| Sustained FPS desktop / mobile | 60 / 30 | 48 / 24 |
| Time to first world paint | < 900ms from section approach | 1.5s |
| Allocation during scroll | 0 (pooled) | — |

### 13.3 Adaptive Quality Manager

A rolling 120-frame FPS window, evaluated every 2s. Below 48 FPS (Tier 1): shed in order — ambient cast → far-district loop rate → filament pulses → DPR step down → demote to Tier 2. Sheds are one-way per session (no oscillation). Demotions log to the console in dev only.

### 13.4 Loading & Gating

Canvas initializes at `IntersectionObserver` −600px margin; below the fold ships zero Three.js. Dialogue/consequence data is a static JSON chunk (~14 KB gz) loaded with the scene. Districts mount geometry lazily, two chapters ahead of camera. `frameloop` parks when the section leaves viewport; the World Clock suspends and **fast-forwards a capped 10 simulated seconds on re-entry** — the world appears to have continued living while you were away, at no idle CPU cost.

---

## 14. Technical Implementation Strategy

### 14.1 What Survives From the Shipped V1

Keep and evolve: `StoryWorldSection` (ScrollTrigger driver, reduced-motion wiring, sr-only block — extend per §10), the store (split into the three slices of §8.3), `ConversationBubble` (rebuilt visually per §6 but its Html-anchoring approach is proven), `SceneLighting`, `CameraRig` (extended from fixed-with-dolly to Path-following), character recognition geometry (commit `57b8c50`). Replace: `TheArch` → `TheLedger`; `EpisodeManager` → simulation-driven `CharacterSystem` + chapter cueing; `TheGuide` → the Administrator within the character system.

### 14.2 Build Phases

1. **P1 — World & Camera:** ground, Path, district placeholder volumes, Path-following camera over the full 760vh, drag-orbit. *Gate: the walk feels good with gray boxes — if it doesn't, nothing else matters.*
2. **P2 — Simulation Core:** 10Hz tick, behavior FSM, two clocks, monotonic world slice, event bus. Jest coverage on all FSM transitions and monotonicity (pure TS, no canvas).
3. **P3 — The Ledger + record-ring pipeline** (the consequence backbone every later phase writes into).
4. **P4 — Episode 1 vertical slice:** Farmer complete — district kit, loop, full dialogue, demonstration, consequence, settling, inspectables, hidden record, aside, lift. *Gate: full quality review (§15) on this slice before scaling.*
5. **P5 — Episodes 2–7** (production line: kit → loop → dialogue → consequences → review, per episode).
6. **P6 — Connective tissue:** filaments, couriers, vignettes, ambient cast, presence/awareness polish.
7. **P7 — Finale + constellation.**
8. **P8 — Tiers 2/3/4**, adaptive manager, keyboard model, SR region.
9. **P9 — Performance hardening + cross-device QA.**

### 14.3 File Organization

```
src/lib/storyworld/
  simulation/      # tick, FSM, event bus, world state (pure TS — fully unit-testable)
  data/            # episodes.ts, branches.ts, factCards.ts, hiddenRecords.ts, microLines.ts
  store.ts         # three slices
src/components/website/StoryWorld/
  world/           # WorldGround, TheLedger, FilamentSystem, districts/
  characters/      # CharacterSystem, gait, AmbientCast
  conversation/    # Panel, Tail, FollowUpChip, FactCard
  interaction/     # PresenceLight, hit proxies, lift controller
  StoryWorldSection.tsx, CameraRig.tsx, SceneLighting.tsx
```

### 14.4 The Dialogue Data Model

```typescript
interface Exchange {
  speaker: RoleId;
  lines: string[];
  consequence?: ConsequenceId;   // REQUIRED on every Administrator answer (lint-enforced)
  branch?: BranchId;             // attaches a follow-up chip
}
```

A unit test walks all episode data and fails the build if any Administrator answer lacks a `consequence`. §6.6 as CI, not convention.

### 14.5 Testing

Simulation (FSM, monotonicity, contention priority, tier scoping) in Jest — no WebGL needed. Dialogue data integrity (consequence coverage, branch reachability, micro-line budget) in Jest. Visual/motion review is human, against §15. Per CLAUDE.md: `npm run type-check && npm run lint && npm run test` gates every phase.

---

## 15. Experience Quality Benchmarks

The bar is not "impressive." The bar is **inhabited.** Every review gate evaluates against these, in order:

### 15.1 The Liveness Test
Stop scrolling anywhere, for 20 seconds. **Pass:** ≥3 independent motions visible at all times; within the 20s, at least one event with narrative meaning occurs (a loop completes a cycle, a courier passes, a pulse travels). **Fail:** anything reads as paused.

### 15.2 The Look-Back Test
At 80% scroll, scrub back to 20%. **Pass:** the world is visibly different from the first pass through (lit districts, filaments, residents at work, rings on the column) and nothing un-happens. **Fail:** any reset.

### 15.3 The Curiosity Test
Give a first-time visitor no instructions. **Pass:** within 60s of entering, they have hovered a character and seen it notice them; within the full visit, ≥70% of test visitors open at least one fact card; everyone who interacts can articulate that "the tower keeps a record of what happens." **Fail:** anyone asks "was I supposed to click something?" — that means the world taught badly (§4.7).

### 15.4 The Comprehension Test
Afterward, the visitor is asked what UmojaHub does. **Pass:** they describe ≥3 mechanisms (escrowed M-Pesa payment, named human verification, hashed portfolio review, public records, group orders, auditable impact) *in their own words, citing things they saw* — "the teacher stamped the project and it went to the shelf." **Fail:** they describe an animation.

### 15.5 The Motion Bar
Any 10-second screen capture, shown cold to a designer who knows Ramp/Stripe/Linear-grade work. **Pass:** they ask how it was made. **Fail:** they identify a generic scroll-site pattern (fade-up, card slide, unmotivated parallax) anywhere in the clip.

### 15.6 The Feeling Test (the only one that ultimately matters)
The visitor finishes and the section asked nothing of them — no CTA inside the world, no form, no modal. **Pass:** the dominant reported feeling is *"I was somewhere"* — and they scroll back up to look for what they missed. **Fail:** "that was a cool section."

---

## Open Decisions

| # | Decision | Options | Blocks |
|---|---|---|---|
| 1 | Administrator identity | Named ("Amara") / role-titled only | Dialogue attribution, §5.2 nod beat copy |
| 2 | Ambient cast in scope for launch | Yes (Tier 1 only) / defer to V2.1 | P6 scope |
| 3 | Hidden records count on mobile | 5 / 0 (defer) | Tier 3 scope |
| 4 | Section header copy above canvas | "Seven stories" lineage / "Spend five minutes inside" / unlabelled | DOM header |
| 5 | Branch pocket scroll-lock duration cap | 14s / 10s | §9.4 tuning |
| 6 | V1 section retirement | Replace in place / ship V2 behind a flag for A/B | Rollout |

---

*No code, no scenes, no assets until this document is approved and Open Decisions 1–6 are resolved.*

*V1's goal was a visitor who thinks "I understand why this exists." V2's goal is a visitor who thinks "I was there." The first is a conclusion. The second is a memory. Memories are what get retold.*
