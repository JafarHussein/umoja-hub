# UmojaHub Storyworld — Experience Architecture
**Working title:** "Before They Trusted Us, They Had Questions"
**Position:** S5 — between Verification in Practice and Audience Routing
**Status:** Architecture draft. Awaiting approval before any implementation.

---

## Premise

This is not a feature tour.
This is not an animated infographic.
This is not a testimonial carousel.

This is a theatre.

The visitor takes a seat.
The lights dim.
A world appears.

One by one, eight people arrive at the edge of that world.
Each of them has heard about something called UmojaHub.
Each of them is uncertain.
Each of them has a question.

A guide meets them.
Not at the door.
At the moment of doubt.

The guide does not sell.
The guide answers.

And by the end, the visitor does not know about UmojaHub.
They have watched it earn the trust of eight different people.

They understand why it exists because they witnessed what happens without it.

---

## 1. Narrative Architecture

### The Core Dramatic Structure

Every great story is about a transformation.

The transformation in this story is not UmojaHub's.
It is the participant's.

Each of the eight participant stories follows the same five-act structure:

**Act I — Arrival**
A character enters the world from the outside edge.
Their posture communicates: uncertain. Alert. Not hostile, but not open.
They carry their history with them — implied through their prop and movement.

**Act II — The Question**
The participant addresses the Guide.
A comic speech bubble appears.
The question is real, specific, and earned.
It comes from someone who has been burned before, or who understands the stakes.

**Act III — The Demonstration**
The Guide does not just answer in words.
The world responds.
Something moves, lights up, flows, or reveals itself.
The platform's mechanism is made visible — briefly, elegantly.

**Act IV — The Shift**
A second exchange.
The participant's next question is different.
Smaller. Less defensive.
They are beginning to understand.
Sometimes there is a third exchange.
Never more than four.

**Act V — The Crossing**
The participant walks toward the central structure.
Not running. Not rushing.
Steadily. With the quiet confidence of someone who has decided something.
They take their position in the Council Ring.
Their light activates.
The world is slightly brighter.

### The Meta-Arc

The eight stories are not independent.
They build.

Episodes 1–2 (Farmer, Buyer): The first trade relationship. The most tangible story — goods, money, trust between strangers.

Episodes 3–4 (Student, Lecturer): The knowledge economy story. More abstract. What does verified mean in education?

Episodes 5–6 (Employer, Cooperative): The institutional trust story. People who need verification to do their work better.

Episodes 7–8 (NGO, Institution): The accountability story. People who need the platform not just to work — but to *prove* it works.

By Episode 8, the visitor has witnessed trust being built across every dimension: economic, educational, communal, institutional.

The final image — all eight positions in the Council Ring lit — is the visual argument for UmojaHub. Not stated. Demonstrated.

---

## 2. The World

### Physical Layout

The scene exists on a circular raised platform — The Plaza — 14 units in radius.

The Plaza floor is dark stone: `#0f1218`, with faint geometric line inlays radiating outward from the center like meridians on a compass rose. These inlays are `#1e252e`, barely visible, but they give the floor depth and intentionality.

Eight arrival paths extend outward from the Plaza edge into the darkness. Each path is faintly lit by floor-level glow in the participant's signature color. Not bright — a blush of color. Just enough to suggest that each path was made for one specific person.

Beyond the Plaza, fog: `FogExp2`, `#0d1014`, density `0.055`. The world ends softly. There is no horizon — only darkness giving way to characters as they approach.

The camera is fixed: `[0, 6, 12]`, looking at `[0, 0.5, 0]`, FOV `38`. The elevated angle gives a slight "theatre from above" perspective — the visitor watches from the front row of a balcony. The world is visible but intimate.

In Act 4 of any episode (The Shift), the camera executes a single almost-imperceptible push-in: z moves from 12 to 11 over 0.8 seconds. It never returns between episodes. The cumulative effect after all 8 episodes: the camera is at z=7, 4 units closer than it started. By the final episode, the world feels intimate in a way the visitor cannot name but will feel.

### Environmental Progression

The Plaza responds to the number of completed stories.

After 0 episodes: The Plaza is dark except for the central structure and the Guide.
After 2 episodes: The floor inlays near the center faintly glow.
After 4 episodes: The ambient light in the scene increases by 15%.
After 6 episodes: The Council Ring emits a collective ambient glow.
After 8 episodes: The Plaza is fully illuminated — not brightly, but warmly. It looks inhabited.

---

## 3. The Central Structure — The Arch

### Design Philosophy

The structure is called The Arch.

It represents the threshold between unverified and verified existence on the platform.

To enter UmojaHub — truly enter, not just register — a participant must cross a threshold. They must be verified. They must be known.

The Arch is that threshold made physical.

### Physical Description

The Arch consists of three concentric upright rings, each slightly larger than the one before it, all sharing the same vertical axis.

- **Outer Ring:** 2.8 units diameter. Material: `#c8c2ba`, roughness 0.2, metalness 0.85. Rotates slowly clockwise (Y axis, 0.004 rad/frame).
- **Middle Ring:** 1.8 units diameter. Material: `#8a8078`, roughness 0.35, metalness 0.7. Rotates slowly counter-clockwise (Y+X combined, 0.006 rad/frame).
- **Inner Ring:** 0.9 units diameter. Material: teal `#2e7d78`, emissive `#56a8a2`, emissive intensity 0.4. Rotates at 0.009 rad/frame, axis gently precessing.

Each ring is a torus: `TorusGeometry(radius, tube=0.025, radialSegments=8, tubularSegments=64)`.

At the base of the rings, a circular dais: 1.4 units radius, 0.06 units tall. Material: `#1a2128`. This is where participants stand when their story is complete.

### The Council Ring

Surrounding the Arch at a radius of 3.5 units: eight positions, equally spaced, each corresponding to one participant type.

Each position is a small raised disc (0.4 units radius, 0.04 units tall) with a vertical strand of light above it — a thin cylinder, 1.0 units tall, 0.018 units radius — rendered in the participant's signature color at 0% emissive until that participant's story completes, then at 60% emissive.

When all 8 positions are active, the eight strands of light connect at the top to form a brief pulse — a ring of light at y=1.0 that expands and fades, completing the visual sentence: the ecosystem is complete.

### Symbolism

The Arch is not a door.
It is not a gateway in the literal sense.

It is a question: *Are you ready to be known?*

The three rings represent:
1. **Outer:** Identity — who you say you are
2. **Middle:** Evidence — what you can show
3. **Inner:** Verification — what has been confirmed

Every participant who enters has passed through all three.

---

## 4. The Guide

### Character Design

The Guide is the one character the visitor will see in every episode.

They are the face of UmojaHub. Not its logo, not its mascot, not its brand. Its values, made present.

**Form:**
Height: 1.8 units (slightly taller than participants at 1.5 units — enough to register immediately without dominating).
Head: slightly flattened sphere, distinct from participants by its faint ambient glow.
Body: tapered cylinder, `radiusTop 0.24, radiusBottom 0.18, height 0.85`.
Material: `#2a3540` as the base color — dark, neutral, institutional — with a faint teal emissive pulse at 0.06 intensity that breathes on a 4-second cycle.

**The Prop:**
The Guide carries a small floating geometric form near their left side: a miniature version of the Inner Ring from The Arch — a tiny torus, 0.18 units radius, rotating slowly. It represents the verification loop — the core mechanism of everything the Guide stewards.

**Behavior:**
The Guide is already present when the section begins. They stand 1.8 units in front of The Arch, facing outward toward the arrival path of the next episode.

When a new participant is approaching, the Guide turns to face the path.
When the participant reaches conversation distance (2.0 units away), the Guide's emissive pulses once — a greeting that isn't stated.
When the participant crosses the threshold, the Guide returns to looking at the next arrival path.

The Guide never moves far from The Arch. They are its steward.

**Voice:**
The Guide's dialogue is always:
- Direct
- Specific
- Without defensiveness
- Without urgency
- Patient without being passive

The Guide has heard every question before. They answer without hesitation. They do not need to sell because they are not afraid of scrutiny.

---

## 5. Character Profiles

### C01 — The Farmer
**Color:** `#8B5E3C` (warm earth)
**Arrival path:** lower-left
**Prop:** a thin flat rectangular tablet floating at hip height — their land document, ID, and farm photographs combined into one abstract form
**Posture:** steady but watchful. Has made this kind of journey before.
**Their arc:** They have sold through brokers their entire life. They know the system. They're skeptical of a digital alternative. They are not naive — they are experienced.
**Final position:** lower-left of Council Ring, facing The Arch

### C02 — The Buyer
**Color:** `#4A5568` (slate institutional)
**Arrival path:** lower-right
**Prop:** a thin vertical panel floating slightly ahead of them — a purchase order, representing the thing they need verified before they can commit
**Posture:** businesslike, slightly formal. Moves with purpose.
**Their arc:** They have received misrepresented produce. Once was enough. They need a mechanism to trust quality before payment.
**Final position:** lower-right of Council Ring, facing the Farmer's position

### C03 — The Student
**Color:** `#5B7FA6` (aspirational blue)
**Arrival path:** upper-left
**Prop:** three small floating cubes in a cluster — three project documents, orbiting slowly around a central point
**Posture:** energetic but uncertain. They know their work is real. They can't prove it.
**Their arc:** They have submitted CVs into silence. Their GitHub exists. Their contributions are real. But employers see so many claims they've stopped trusting any of them. The student needs a mechanism to separate their signal from noise.
**Final position:** upper-left of Council Ring

### C04 — The Lecturer
**Color:** `#6B7280` (authority gray)
**Arrival path:** upper-left (arrives after Student, from a slightly different angle)
**Prop:** a hexagonal disc floating near their right hand — an academic credential that has meaning they want to lend to students
**Posture:** deliberate. Unhurried. They have reviewed many things in their career. They want to know this review means something.
**Their arc:** They have written recommendations that disappeared into applications. They want their judgment to be on record, permanently, where it can be found by the people who need it.
**Final position:** upper-left of Council Ring, adjacent to Student

### C05 — The Employer
**Color:** `#374151` (professional dark)
**Arrival path:** upper-right
**Prop:** a vertical panel representing the portfolio review interface — the thing they look at constantly and can never quite trust
**Posture:** contained. Evaluating. They are always evaluating.
**Their arc:** They have hired on faith. Sometimes it worked. Sometimes it did not. They need the verification chain to be transparent — not just the outcome, but who made the call and why.
**Final position:** upper-right of Council Ring, facing the Student/Lecturer positions

### C06 — The Cooperative Leader
**Color:** `#5C7A4A` (forest)
**Arrival path:** left-center
**Prop:** a branching network structure — five nodes connected by thin lines, representing the collective they represent
**Posture:** measured, authoritative, community-oriented. They carry responsibility for others.
**Their arc:** They do not represent themselves. They represent twelve farmers. Before they commit the group, they need to understand the platform deeply. Their questions are not personal.
**Final position:** left side of Council Ring, between Farmer and Student

### C07 — The NGO Representative
**Color:** `#7C6B9A` (mission violet)
**Arrival path:** upper-center
**Prop:** a small floating grid — 3×3 matrix of points — representing impact metrics and the accountability they are required to demonstrate
**Posture:** watchful, methodical. They have been burned by platforms that made claims they could not substantiate.
**Their arc:** They do not need a platform that claims impact. They need one that can prove it, on demand, with auditable evidence.
**Final position:** top of Council Ring, directly above The Arch axis

### C08 — The Institution Representative
**Color:** `#9A7B4E` (ochre institutional)
**Arrival path:** upper-right (arrives with or after Employer)
**Prop:** a cylinder-and-ring form — an institutional seal, the physical representation of credential authority
**Posture:** formal, considered. They represent an institution that has survived longer than most digital platforms. They do not move quickly.
**Their arc:** They have affiliated their institution's name with verification systems that later failed. They need to understand the mechanism — not the marketing — before they affiliate again.
**Final position:** upper-right of Council Ring, adjacent to Employer

---

## 6. Dialogue Architecture

### Principles

Every line of dialogue was written by asking: *What would a real person in this situation actually say?*

The questions are not soft.
The questions are not leading.
The questions are not designed to be answered with a product feature.
They are designed to be answered with a demonstration of how the system actually works.

The Guide's answers are:
- Shorter than the questions
- More specific than the questions
- Never defensive
- Always followed by a visual demonstration where possible

### Dialogue Library — Complete (30 exchanges, all 8 episodes)

---

**EPISODE 1 — THE FARMER**

*[Farmer arrives along the lower-left path. Walks steadily. Stops 2.0 units from the Guide.]*

*[Beat. The Guide's emissive pulses once.]*

> **FARMER:** I have sold through brokers my whole life. They know the buyer. I do not. How is this different?

> **GUIDE:** On this platform, every buyer is verified before they can place an order. You can read their transaction history before you accept anything.

*[DEMONSTRATION: A small Trust Score visualization appears near the Buyer's Council Ring position — not the character, just the glowing number. It grows from 0 to a completed score as three transaction confirmations briefly appear and dissolve.]*

> **FARMER:** And the money? A broker pays me when he is ready. Sometimes I wait weeks.

> **GUIDE:** Payment is held through M-Pesa before you confirm dispatch. You do not send anything until the funds are confirmed. They release when you mark the order complete.

*[DEMONSTRATION: A simplified payment flow — a teal line moving from Buyer position to central structure to Farmer position, pausing at center, then completing the path. Brief. Clear. 1.8 seconds.]*

> **FARMER:** What if they dispute after receiving?

> **GUIDE:** Every order creates a record. Your dispatch confirmation. Their receipt. The timestamps. If there is a dispute, the record is public.

*[Beat. Farmer looks at The Arch. Looks back at the Guide.]*

> **FARMER:** *(quieter)* And if my registration is rejected?

> **GUIDE:** The rejection includes the reason. And the path to resubmit. Rejection is not permanent. It is the beginning of the process.

*[The Farmer looks at The Arch for a long moment. Then walks toward it. Steady. Takes their position in the Council Ring. The lower-left strand of light activates in `#8B5E3C`.]*

---

**EPISODE 2 — THE BUYER**

*[Buyer arrives from lower-right. More brisk than the Farmer. Stops at conversation distance.]*

> **BUYER:** The Trust Score — who creates it? Anyone can write reviews.

> **GUIDE:** It is not reviews. It is completed transaction records. Each fulfilled order adds to it. Each dispute becomes part of it. The score is the history, not an opinion.

*[DEMONSTRATION: The Farmer's Trust Score visualization from Episode 1 reappears — but now with the completed transaction from that episode added to it. The score increments. The Farmer's strand of light brightens briefly.]*

> **BUYER:** And the farmer's identity — how is it verified?

> **GUIDE:** National ID, land documentation, and a farm photograph reviewed by a named administrator. Their name is on the approval. Not an algorithm. A person.

> **BUYER:** What is the name of the person who verified this farmer?

> **GUIDE:** It is in the verification record. Public. Readable before you place an order.

*[Beat. The Buyer looks toward the Farmer's position in the Council Ring.]*

> **BUYER:** And if produce arrives and the quality does not match the listing?

> **GUIDE:** The dispute goes on record. If a pattern develops, the seller's Trust Score reflects it. And the administrator who verified them is notified.

> **BUYER:** *(beat)* I had an order last year. I lost two thousand shillings and had no recourse.

> **GUIDE:** *(pause)* Every order here has a record. And every record has a name attached to it.

*[The Buyer nods once. Walks to The Arch. Takes their position. Lower-right strand activates.]*

---

**EPISODE 3 — THE STUDENT**

*[Student arrives from upper-left. They move quickly, with nervous energy. Stops.]*

> **STUDENT:** My GitHub has three years of work on it. Employers look at it for two seconds. How does verified mean anything different?

> **GUIDE:** A GitHub repo tells you what was committed. A portfolio entry here tells you what was reviewed — by whom, with what credentials, with what decision, and why.

> **STUDENT:** But what if a lecturer just approves everything?

> **GUIDE:** The reviewer's name and institution are on every entry. Their credibility is attached to their decisions. They have reason to be careful.

*[DEMONSTRATION: A portfolio entry forms in the air between them — a floating card showing: project name, submission date, reviewer name + institution, outcome, document hash. Each element appears one at a time.]*

> **STUDENT:** The hash — what is it for?

> **GUIDE:** It proves the document was not changed after submission. The hash on record and the hash of your original file will always match.

> **STUDENT:** Can I show this to someone without them needing an account?

> **GUIDE:** Yes. Every portfolio entry has a public URL. No registration required to read it.

*[DEMONSTRATION: The floating card fades — and a minimal browser frame replaces it briefly, showing a public portfolio URL. Then that fades.]*

> **STUDENT:** *(a new question, smaller, genuine)* What if my project is not good enough?

> **GUIDE:** Then you receive notes. You revise. You resubmit. The submission history is yours. It shows someone who worked toward something. That is also visible.

*[The Student looks at the portfolio card for a moment. Then walks toward The Arch. Upper-left strand activates.]*

---

**EPISODE 4 — THE LECTURER**

*[Lecturer arrives from upper-left, a different angle from the Student. They walk more slowly.]*

> **LECTURER:** I review ten student submissions per semester in my department. How much time would this require in addition?

> **GUIDE:** Reviewers are matched to their subject area. There is no quota. You review when a submission reaches your queue.

> **LECTURER:** And if I disagree with a peer reviewer's assessment?

> **GUIDE:** Your decision is recorded separately. The record shows both assessments. A disagreement is not a problem — it is more information for the student and the employer.

*[Beat.]*

> **LECTURER:** My institution requires that I disclose affiliations. Is my institution name published on my reviews?

> **GUIDE:** Yes. Your name, your institution, and your credentials are on every review you submit.

> **LECTURER:** That could create liability if I approve work that later proves problematic.

> **GUIDE:** It could. That is also true of every reference letter you have ever written. This system makes the same thing you already do — legible to the people who need it.

*[Long pause. The Lecturer looks toward the Student's position in the Council Ring.]*

> **LECTURER:** *(quietly)* The students deserve to have their work taken seriously.

*[They walk toward The Arch. Takes their position adjacent to the Student. Upper-left Council Ring now has two active strands. The two strands pulse together briefly — a faint synchronized beat — before settling.]*

---

**EPISODE 5 — THE EMPLOYER**

*[Employer arrives from upper-right. Controlled. They have read something before arriving.]*

> **EMPLOYER:** I can see the portfolio entry. I can read the reviewer's name. But how do I verify that the reviewer is who they say they are?

> **GUIDE:** Each reviewer's institution is linked. Their credentials are on record with their academic institution's public directory. The chain does not end at this platform.

> **EMPLOYER:** I have seen AI-generated portfolios that passed peer review. What prevents that here?

> **GUIDE:** The reviewer's name is on record. If a reviewed project is later shown to be fabricated, the reviewer is identified. There is no anonymous approval here.

*[DEMONSTRATION: The portfolio card from Episode 3 reappears. The reviewer's name is highlighted. A link to an institution directory animates briefly. The document hash comparison animates — the hash on record matching the original file.]*

> **EMPLOYER:** *(a sharper question)* What if the reviewer colludes with the student?

> **GUIDE:** The peer reviewer and the lecturer reviewer are different people. The peer reviewer is anonymous to the student. The lecturer reviewer is named. Two independent assessments with different accountability structures.

*[Beat. The Employer looks at the Council Ring — at the Student's position, then the Lecturer's.]*

> **EMPLOYER:** That is the first time I have heard a specific answer to that question.

> **GUIDE:** *(no further response)*

*[The Employer walks toward The Arch. Upper-right strand activates.]*

---

**EPISODE 6 — THE COOPERATIVE LEADER**

*[Cooperative Leader arrives from the left-center. They move with weight — they carry many people's interests.]*

> **COOPERATIVE LEADER:** I represent fourteen farmers. Before I bring them to any platform, I need to understand what happens when something fails.

> **GUIDE:** Every failure leaves a record. The record is public. The administrator who made the decision is named. The appeal process is open.

> **COOPERATIVE LEADER:** We coordinate group orders — a single order for produce from multiple farmers. Is that possible?

> **GUIDE:** Yes. Cooperative listings are supported. The group's members are each individually verified. The order confirmation routes to the cooperative account.

*[DEMONSTRATION: A cluster of small forms appears briefly — 14 small lights in a loose group — that resolve into a single grouped form, then a single order record. It flows through The Arch briefly before dissolving.]*

> **COOPERATIVE LEADER:** And the pricing — who sets it?

> **GUIDE:** The farmers. Market benchmarks are visible on the platform. No one sets a price for you.

> **COOPERATIVE LEADER:** My farmers have been told many times that something will be transparent. It is almost never transparent.

> **GUIDE:** The methodology for how Trust Scores are calculated is published. The verification criteria are published. The appeals process is published. Not as a promise — as a document you can read today, before anyone registers.

*[Long pause.]*

> **COOPERATIVE LEADER:** Where is it?

> **GUIDE:** *(the platform URL for the transparency page appears in a speech bubble — like a footnote, not a button)*

*[The Cooperative Leader considers this. Then walks, steadily, to The Arch. Left-center strand activates.]*

---

**EPISODE 7 — THE NGO REPRESENTATIVE**

*[NGO Representative arrives from upper-center. Their prop — the impact grid — floats ahead of them slightly, as if preceding them.]*

> **NGO REP:** We need to be able to demonstrate impact to funders. Not describe it. Demonstrate it. With data. What data does this platform produce?

> **GUIDE:** Transaction records with timestamps. Regional breakdowns by farmer location. Verification completion rates. Dispute resolution rates. First-time transaction records.

> **NGO REP:** And is that data accessible without registering?

> **GUIDE:** Summary statistics are public. Granular data requires a formal audit request through the administrator. The request and the response are both logged.

*[DEMONSTRATION: A data flow visualization — a constellation of small data points organizing themselves into a simple chart form, then dissolving back into the scene fog.]*

> **NGO REP:** Our funders ask for impact data quarterly. Can this platform generate quarterly reports?

> **GUIDE:** The audit log can be filtered by time range. Export is available in standard formats.

> **NGO REP:** *(sharply)* And the methodology — how is impact defined here? We have seen platforms define impact as registrations.

> **GUIDE:** Impact here is defined as completed verified transactions between verified parties. Registration is not counted. Attempted but uncompleted actions are not counted.

*[The NGO Rep's prop — the floating grid — briefly illuminates, as if satisfied.]*

> **NGO REP:** *(quietly, almost to themselves)* That is the first definition I have not had to argue with.

*[They walk to The Arch. Upper-center strand activates.]*

---

**EPISODE 8 — THE INSTITUTION REPRESENTATIVE**

*[The final arrival. The Institution Rep comes from upper-right, moves with the slowness of someone who has seen many things and is not easily impressed. They stop. They look at the Council Ring — seven active strands — before addressing the Guide.]*

> **INSTITUTION REP:** Our institution affiliated with a verification platform in 2021. It failed eighteen months later. All records were lost.

*[Pause. The Guide does not rush to respond.]*

> **GUIDE:** Every record here is hashed before storage. The hash is written to a verification log that is independent of the platform's operational database. If the platform fails, the hashes survive.

> **INSTITUTION REP:** And if the hashes survive but the records do not?

> **GUIDE:** Each participant holds their own record. The platform stores a verification of that record. They are not the same thing, and they are not stored together.

*[DEMONSTRATION: A record appears — then splits into two parts. One part stays near The Arch. The other moves outward, toward the Council Ring, toward where the Employer and Student are standing. The message is spatial: the platform does not hold everything. The participants hold part of it.]*

> **INSTITUTION REP:** Our institution has accredited nine thousand graduates. If we affiliated with this platform, how would we know our affiliation is being used appropriately?

> **GUIDE:** Every review that lists your institution generates a notification to your institutional contact. A monthly report of all reviews conducted under your institution's name is available on demand.

> **INSTITUTION REP:** And if a reviewer who listed our institution leaves?

> **GUIDE:** Their reviews remain as historical records. Their affiliation is marked as inactive from the date they left. The records do not disappear. The context changes.

*[Long pause. The Institution Rep looks at The Arch. At each of the seven glowing strands in the Council Ring.]*

> **INSTITUTION REP:** These are not questions most platforms have answers to.

> **GUIDE:** *(pause)* No.

*[The Institution Rep walks to The Arch. Slowly. Takes the final position. The eighth strand of light activates.]*

*[For one moment — a brief pulse — all eight strands glow simultaneously. A ring of light forms at y=1.0 and expands, slowly, outward across the Plaza, fading as it reaches the edge.]*

*[The world is quiet. Inhabited. Complete.]*

*[The Guide turns, for the first time, to face the camera directly.]*

*[No speech bubble. No text. Just the faint teal pulse of the platform in the dark.]*

---

## 7. Motion Design

### Character Movement

All characters glide — not walk. Movement is a smooth position interpolation (`gsap.to`, `ease: 'power2.inOut'`). The abstraction of locomotion is intentional and consistent with the geometric aesthetic.

**Entry movement:**
Characters arrive from the edge of the Plaza (approximately 8–10 units from center). The entry path takes 2.0–2.5 seconds of real time regardless of scroll speed. This is one of the few time-based (not purely scroll-driven) transitions in the experience.

**Conversation posture:**
When a character is in dialogue, they orient slightly toward the Guide (10–15 degree rotation). Scale increases to 1.03 uniformly. Their emissive intensity increases from 0.04 to 0.10.

**The Crossing:**
When a character walks to The Arch, the movement is slower than arrival: 3.5–4.0 seconds. Their prop floats slightly higher as they approach, as if lifted by arriving.

### Conversation Bubble Animation

Bubbles are DOM elements positioned via drei's `<Html>` component.

**Appear:** opacity 0→1 + translateY 8px→0, over 0.35 seconds, ease `cubicBezier(0.16, 1, 0.3, 1)` (ease-out quint)

**Hold:** duration = `3.5s + 0.35s × wordCount`

**Dismiss:** opacity 1→0, over 0.25 seconds

**Between lines in same exchange:** 0.5 second gap

**Between exchanges (question → answer):** 1.2 second gap — this beat is important. The pause before the Guide answers should feel like a real response, not a machine returning data.

### The Arch Animation

The three rings rotate continuously:
- Outer: Y axis, 0.004 rad/frame, clockwise
- Middle: Y+X combined, 0.006 rad/frame, counter-clockwise
- Inner: Y axis, 0.009 rad/frame with slow axial precession (X ±0.001 rad/frame oscillating)

When a participant crosses the threshold: the Inner Ring briefly brightens (emissive 0.4→0.9 over 0.4s, then back over 0.8s).

When all 8 strands are active: the three rings spin up to 1.5× speed for 1.2 seconds before settling back. A brief, celebratory acceleration.

### The Camera Dolly

Starting position: `[0, 6, 12]`
Final position (after all 8 episodes): `[0, 5.2, 7.5]`

Movement: GSAP timeline, each episode's conclusion moves the camera 0.5 units forward and 0.1 units down.
Easing: `power1.inOut`
Duration per move: 2.0 seconds
Trigger: when participant's Council Ring strand activates

This movement is designed to be subliminal. The visitor should not think "the camera moved." They should feel "the world feels closer now." The cumulative effect of 8 subtle moves is the emotional equivalent of leaning forward.

---

## 8. Scroll Choreography

### Section Structure

The section is pinned: `600vh` total, sticky inner canvas `100vh`.

Each episode occupies approximately `68vh` of scroll:
- Episode intro (character approaching): `8vh`
- Dialogue exchange 1: `16vh`
- Demonstration: `12vh`
- Dialogue exchange 2: `16vh`
- The Crossing + strand activation: `10vh`
- Camera dolly + beat: `6vh`

Plus:
- Section intro (world appears, Guide is present, hint at arrival): `16vh`
- Final tableau (all 8 lit, ring pulse, Guide turns): `16vh`

Total: `(8 × 68) + 16 + 16 = 576vh` → rounded to `600vh` with padding.

### Scroll-to-Story Mapping

| Scroll % | Event |
|----------|-------|
| 0% | World appears. The Plaza materializes from fog. The Arch rotates slowly at center. Guide stands before it. |
| 0–2% | Scene establishes itself. No movement. The visitor absorbs the world. |
| 2% | **Episode 1 begins.** Farmer's path glows faintly. |
| 3% | Farmer enters from lower-left. |
| 4.5% | Farmer reaches conversation distance. First bubble appears. |
| 7% | First exchange complete. Demonstration. |
| 10% | Second exchange. |
| 12% | The Crossing begins. |
| 13.5% | Strand 1 activates. Camera moves. Beat. |
| 15% | **Episode 2 begins.** Buyer's path glows. |
| *(pattern continues per episode)* |
| 86% | All 8 participants have crossed. |
| 88% | Ring pulse expands across Plaza. |
| 92% | Guide turns to face camera. |
| 95–100% | Final tableau. Still. Inhabited. Complete. |

---

## 9. Three.js Architecture

### Scene Graph

```
<Canvas>
  ├── <CameraRig />              — fixed with scroll-driven dolly
  ├── <SceneLighting />          — three-point narrative lighting
  ├── <FogExp2 />
  │
  ├── <ThePlaza />               — ground disc + meridian line inlays
  │
  ├── <TheArch />                — three rings + dais
  │   └── <CouncilRing />       — 8 positions with light strands
  │
  ├── <TheGuide />               — always present, scroll-aware
  │
  ├── <EpisodeManager />         — reads scroll, renders active episode
  │   ├── <CharacterStage />    — active character + prop + movement
  │   └── <ConversationStage /> — active conversation bubbles
  │
  ├── <PermanentCharacters />    — participants who have completed their arc
  │                               (simplified geometry — glow only at council ring)
  │
  └── <PlazaAmbience />          — environmental progression effects
```

### State Model (Zustand)

```typescript
interface StoryworldState {
  scrollProgress: number;         // 0–1
  currentEpisode: number;         // 0–8 (0 = pre-episode world)
  episodeProgress: number;        // 0–1 within current episode
  completedEpisodes: number[];    // which episodes are done
  activeConversation: ConvState | null;
  reducedMotion: boolean;

  // Setters
  setScrollProgress: (p: number) => void;
  setReducedMotion: (v: boolean) => void;
}
```

### GSAP + ScrollTrigger

```typescript
// ScrollDriver.tsx (outside Canvas)
ScrollTrigger.create({
  trigger: sectionRef.current,
  start: 'top top',
  end: 'bottom bottom',
  scrub: 2.0,
  pin: canvasRef.current,
  pinSpacing: false,
  onUpdate: self => {
    useStoryworldStore.getState().setScrollProgress(self.progress);
    // Derive episode + episodeProgress from progress
    const derived = deriveEpisodeState(self.progress);
    useStoryworldStore.setState(derived);
  },
});
```

### Renderer Configuration

```typescript
<Canvas
  dpr={[1, 1.5]}
  camera={{ position: [0, 6, 12], fov: 38 }}
  gl={{
    antialias: true,
    powerPreference: 'high-performance',
    toneMapping: THREE.ACESFilmicToneMapping,
    toneMappingExposure: 1.15,
  }}
  frameloop="always"
>
```

Note: `powerPreference: 'high-performance'` — this scene is more complex than D01. On mobile it will be overridden.

---

## 10. Asset Production Requirements

### Character Geometry

All characters are procedural Three.js geometry. No GLTF imports.

**Base character:** head (sphere scaled [1, 0.85, 1]) + body (tapered cylinder). Shared `useMemo`-created geometry across instances; each instance has its own material.

**Polygon budget:** 600–900 triangles per character base. Prop: 100–200 triangles.

**The Guide:** same base structure, slightly larger, different material with emissive pulse.

### The Arch

Three `TorusGeometry` instances with varying sizes. All procedural. No assets required.

### Conversation Bubbles

DOM elements positioned via drei `<Html>`. No canvas rendering required. Font: `IBM Plex Mono` via CSS variable `--font-ibm-plex-mono` (already loaded in root layout).

Bubble visual design:
- Background: `rgba(13, 16, 20, 0.94)` — slightly darker than hero, deepened for this darker section
- Border: `1px solid #2e363f` — slightly softer than the UI border color
- Corner radius: `4px`
- Padding: `14px 16px`
- Max width: `280px`
- Speaker label: `IBM Plex Mono SemiBold`, `10px`, character primary color, `uppercase`, `letter-spacing: 0.07em`
- Content text: `IBM Plex Mono Regular`, `11px`, `#c8c2ba`, `line-height: 1.6`

The bubble border on the **Guide** side uses a faint teal tint: `#2a4a48` instead of `#2e363f` — a small visual distinction marking the platform's voice.

---

## 11. Mobile Strategy

On screens narrower than `768px`, the section renders a simplified version:

- **3 episodes only:** Farmer, Student, Employer (most universally relatable)
- **Dialogue reduced:** 2 exchanges per episode instead of 4
- **No demonstration animations** (simplified: text description only)
- **Camera FOV:** 52 (wider for smaller screen)
- **DPR capped:** `[1, 1]`
- **Section height:** `250vh` (down from `600vh`)
- **No Plaza meridian inlays** (geometry cost reduction)

The Council Ring still activates — the 3 completed positions glow. The visual payoff is preserved, scaled.

Very low-end device fallback (`hardwareConcurrency <= 2`): static 2D illustration — the Plaza and Arch rendered as a single SVG, with 3 conversation bubbles positioned statically. Designed in Figma as part of Phase B.

---

## 12. Accessibility Strategy

### Reduced Motion

`prefers-reduced-motion: reduce`:
- All character movement is instantaneous (no interpolation)
- Bubbles appear/dismiss without transitions
- The Arch rings do not rotate
- Camera stays fixed at starting position
- Council Ring strands activate without animation

Scene remains fully readable. Reduced motion is not degraded.

### Screen Reader

Canvas is `aria-hidden="true"`.

Adjacent (placed before canvas in DOM order) `sr-only` div contains:

```html
<section aria-label="UmojaHub Stories">
  <h2>Before They Trusted Us, They Had Questions</h2>
  <p>
    Eight participants — a farmer, a buyer, a student, a lecturer, an employer,
    a cooperative leader, an NGO representative, and an institution representative —
    each arrived at UmojaHub with real concerns about trust, verification,
    and accountability. This section presents their conversations with the platform guide.
  </p>
  <!-- Each episode summarized in 2–3 sentences -->
</section>
```

### Keyboard

No focusable elements within the canvas. Section is experiential, not interactive. Tab order passes through without entering the canvas. The `sr-only` section above ensures content is accessible.

---

## 13. Performance Strategy

### Budgets

| Metric | Target | Hard Limit |
|--------|--------|------------|
| Triangle count (peak) | ~15,000 | 25,000 |
| Draw calls | ~30 | 50 |
| JS bundle (Three.js excl.) | < 45 KB | 70 KB |
| Time to First Meaningful Paint | < 800ms | 1.5s |
| Sustained FPS (desktop) | 60 | 45 min |
| Sustained FPS (mobile) | 30 | 24 min |

### Optimizations

**Lazy geometry creation:** Character geometry is created only when that episode begins (not all 8 at load). Previous episode characters downgrade to a single `PointLight` at their Council Ring position — no mesh.

**Bubble DOM management:** Bubbles are fully removed from DOM (not just hidden) when not active.

**Section gate:** Canvas does not initialize until the user scrolls to within `500px` of the section. `IntersectionObserver` with `-500px 0px` root margin. Before that: static background with guide title only.

**Frame budget:** `useFrame` callbacks are gated — if the section is not in viewport, `frameloop="never"` is set.

---

## 14. Figma Production Roadmap

### Phase A — Character Concepts (existing page `04 / Character Concepts`)

Supplement existing three-view silhouettes with:
- The Guide character (three-view: front, 45°, side)
- Updated prop designs per this document (some props changed from v1)
- Revised composition mock showing episodes 1, 4, and 8 (three narrative moments)

### Phase B — The Arch Design Studies

New Figma page: `05 / The Arch`

Deliverables:
- Three concept directions for The Arch form
- Material studies (the three ring materials)
- Council Ring layout (top-down view showing 8 positions)
- The Plaza (top-down view with meridian inlays)
- Lighting study (dark background, teal rim, character glow)

### Phase C — Conversation Bubble Component

New Figma component: `BubbleParticipant` and `BubbleGuide`

Design tokens:
- Participant bubble: standard dark background + colored speaker label
- Guide bubble: same but with teal-tinted border
- All states: appear (ghost), active, dismiss

### Phase D — Static 2D Mobile Fallback

New Figma page: `06 / Mobile Fallback`

SVG export showing: Plaza + Arch + Farmer, Student, Employer at their conversation positions + 3 speech bubbles from their respective episodes. Single frame, no animation.

### Phase E — Demonstration Animation Design

For each of the 8 demonstration moments (the visual mid-episode beats), a Figma frame showing:
- Start state
- Mid state
- End state
This gives Three.js implementer a clear motion reference for each moment.

---

## 15. Open Decisions

| # | Decision | Options | Blocks |
|---|----------|---------|--------|
| 1 | Section entry label | "The People Behind The Platform" / "Witness" / unlabelled | Section header copy |
| 2 | Demonstration fidelity | Full abstract 3D visualization / simplified particle trail / text-only | Motion design scope |
| 3 | Episode count | All 8 / Priority 6 (drop NGO + Institution to Phase 2) | Scroll height + production scope |
| 4 | The Guide identity | Nameless / named ("Amara", "The Guide") / unlabelled | Dialogue attribution |
| 5 | Phase B Arch approval | Three concept directions needed in Figma before 3D build | All Arch geometry |
| 6 | Mobile approach | Simplified 3D / 2D SVG only / truncated full | Engineering scope |

---

*Architecture complete. No implementation proceeds until all Open Decisions are resolved and this document is approved.*

*The goal is not a website section. The goal is the moment a visitor scrolls past this section and thinks: I understand why this exists.*
