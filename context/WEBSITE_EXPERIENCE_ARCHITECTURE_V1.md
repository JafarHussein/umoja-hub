# UmojaHub — Website Experience Architecture V1

**Status**: Governing document. Supersedes `context/WEBSITE_VISUAL_SYSTEM_V2.md` as the primary authority for all website decisions.
**Preserves**: `context/WEBSITE_INFORMATION_ARCHITECTURE.md` in its entirety.
**Replaces**: The visual-system-first thinking of V2 with experience-system-first thinking.
**Implementation gate**: No implementation begins until this document is approved.

---

# PART 0 — CRITIQUE OF WEBSITE_VISUAL_SYSTEM_V2.md

The critique that follows is not a rejection of the effort in V2. It is a diagnosis of why V2 — despite being a significant improvement over V1 — would still produce a website that fails the benchmark.

Every criticism below comes with a specific claim. If the claim is wrong, the critique is wrong.

---

## 1. V2 Still Feels Generic

**The claim:** V2 replaced the V1 palette and fonts with a more considered set of choices, but the result is still a synthesis of the reference benchmarks rather than something original.

**The evidence:**

- Warm off-white (#F8F6F2) as primary background: Stripe, Notion, Linear's documentation, Mercury. This is now the default color for "premium product documentation."
- Left-aligned editorial hierarchy: Ramp, Linear, Stripe. This is now the default layout posture for serious B2B products.
- Instrument Serif is gaining rapid adoption in the indie design community as a way to signal "considered editorial." By the time UmojaHub launches, this choice will read as trend-following.
- Small uppercase Geist Mono eyebrow labels (11px, tracked) appear on Linear, Vercel, Ramp, and every Tailwind-built product trying to look serious. This is now the equivalent of what `font-bold tracking-widest text-xs uppercase` was in 2020. It is the new generic.
- The dark-section / light-section alternation: Stripe. Exactly Stripe's technique for separating developer infrastructure content from marketing content.

V2 is a better synthesis than V1. It is still a synthesis. The reference benchmarks were supposed to provide principles, not vocabulary. V2 extracted vocabulary.

**What V2 should have produced:** A visual language that, if you showed a screenshot to someone familiar with Stripe and Linear, they would say "that's not either of those." V2 would be described as "a bit like Stripe's docs with Notion's editorial feeling."

---

## 2. V2 Feels Like Documentation, Not a Product Experience

**The claim:** The V2 website informs. It does not involve.

**The evidence:**

- The homepage is seven consecutive explanatory sections. Section 1 explains what UmojaHub is. Section 2 explains the two problems. Section 3 shows audiences. Section 4 explains the marketplace. Section 5 explains the education hub. Section 6 shows statistics. Section 7 explains trust. The visitor reads from top to bottom and is comprehensively informed. They have never *experienced* anything.
- The Limitation Disclosure Panel appears after every claim. This is editorially correct but creates a rhythm: claim → limitation → claim → limitation. It reads like a legal document with good typography.
- Every section follows the identical anatomy: eyebrow → headline → lead paragraph → content → optional link. This is a template. Templates feel like templates.
- The "No CTA above the fold" principle is defensible but passive. A visitor who scrolls through seven explanation sections before encountering any invitation to engage has been treated as a reader, not a participant.
- The visitor never encounters a moment that makes them stop and think "I did not know that." They encounter explanations they are expected to understand.

Documentation communicates information. Product experience communicates *what it feels like* to use the product. V2 replaced a sales experience with a documentation experience. Neither is the correct answer.

---

## 3. V2 Has No Emotional Engagement

**The claim:** V2 explicitly prioritizes understanding over feeling. This is a false dichotomy and produces a design failure.

**The evidence:**

From Section 1 of V2: *"A design that makes visitors feel good about UmojaHub without understanding it has failed. A design that makes visitors understand UmojaHub but feel neutral about it has succeeded."*

This is wrong.

A Kenyan farmer visiting the website is not a neutral information-processing machine. They have been operating in a market that does not trust them — where a buyer has no way to confirm they are who they claim to be, where their price negotiating power is near-zero because aggregators control information flow. They have a specific emotional state when they arrive: skepticism about whether another platform will do anything differently.

A CS student visiting the website has a different emotional state: anxiety about whether their work will be visible to employers, doubt about whether a project-based portfolio is credible, concern about whether the review process is fair.

These are not obstacles to understanding. They are the entry condition. A design that does not acknowledge them — that launches immediately into explanation without first saying "we know this is where you are" — will be read as another platform that doesn't understand the people it serves.

V2's restraint in the face of emotional content is not professionalism. It is avoidance.

The benchmark products understand this. Linear's homepage does not just explain the product — it makes you feel the frustration of slow, chaotic project management before showing you the solution. Stripe's homepage makes you feel the complexity of global payment infrastructure before making it feel simple. The emotional engagement is not decoration. It is the frame that makes the information meaningful.

---

## 4. V2 Has No Visual Identity

**The claim:** V2 has visual rules. It does not have a visual idea.

**The evidence:**

Every product in the benchmark has one organizing visual idea — one thing that, when you encounter it, you immediately associate with the product:

- **Stripe:** The gradient that implies computation depth, the card with dimensional shadow
- **Linear:** Monochrome precision with violet, the density of a debugger
- **Notion:** Modular blocks as fundamental unit, the canvas
- **Figma:** Layers visible, the design environment itself as the aesthetic
- **Vercel:** Black and white as philosophical commitment, the triangle
- **Ramp:** Financial data density, the trust of a Bloomberg terminal, green as performance

V2's organizing visual concept is: "Documentary Precision." This is an aesthetic direction (it tells you the emotional register) but it is not a visual idea (it doesn't tell you what you'll see when you arrive).

What is the one image from the V2 website that would be immediately recognizable as UmojaHub? The document cannot answer this question. There is no recurring visual motif, no structural element, no compositional pattern that makes a V2 page unmistakable. The verification mechanic — the most specific and interesting thing about the platform — has no visual expression. It exists only in text.

V2 is a well-considered set of typographic and color rules. It is not an identity.

---

## 5. V2 Will Not Be Remembered

**The claim:** A visitor who reads the V2 homepage will remember facts. They will not remember an image, a moment, or a feeling.

**The evidence:**

Memory requires a distinctive stimulus. The V2 homepage provides no distinctive stimulus. There is no single visual moment that is unlike anything else a visitor has encountered. The homepage is a well-designed explanation — it communicates clearly and then exits the visitor's memory along with every other clear explanation they have encountered.

Ask: what is the single thing a visitor would say when asked to describe the UmojaHub website?

V2 answer: "It's a clean, editorial site that explains how the platform works."

Correct answer: Something specific to UmojaHub that cannot be said about any other website they have visited.

The V2 system provides no answer to the second version of this question.

---

## 6. V2 Fails the Blur Test

**The claim:** Remove the logo and blur the V2 homepage to 40% opacity. The result is indistinguishable from Stripe's documentation, Linear's marketing pages, or a well-made Tailwind template.

**The specific elements that make this true:**

- Warm off-white background → Stripe, Notion, hundreds of others
- Dark contrast section → Stripe developer marketing, Vercel homepage
- Left-aligned large serif + small sans → every editorial-influenced SaaS product
- Small tracked mono eyebrow labels → Linear, Ramp, Vercel
- Two-column split layout (text | diagram) → standard responsive grid pattern
- Pill status labels (VERIFIED, PENDING) → any status-based platform

The only V2 elements that survive the blur test are the content itself (which is not visual) and the Instrument Serif italic at Display 1 (which is a typeface choice, not a visual idea).

The blur test reveals that V2 has typography and color correct but has not solved the visual identity problem.

---

## 7. V2 Cannot Reach the Benchmark Level

**The claim:** V2, implemented as specified, would produce a good website. It would not produce a website that belongs in the same conversation as Stripe, Linear, Ramp, or Vercel.

**Why:**

The benchmark products reached their level not because they followed better design rules than everyone else. They reached their level because they committed to a visual idea that was specific and unexpected.

Stripe committed to making complex infrastructure feel like it had been designed by artists. The gradient wasn't just decoration — it was an argument that payment infrastructure could be beautiful.

Linear committed to the idea that speed is a design value. Every visual choice — the precision, the monochrome, the lack of anything soft — communicates speed.

Vercel committed to black and white as a statement that developer infrastructure is beyond fashion. Not warm off-white. Not dark gray. Black and white. A position.

V2 has not committed to anything specific enough to reach this level. It has committed to being considered, restrained, and honest — these are qualities, not ideas. You can execute qualities competently. You cannot execute qualities memorably.

---

## 8. The V2 Homepage Creates No Curiosity

**The claim:** The V2 homepage presents information in the order the mind needs it. It does not make the visitor want to explore.

**Why this matters:**

Curiosity requires withholding. A homepage that explains itself completely leaves nothing to discover. It is comprehensive and it is forgettable.

The visitor who arrives on the V2 homepage is presented with: what UmojaHub is, why it exists, who it serves, how the marketplace works, how the education hub works, what the statistics are, and how trust works. By the end of the homepage they understand the platform completely and have no reason to visit any other page.

This is not ideal. The homepage's job is not to create complete understanding. It is to create the desire for complete understanding. There is a difference.

The best homepage creates one insight that makes the visitor want more. The V2 homepage creates seven insights in sequence and then stops.

---

## 9. GSAP Is Still Largely Decoration in V2

**The claim:** V2's motion vocabulary is better than V1's but remains mostly atmospheric rather than communicative.

**The specific problem:**

V2 defines six animation types. Of the six, only two are genuinely communicative — meaning they create understanding that would not exist without the animation:

- **Verification Mark** (scale 0.92→1.0, implies something was always there and is confirmed): This is specific and meaningful.
- **Scroll-Pinned Narratives** (Trust Score fill, M-Pesa sequence): These are genuinely explanatory.

The other four:
- **Emergence** (opacity 0→1, no Y translation): This is the most minimal possible entrance. It communicates nothing about UmojaHub specifically. It merely announces that an element exists.
- **Sequence Reveal** (staggered opacity on process steps): This communicates sequence — a general property of the content, not something specific to UmojaHub.
- **Data Emergence** (count-up from 70%): This is the standard count-up animation used on every statistics section since 2018.
- **Diagram Draw** (SVG stroke-dashoffset): This is the standard SVG path drawing technique used on any diagram that wants to feel technical.

The test V2 itself proposes — "What understanding does this create?" — applies correctly to Verification Mark and the pinned narratives. It does not apply meaningfully to the other four.

V2 also does not answer the fundamental GSAP question: **What is the one animation that, if you saw it, you would know you were on UmojaHub?** This question goes unanswered because V2's motion vocabulary is borrowed from the reference benchmarks, not derived from UmojaHub's specific mechanic.

---

## 10. The Dual-Hub Architecture Is V2's Weakest Moment

**The claim:** The most structurally interesting thing about UmojaHub — that two completely different domain applications (agricultural marketplace and CS education) share a verification architecture — is communicated only through a two-column nav dropdown and a two-column problems section on the homepage.

**Why this is insufficient:**

The shared verification architecture is the insight that makes UmojaHub genuinely interesting to think about. A farmer's Trust Score and a student's portfolio verification are generated by the same underlying mechanism: document review, behavioral history, and continuous assessment by a human administrator. This is not coincidence — it is a design decision about what trust means in both contexts.

This insight, properly communicated, would make every visitor stop and think. It changes the frame from "a marketplace that also has an education component" to "a verification platform that happens to operate in two domains." That is a completely different product identity.

V2 mentions the two hubs. It never makes the visitor *feel* the significance of their relationship. The verification architecture that connects them is never visualized. The convergence point is never shown.

This is the most specific and memorable thing about UmojaHub. It is the one insight that no other platform has. V2 buries it in text.

---

# PART 1 — EXPERIENCE PRINCIPLES

The question V2 asks: *How should the page look?*
The question this document asks: *What should a visitor feel, understand, discover, trust, and remember at each moment?*

These produce different designs.

---

## The Five Experience Outcomes

Every design decision must serve at least one of these five outcomes. If a decision serves none of them, it is removed.

**1. Feel** — The visitor has an emotional response grounded in recognition. Not inspiration, not excitement — recognition. "This understands the problem I have." The emotional engagement precedes and enables the intellectual engagement.

**2. Understand** — The visitor comprehends the mechanism. Not the features. Not the benefits. The mechanism: how trust is actually built, how a payment actually moves, how a verification decision is actually made. Understanding mechanism produces durable trust. Understanding features produces temporary interest.

**3. Discover** — The visitor encounters something they did not expect to find. A piece of information, a structural insight, a visual moment that stops them. Discovery creates curiosity. Curiosity creates exploration. Exploration creates depth of engagement that no amount of comprehensive explanation achieves.

**4. Trust** — The visitor believes the platform does what it says. Not because the design looks trustworthy. Because the platform demonstrates transparency about how it works, what it can't do, and why those limits exist. Trust is not a design aesthetic. It is an editorial commitment.

**5. Remember** — The visitor carries one clear, specific image or insight away from the website. Not a bulleted list of features. One thing. "A platform where a farmer's identity is confirmed by a human administrator, not an algorithm." One sentence, visually anchored to one image.

---

## The Experience Contract

**What the visitor feels on arrival:** This platform understands a problem I have actually experienced. It is not performing understanding — it is demonstrating it.

**What the visitor understands after five minutes:** The mechanism. Specifically: that verification is a human-administered process that produces a Trust Score composed of four measurable components, and that this Trust Score is visible to every buyer, employer, or partner who interacts with the verified entity.

**What the visitor discovers:** The shared verification architecture. That the same mechanism that makes a farmer trustworthy on a marketplace makes a student trustworthy in a portfolio. This discovery reframes the platform entirely.

**What the visitor trusts:** That the platform disclosed its limitations before its strengths. That the numbers they see are real and timestamped. That the review process they read about is the actual review process.

**What the visitor remembers:** The moment of verification — the specific visual moment when PENDING becomes VERIFIED, when a Trust Score fills to its current level, when a portfolio entry receives its mark. This moment should be the website's most distinctive visual event. It should be impossible to forget because it is impossible to see anywhere else.

---

# PART 2 — THE VISUAL IDEA

V2 has visual rules. This document requires a visual idea.

The rules can follow. The idea comes first.

---

## The Idea: The Moment of Resolution

UmojaHub's entire product exists to produce one thing: **a moment where uncertainty resolves into confidence.**

A farmer submits documents. The status is PENDING. An administrator reviews. The status becomes VERIFIED. A Trust Score exists where none did before. A buyer, who could not trust a stranger on the internet, can now make a decision. Something that was unknown has become known. Something that was uncertain has resolved.

This is not a feature. This is the entire product.

**The visual idea is:** *Everything on this website exists in one of two states: resolving or resolved.*

Before verification: information exists but its meaning is uncertain. A farmer has produce, but a buyer cannot confirm the farmer is who they claim to be. A student has completed a project, but an employer cannot confirm the work is genuine.

After verification: the same information is now certain. The farmer has a Trust Score. The student has a verified portfolio entry. The mark exists. The resolution has occurred.

**The visual expression of this idea:**

Every major visual element on the website — diagrams, status displays, the homepage itself — is designed around this polarity. Things in the process of becoming have a visual language: incomplete, building, pending. Things that have resolved have a different visual language: sharp, complete, marked.

This produces a design language that is:
- **Specific to UmojaHub**: No other platform's core product is "the moment of resolution." This is not borrowed from any reference benchmark.
- **Emotionally resonant**: The farmer who has been operating without a verifiable identity understands this moment viscerally. The student who has never had a way to prove their work is genuine understands it.
- **Visually generative**: The PENDING → VERIFIED transition can be expressed in typography, in SVG animation, in color, in spatial composition. It is not a single technique — it is an organizing principle that generates specific visual decisions.
- **Memorable**: A visitor who has never heard of UmojaHub can understand "a platform where your identity is confirmed and marked" immediately. The visual language reinforces this understanding.

---

## The Verification Mark

The verification mark is the physical expression of the visual idea.

It is not a checkmark. Checkmarks are used by every verification system in existence. Using a checkmark means joining a visual category that includes email delivery confirmations, task management apps, and medical symptom checkers.

The UmojaHub verification mark is a **scored line** — a horizontal bar that fills from left to right, completing when verification is confirmed. At completion, the bar solidifies and a status label resolves alongside it.

This mark:
- Appears in the platform itself (the Trust Score bar)
- Appears in every workflow diagram (the connection line between PENDING and VERIFIED nodes completes)
- Appears as a CSS/SVG motif in the navigation (the active page indicator is a completing line, not a dot or underline)
- Appears in the homepage's primary animation (the Trust Score fills as the visitor scrolls into the statistics section)
- Is referenced in the page transition (a hairline that completes before the new page enters)

The scored line is the visual signature. It is the one thing that, if you blurred the entire page to 40% opacity, you would immediately associate with UmojaHub and no other product.

---

## The Visual Polarity System

Rather than light-mode sections for agriculture and dark-mode sections for verification (V2's approach, which is borrowed from Stripe), the V2 system is replaced with a **polarity system** derived from the visual idea.

**PENDING state (before resolution):**
- Surface: warm, slightly unsaturated — `#F4F1EB` (warmer and more ambiguous than V2's paper)
- Text: slightly muted — `#3D3A35` (not as strong as ink; things not yet confirmed are not yet fully weighted)
- Borders: dashed or interrupted — not solid. Incomplete things have incomplete edges.
- Diagrams: nodes have dashed borders before the verification line reaches them

**RESOLVED state (after resolution):**
- Surface: cool, high contrast — `#0E0E0C` for dark resolved; `#FFFFFF` pure white for light resolved
- Text: full weight — `#1A1916` deep ink; `#F7F5F1` near-white on dark
- Borders: solid, 1.5px — resolved things have definite edges
- Diagrams: nodes become fully bordered, solid-fill when the verification line completes

**The transition between states** is the website's primary motion event. It does not happen with a fade. It happens when the verification line — the scored bar — reaches the element and completes. This is not decorative. It is the platform's core mechanic made visible.

This polarity system is derived from the product's behavior. It cannot be transplanted into another product because another product does not have the same core mechanic.

---

# PART 3 — VISUAL IDENTITY PRINCIPLES

These are derived from the visual idea, not selected for their reference benchmark quality.

---

## Typography: Rethought

V2's Instrument Serif + Geist + Geist Mono is a considered stack. The critique: Instrument Serif is gaining adoption as "indie editorial" and will read as trend by launch time. More critically: the choice of a high-fashion serif for the display type creates a tension with the platform's identity as a verification system. Verification systems are not fashion objects. They are infrastructure.

**New position:** The typography should be precise before it is beautiful.

Retain Geist (interface, body) and Geist Mono (data). These are correct.

For display type: **replace Instrument Serif with Fraunces** (Google Fonts, variable, free). Fraunces is an optical-size-aware serif designed for display use. Its distinguishing quality is that it was designed to change character as it scales — at large sizes, it becomes expressively weighted; at smaller sizes, it becomes more regularized. This matches the PENDING → RESOLVED polarity: large display type has expressive weight (the resolved state, the declaration), while the same character at text size becomes more neutral (explanation, process).

Fraunces also has a softness that Instrument Serif lacks at italic — not calligraphic softness (which reads as decorative), but structural softness. It communicates "built carefully" rather than "styled carefully."

Fraunces italic at Display 1 is still the page-level signature. But the reason is different from V2's reason. The italic is used for the problem statement — for the uncertainty before resolution. Regular weight is used for the resolved state: the definition, the confirmation, the platform's actual name.

**Typography encodes the polarity:**
- Fraunces italic → things in the process of being understood (problems, context, questions)
- Fraunces regular → things that have been resolved (platform definitions, verification outcomes, hub descriptions)
- Geist → all operational and explanatory text
- Geist Mono → all system output (data, statuses, timestamps, scores)

---

## Color: Rebuilt from the Polarity

V2's palette is warm and considered but generic.

**The new palette is built from the polarity system:**

**PENDING surfaces:**
```
pending-base      #F4F1EB   Warm, slightly ambiguous — not paper white, slightly yellowed
pending-raised    #EDE9E0   Raised surfaces in pending state
pending-recessed  #E5E1D7   Recessed panels in pending state
```

**RESOLVED surfaces — light:**
```
resolved-white    #FFFFFF   Pure white — the confirmed, certain state
resolved-near     #F8F7F5   Near-white — the surrounding context of a resolved element
```

**RESOLVED surfaces — dark:**
```
resolved-black    #0E0E0C   Near-black — resolved system layer
resolved-deep     #171714   Deep dark — raised within dark resolved sections
resolved-panel    #1F1E1A   Panels within dark resolved sections
```

**The verified mark:**
```
verified          #1B5C35   Deep forest green — the color of the completed verification line
verified-dim      #2A7A4D   Lighter green for secondary verified states on dark backgrounds
verified-tint     #EDF4EF   Tint surface for verified-state panels
```

**The pending mark:**
```
pending-amber     #B5600A   Amber/rust — things in process, awaiting resolution
pending-tint      #FBF3EC   Tint surface for pending-state panels
```

**The denial state:**
```
denied-muted      #8A3A3A   Muted dark red — not alarming, but definite
denied-tint       #FAF0F0   Tint for denied-state panels
```

**Text on pending surfaces:**
```
text-forming      #5C5853   Secondary text on pending surfaces — slightly lower contrast, not yet resolved
text-pending      #2D2B27   Primary text on pending surfaces
text-ghost        #9C9891   Tertiary, captions — the quietest information
```

**Text on resolved surfaces (light):**
```
text-resolved     #1A1916   Primary text — full weight, confirmed
text-secondary    #6B6763   Secondary text on light resolved
```

**Text on dark resolved surfaces:**
```
text-bright       #F7F5F1   Primary text on dark — clean, certain
text-dim          #9A9793   Secondary text on dark resolved
```

**Borders:**
```
border-pending    dashed #D4CFC8   Pending state borders — interrupted, not complete
border-resolved   solid #D0CCC4    Light resolved borders — solid, definite
border-dark       solid #2A2924    Dark resolved borders
border-verified   solid #8AB89D    Verified state container borders
```

The dashed border for pending-state elements is the most specific identity decision in this color system. No other platform encodes its domain logic into its border style.

---

## No Shadows, No Gradients, No Blur

These prohibitions from V2 are retained and extended.

**No shadows:** Depth is encoded through the polarity system (pending vs. resolved surface colors) and through 1px borders.

**No gradients:** The only gradient permitted is the verification line animation itself — the line that fills from left to right as it completes. This gradient is motion, not decoration: it exists in the transition, not as a static visual element.

**No blur (backdrop-filter):** Blur implies uncertainty. It is appropriate for interfaces where content is partially visible behind glass. It is not appropriate for a verification system.

---

## Spatial Composition

V2's grid strategy is correct. Retain the 12-column grid, the 8-point spacing scale, and the container system.

One addition: **the axis of resolution.**

Major layouts are composed on a horizontal axis that moves left to right — pending on the left, resolved on the right. This is not always literal, but it governs the composition direction of diagrams, the flow of process steps, and the orientation of the Trust Score bar.

This axis encodes the platform's logic into spatial grammar: progress moves left to right, and what is on the right is further along the verification path.

---

# PART 4 — MOTION LANGUAGE

Motion in V2 was a vocabulary of six techniques. Motion in V1 Experience is a system derived from one principle: **the verification sequence**.

The verification sequence has three phases:
1. **Submission** — A thing enters the system. Status: PENDING.
2. **Processing** — The system acts. Status: UNDER_REVIEW.
3. **Resolution** — A decision is made. Status: VERIFIED, REVISION_REQUIRED, or DENIED.

Every animation on the website is a variation of this sequence.

---

## The Primary Animation: The Verification Line

The most important animation on the website is the verification line — the horizontal bar that fills from left to right, completing when a status resolves.

Implementation:
```
Initial state:    width: 0%, background: pending-amber at 40% opacity
Filling state:    width increases from 0% to [score]% at 1200ms, ease: none (linear — it's a process, not a dramatic reveal)
Resolution:       At completion, color transitions from pending-amber to verified green at 300ms, ease: power2.out
Status label:     Resolves alongside the bar completion (Verification Mark animation — scale 0.96→1.0, opacity 0→1, 250ms, power3.out)
```

This is the only animation that uses a color transition during the animation itself. Every other animation uses opacity and transform. The color shift from amber to green IS the meaning — it is the moment of resolution made visible.

---

## Section Entrances: Resolution, Not Emergence

V2's "Emergence" animation (opacity 0→1, no Y translation) is too minimal to carry meaning. It does not communicate anything about UmojaHub.

Replace with **Resolution entrance**:

Elements enter by transitioning from the pending state to the resolved state. Concretely:
```
Initial:    opacity: 0, filter: blur(1px) — the element exists but is unresolved
Final:      opacity: 1, filter: blur(0px)
Duration:   500ms
Ease:       power2.out
```

The 1px blur (imperceptible at reading, visible at headline size) communicates that the element was there but undefined. The blur clearing is the resolution moment.

This is different from any other website's entrance animation because the blur is not decorative — it is the pending state made visible. Combined with the color system (pending surfaces are slightly warm, resolved surfaces are cooler), the entrance carries meaning.

**Important constraint:** The blur must never exceed 1px. More than 1px becomes a "glassy blur" effect borrowed from Apple. At exactly 1px, it communicates "coming into focus" without calling attention to itself.

---

## Process Sequence: The Verification Line Draws

When workflow diagrams animate, the verification line draws along the connecting paths between nodes. Nodes begin with dashed borders (pending state). When the verification line reaches a node, the border solidifies and the node label resolves.

```
Path draw:        stroke-dashoffset animation, linear ease, 400ms per segment
Node activation:  border-style: dashed → solid at 100ms after path reaches node
Label resolution: opacity 0→1, blur 1px→0, 250ms after node activation
```

The sequence: uncertainty exists → the line moves → things are confirmed one by one.

This is not six separate animation techniques. It is one animation — the verification sequence — applied to every diagram on the site.

---

## Statistics: The Score Settles

Data numbers animate differently from V2's count-up:

```
Initial:    The number appears immediately at 100% opacity at [finalValue × 0.6]
             — not animated in, just present, as though it arrived
Animation:  Increments upward from 60% to 100% of final value
Duration:   600ms (shorter than V2's 800ms — this is not theatrical)
Ease:       power1.out (almost linear — numbers don't have momentum)
```

The difference from V2: numbers appear immediately at a real-but-lower value. There is no arrival. There is settling. As though the data was always there and the count is just resolving to its current state.

---

## The Trust Score: Scroll-Pinned, Staged

Retained from V2 but with a different visual treatment. The Trust Score section is the primary scroll-pinned narrative.

The visitor scrolls into the section. The pin activates. The verification line begins at 0 and fills as the visitor scrolls. Each component (Verification 40pts, Transactions 25pts, Ratings 20pts, Reliability 15pts) activates when the line reaches its position. The label above each component shifts from `text-forming` (muted) to `text-resolved` (full) as the line passes through.

At 100 points (full Trust Score), a VERIFIED status label resolves alongside the completed bar. The entire experience takes approximately 8 seconds of slow scrolling. The visitor has watched the mechanism that determines their trustworthiness being assembled in real time.

This is the single most communicative animation on the website. Every other animation serves this one.

---

## The M-Pesa Sequence: Scroll-Pinned, Discrete Steps

Retained from V2. Updated: the STK Push moment is emphasized with a distinct screen animation — a mobile phone frame slides in from the right when the STK Push node activates. This is the only Y-translation on the entire website, and it is justified: the phone physically arrives in the buyer's hand.

---

## Banned Animations (extended from V2)

```
✗  Any Y-translation except the M-Pesa phone arrival
✗  X-translation (horizontal slide) on any element
✗  Scale transforms on content elements (scale is reserved for the Verification Mark)
✗  blur > 1px on any element
✗  Looping animations
✗  Bounce or spring easing (verification systems don't bounce)
✗  Parallax layers
✗  Gradient animations (static gradients exist nowhere; moving gradients exist nowhere)
✗  Hover animations that change layout
✗  Typewriter effects
✗  Page preloaders
✗  duration > 1200ms on any single element except the Trust Score fill
✗  Stagger delay > 80ms (V2's 120ms is too slow — sequences should feel like a system, not a presentation)
✗  Any animation that plays before the visitor scrolls to the element
   (all animations are scroll-triggered unless within the first viewport)
```

---

## The GSAP Strategy

The answer V2 could not provide: **What is the one animation that tells you this is UmojaHub?**

Answer: **The verification line completing.** The horizontal bar, amber to green, filling to its score, resolving into a status label. This animation appears in the Trust Score section, in every workflow diagram, in the active navigation indicator, and in the page transition. It is the visual signature.

GSAP usage map:

| Animation | Purpose | Technique |
|---|---|---|
| Verification line | The Trust Score fills | gsap.to, width + color, ScrollTrigger pin |
| M-Pesa phone arrival | STK Push moment | gsap.fromTo, X translation, ScrollTrigger pin |
| Diagram path draw | Sequence in workflows | SVG stroke-dashoffset, ScrollTrigger |
| Node activation | Each node confirms | border-style class swap + label resolution |
| Resolution entrances | All section elements | opacity + blur filter, ScrollTrigger |
| Statistics settling | Number confirmation | TextPlugin count, ScrollTrigger |
| Status label resolve | VERIFIED/DENIED appear | scale + opacity, Verification Mark timing |

No animation falls outside these seven categories. Every animation is one of these seven or it does not exist.

---

# PART 5 — NARRATIVE SEQUENCING

The V2 homepage presents information in the order the mind needs it. This document designs a journey.

The distinction: information sequences satisfy a need. Journeys create a need.

---

## The Homepage Journey

The homepage is not seven explanatory sections. It is a single narrative arc with a discovery in the middle.

**Act 1 — Recognition (Sections 1–2)**

The visitor arrives and immediately recognizes a problem they know. Not a problem UmojaHub describes — a problem the visitor has experienced.

Section 1 does not open with a platform definition. It opens with the problem — stated in the terms of the person experiencing it, not the terms of the platform solving it.

For a farmer: *"You know what your produce is worth. A buyer doesn't know whether to believe you."*
For a student: *"You completed the project. An employer doesn't know whether the work was yours."*

The homepage cannot address both audiences simultaneously with the same opening. The solution: the homepage opens with the verification mechanic that both problems share, stated at the structural level — not "we have a marketplace and an education hub" but "trust has the same problem in two different places." The visitor who has experienced either version recognizes it.

**Act 2 — The Discovery (Section 3)**

The structural insight: the two hubs share one verification architecture. This is not presented as a feature. It is presented as a diagram — the central structural diagram of the platform.

Two domain trees (agricultural marketplace, CS education) visible on the left and right. Between them: the shared verification layer. Document review flows up from both domains into the same administrative process. Trust scores flow back down into both domains.

This diagram stops people. It says: "This is not a marketplace with a side project. This is a verification platform that operates in two domains." The insight is visual, not textual.

**Act 3 — The Mechanism (Sections 4–5)**

Now that the visitor understands the structure, the mechanism is explained. How does verification work in each domain? This uses the workflow diagrams — the same vocabulary as the rest of the site.

This section answers the question the discovery created. The visitor is not being informed — they are finding the answer to something they now want to know.

**Act 4 — The Evidence (Section 6)**

Live statistics. Not to prove growth — to prove operation. The platform is running right now. These numbers change. They are timestamped. The evidence is current.

**Act 5 — The Invitation (Section 7)**

Now — and only now — the invitation to engage. Not a CTA button ("Sign up free") but a directional invitation: "Find your context." The audience navigator. The visitor who has followed the journey knows exactly which audience they are.

No CTA above the fold is correct. But "Find your context" as the fifth section, arrived at after genuine understanding, is a CTA that carries the weight of everything before it.

---

## The Audience Page Journey

Each audience page is a journey from recognition to confidence.

**Stage 1 — Recognition (Dark header)**

The page opens with the specific situation of this audience, stated without sentimentality. Not "Farmers face challenges." The actual situation:

*"You have identity documents. A buyer has no way to verify them. UmojaHub creates the infrastructure for that verification."*

This is the Recognition stage. The visitor reads this and thinks: "This is about me."

**Stage 2 — Mechanism (Light sections)**

The complete workflow, documented step by step. Nothing hidden. Both the approval path and the rejection path shown with equal clarity. The visitor learns the mechanism.

**Stage 3 — Experience (Scroll-pinned narratives)**

The visitor does not just learn the mechanism — they experience it. The Trust Score fills as they scroll. The M-Pesa sequence activates step by step. They have now *felt* what the platform does, not just understood it.

**Stage 4 — Interrogation (FAQ + Limitations)**

The visitor who has felt the experience now asks the hard questions. What happens if my documents are rejected? Can a buyer dispute my Trust Score? What does this system actually guarantee? These questions are answered with specificity, not reassurance.

**Stage 5 — Decision (Next steps)**

Three options maximum. Register. Read the verification methodology. Contact. The visitor who has arrived here has taken a journey. The decision is theirs.

---

# PART 6 — SCREENSHOT STRATEGY

V2's screenshot strategy: "Real screenshots as primary assets. Annotated. At 2× resolution."

This is correct directionally and insufficient in execution.

**The problem with "annotated screenshots":**

Annotations imply that the screenshot requires explanation. A screenshot that requires explanation is a bad product demonstration. The screenshot should communicate on its own. Annotations are a crutch.

**The revised strategy:**

**Type 1 — The Isolation Screenshot**

One specific UI element, isolated from the surrounding interface, shown at display size. The Trust Score component. A single product listing card. A verification status panel.

The isolation communicates that this element is important enough to be shown alone. It focuses attention. It does not require annotation because there is only one thing to look at.

**Type 2 — The Context Screenshot**

The full interface at browser width, at 1.5× scale, with a soft gray frame (the browser chrome), cropped to show the relevant section. Not annotated. The framing itself says: this is the product, running, for real.

**Type 3 — The Comparative Screenshot**

Two states of the same element, shown side by side. The Trust Score at NEW tier alongside the Trust Score at TRUSTED tier. The verification status as PENDING alongside the same status as VERIFIED. Before and after — the resolution moment visualized in the actual interface.

**Type 4 — The Mobile Screenshot**

The M-Pesa STK Push screen on an actual phone. Not a device mockup — a photograph of a real phone showing the STK Push prompt. This is the most specific screenshot on the entire website because only UmojaHub's payment flow produces this exact screen on a Kenyan buyer's phone.

**Asset priority:**
1. The Trust Score component (isolation) — needed before For Farmers page launches
2. The PENDING → VERIFIED transition (comparative) — needed before Trust page launches
3. The marketplace listing card (isolation) — needed before For Buyers page launches
4. The M-Pesa STK Push screen (mobile photo) — needed before For Farmers and For Buyers pages launch
5. The student project submission interface (context) — needed before For Students page launches
6. The full marketplace browse view (context) — needed before homepage launches

---

# PART 7 — PRODUCT DEMONSTRATION STRATEGY

V2's product demonstration: workflow diagrams + annotated screenshots.
This document's product demonstration: **the verification sequence, experienced in real time**.

The platform's most demonstrable feature is not a UI element. It is the state transition: PENDING → VERIFIED. Everything else (the marketplace, the education hub, the M-Pesa integration) is infrastructure around this moment.

**Demonstration principle:** Show the state transition at every opportunity.

On the homepage: The Trust Score fills during the statistics scroll-pinned section. The visitor watches a score being assembled.

On the For Farmers page: The verification flow diagram activates step by step. The PENDING node has dashed borders. When the administrator review line reaches it, the borders solidify and the APPROVED status label resolves.

On the Trust page: The most extensive demonstration — the full Trust Score scroll-pinned narrative, component by component, with the verification line completing at the end.

On the For Students page: The three documents (Proposal, Implementation Record, Reflection) animate into the peer review queue. The peer review status resolves. The lecturer review status resolves. A portfolio entry verification mark completes.

In every case, the demonstration is not a screenshot with an explanation. It is an experience of the core mechanic.

---

# PART 8 — TRUST COMMUNICATION STRATEGY

V2's trust approach: Limitation Disclosure Panels, live data with timestamps, exact technical language, visible rejection paths.

These are all correct. The critique is not of the content but of the framing.

**V2's problem:** Limitations are disclosed after claims. The structure is: "Here is what the platform provides. Here is what it does not provide." This is honest but it positions limitations as qualifications to the claim — as though the claim would be better without them.

**The revised approach:** Limitations lead, not follow.

The most trust-building thing the website can do is present the limitation before the visitor needs to ask about it. Not: "Verification confirms identity. It does not assess produce quality." Instead: "The platform confirms identity. What it cannot do is assess produce quality — that remains the buyer's judgment."

The limitation is not a qualification. It is proof that the platform knows what it is.

**Structural change:** On every audience page, the first section after the dark header context is called **"What we can confirm."** Not "How verification works" — "What we can confirm." The title acknowledges the limits of the claim before the claim is made.

**What we can confirm:**
- Identity (document verification)
- Activity history (transaction count, project submissions)
- Rating record (buyer/lecturer feedback on file)

**What we cannot confirm:**
- Produce quality before it is received
- A student's cognitive contribution versus tool assistance
- Future performance of any verified entity

This inversion — leading with the boundary of the claim — is the most specific trust-building technique the website can use. No other platform does this. Most platforms bury limitations in FAQs. The platforms that lead with limitations are the ones that actually have well-bounded systems they are confident in.

---

# PART 9 — HOMEPAGE STORYTELLING ARCHITECTURE

The homepage is a five-act structure, not seven sections of information.

---

## Act 1 — The Problem, Stated Precisely
*(Declaration density, light surface)*

**No platform definition. No hero.** The opening is a problem statement in Fraunces italic at Display 1.

The problem has two versions. The homepage opening acknowledges both without choosing one:

*"Agricultural markets in East Africa run on trust that buyers cannot verify and CS portfolios run on work that employers cannot confirm."*

One sentence. No CTA. No visual treatment except the type. The visitor reads this and either recognizes their problem or understands the platform's domain.

Below: Two short paragraphs, max 40 words each, expanding the two problems. Fraunces regular (not italic — these are not uncertain problems, they are documented facts). No bullets. No formatting. Prose.

---

## Act 2 — The Structural Insight
*(Dark resolved surface — this is the key section, treated with the highest visual weight)*

The Central Diagram: The Shared Verification Architecture.

This is the diagram that V2 missed entirely. A visualization of the two domain trees sharing one verification core. The visitor who has read Act 1 looks at this diagram and the insight lands: "This is the same problem solved the same way in two contexts. That is a specific and unusual thing."

The diagram animates: the two domain trees draw first (pending state, dashed borders). Then the verification layer between them draws. Then the connection lines from each domain into the verification layer complete. Then the Trust Scores and portfolio marks flow back out from the verification layer into each domain. The full sequence takes 3 seconds on auto-play as the visitor scrolls into the section.

Below the diagram: One sentence. Not a caption. A statement: *"The same verification architecture produces a farmer's Trust Score and a student's portfolio mark."*

No further explanation. If the diagram is built correctly, the statement requires none.

---

## Act 3 — The Mechanisms
*(Light surfaces, alternating — this is the explanatory body)*

Two sections: the marketplace mechanism and the education mechanism.

Each section:
- A flow diagram (the mechanism animated on scroll)
- Three sentences explaining what the diagram shows (no more)
- One specific fact about scale or process that is not visible in the diagram

The diagrams use the verification sequence animation: pending nodes activate when the verification line reaches them.

---

## Act 4 — The Evidence
*(Dark resolved surface)*

Four numbers. No charts. No growth indicators.

- Verified farmers on the platform right now
- Total completed transactions
- Verified portfolio entries
- Counties with active farmers

Each number is large (Geist Mono, 64px), timestamped (Geist Mono, 12px, secondary color), and labeled in prose below. No decoration. The numbers exist in time. The visitor can see the timestamp and know whether the data is current.

Below the numbers: *"These figures are drawn from the live platform database and update every five minutes."*

---

## Act 5 — The Invitation
*(Light surface — the quietest section, by design)*

**"Find your context."** Fraunces regular, Display 3.

The audience navigator: 11 audiences, organized by hub. No icons. No benefit statements. Just the audience name and one sentence: what the platform provides for them.

A farmer card reads: "Farmers — Document verification, Trust Score building, M-Pesa-enabled transactions."

The visitor who has followed the journey from Act 1 to Act 5 knows exactly which card is theirs.

---

# PART 10 — NAVIGATION PHILOSOPHY

V2's navigation philosophy is directional: help any visitor find where they belong in one step.

Retain this. Add one thing: **the navigation expresses the platform's architecture.**

The "For You" dropdown reveals the dual-hub structure. Seeing two columns — Food Security Hub and Education Hub — is the first encounter with the platform's architecture for any visitor who comes to the website cold. The navigation is not just utilitarian. It is the first structural diagram.

**Navigation bar treatment:**

The navigation bar has one element that V2 does not: the verification line as the active page indicator.

When a visitor is on the For Farmers page, the "For You" nav item has an underline that is not a static underline. It is the verification line — a hairline that completes from left to right when the page loads. On hover over any nav item, a shorter version of the line fills. On click and navigation, the line completes and then the new page loads.

This is not decoration. It is the visual signature applied to every interaction in the interface.

**Navigation logo treatment:**

"UmojaHub" in Geist, 18px, weight 600. To the left of the name: a minimal mark — the verification line as a standalone element. Two horizontal lines: the top line (shorter, amber) represents the pending state; the bottom line (longer, green) represents the resolved state. The mark communicates the platform's core mechanic in 16×12 pixels.

This mark replaces any graphical logo and is derived entirely from the visual idea.

---

# PART 11 — THE DUAL-HUB RELATIONSHIP

This is the most important section in the document. V2 buried it. This document centers it.

---

## The Insight

UmojaHub operates two completely different domain applications — an agricultural marketplace and a CS education platform — using a single verification architecture. A farmer's Trust Score and a student's portfolio entry are produced by the same document review process, the same administrator decision, the same behavioral tracking system.

This is not a technical coincidence. It is the platform's design thesis: **trust has a common structure across domains.** The specific documents change. The verification mechanism does not.

This insight makes UmojaHub genuinely interesting to think about. It also makes the platform more trustworthy in each domain: the verification architecture is general enough to apply across contexts, which means it was designed for verification, not for a specific market's optics.

---

## The Central Diagram

The Central Structural Diagram lives on the homepage (Act 2) and on the How It Works page as its centerpiece.

It shows:

```
[Farmer submits documents]    [Student submits documents]
[Farmer creates listing]      [Student submits project]
        ↓                              ↓
[FOOD SECURITY HUB input]    [EDUCATION HUB input]
                ↓                ↓
         [VERIFICATION LAYER — shared]
         Document review
         Identity confirmation
         Administrative decision
         Trust record creation
                ↓                ↓
[Trust Score → marketplace]  [Portfolio mark → employer]
[Buyer sees TRUSTED tier]    [Employer sees VERIFIED entry]
```

The visual treatment:
- Left column: #1A5C34 green axis (Food Security Hub color)
- Right column: #1B3A7A navy axis (Education Hub color — introduced here for the first time as a distinct hub color)
- Center: neutral dark resolved surface where the two meet
- The verification layer is visually at the center of the composition, equal distance from both inputs

The animation sequence: left column draws top-to-bottom, right column draws top-to-bottom simultaneously, then both convergence lines draw into the center (the verification layer), then the verification layer activates with its content, then the two output lines draw downward back out into each domain.

The total sequence communicates: separate inputs → shared process → separate outputs. The platform's dual nature is not a collection of two products. It is one process with two applications.

---

## Hub Color System

V2 used one color for verification (verified-green) and did not distinguish between hubs visually.

This document introduces a deliberate hub color distinction:

```
Food Security Hub:   #1B5C35  (forest green)  — the agricultural domain
Education Hub:       #1C3A7A  (deep navy)     — the academic/institutional domain
Shared verification: #2A2924  (dark neutral)  — the common layer, hub-agnostic
```

Hub colors appear:
- As the left-border accent on hub-specific page headers
- In the Central Structural Diagram
- In the nav dropdown column headers
- As the active link color on hub-specific audience pages (not verified-green for education pages — navy)

This distinction is subtle but specific. A visitor who reads the For Students page (navy hub color) and then the For Farmers page (green hub color) understands without being told that they are in different hub contexts. The color is not decorative — it encodes hub membership.

---

# PART 12 — VISUAL UNIQUENESS STRATEGY

The blur test problem: how do you make a page that passes the blur test — that is immediately identifiable as UmojaHub at 40% opacity blur, no logo?

**The answer is layered:**

**Layer 1: The verification line as a recurring motif.**

The horizontal bar that fills from left to right appears on every page:
- In the Trust Score section (the primary instance)
- As the active nav indicator
- In every workflow diagram as the connection line
- As the page transition element

Any page from the website, blurred, contains this horizontal line motif in the same visual treatment. This is not decoration. It is the recurring structure that makes the website recognizable.

**Layer 2: The pending/resolved surface polarity.**

Pages that contain pending-state elements (workflows showing the process before completion) use the `pending-base` (#F4F1EB) warm surface with dashed borders. Pages or sections that show the resolved state use higher-contrast surfaces.

This surface polarity — and especially the dashed borders — is unique. No other product uses dashed borders to communicate semantic state at the layout level.

**Layer 3: The Central Structural Diagram.**

If you see the two-column diagram with the shared center, you know you are on UmojaHub. This diagram appears on two pages (Homepage, How It Works) and is the most distinctly UmojaHub visual element that exists.

**Layer 4: Hub color application.**

The specific combination of forest green (Food Security) and deep navy (Education) in a single navigation dropdown — the two-column structure with these specific colors — is unique. No other platform has a two-domain structure with domain-specific hub colors expressed in the navigation.

---

# PART 13 — GSAP STRATEGY (DEFINITIVE)

GSAP is used for five categories of animation and no others.

**Category 1: The Verification Line**
The platform's primary animation. Used in: Trust Score (scroll-pinned), workflow diagrams (scroll-triggered), nav indicator (on page load/interaction).

GSAP technique: `gsap.to()` on width property (0% → [score]%), followed by immediate `gsap.to()` on backgroundColor (amber → green). ScrollTrigger with pin for Trust Score. No pin for diagrams.

**Category 2: Node Activation**
When the verification line reaches a diagram node, the node's border-style changes from dashed to solid and the label resolves.

GSAP technique: `gsap.to()` on opacity and filter (blur 1px → 0px) for the label. The border-style change is a class toggle via ScrollTrigger's `toggleClass` or `onUpdate` callback.

**Category 3: Resolution Entrances**
All section elements enter by resolving from blur(1px) to blur(0px).

GSAP technique: `gsap.from()` with `opacity: 0, filter: 'blur(1px)'`. ScrollTrigger with `once: true`. Stagger ≤ 80ms between related elements.

**Category 4: Statistics Settling**
Numbers settle from 60% to 100% of their final value.

GSAP technique: GSAP TextPlugin or a custom `obj.value` tween with `onUpdate` to write to the DOM. ScrollTrigger with `once: true`.

**Category 5: The M-Pesa Phone Arrival**
The only X-translation on the site. A phone frame enters from the right at the STK Push moment.

GSAP technique: `gsap.fromTo()` with `x: 60, opacity: 0 → x: 0, opacity: 1`. 400ms, power3.out. Triggered by the M-Pesa scroll-pinned narrative reaching the STK Push node.

**GSAP is not used for:**
- Page transitions (CSS only)
- Hover effects (CSS only)
- Accordion open/close (CSS height transition or GSAP if height is unknown — auto-height requires GSAP)
- Navigation dropdown (CSS only)
- Mobile sheet/drawer (CSS only)

The accordion FAQ uses GSAP for height animation (unknown height cannot be CSS-transitioned cleanly without layout shift). This is the one exception — it is a functional requirement, not an animation decision.

**The answer to "what one animation identifies UmojaHub?":**

The verification line completing — the horizontal bar filling left to right, transitioning from amber to green, with the status label resolving alongside it.

This animation is shown to every visitor at least once on every audience page (in the Trust Score section or workflow diagrams). It is the visual signature.

---

# PART 14 — ASSET STRATEGY

Assets block implementation. The asset strategy determines which sprints can launch.

**Tier 1 — Required before homepage launches:**
- Central Structural Diagram built as SVG React component (designed before built)
- Marketplace flow SVG (designed before built)
- Education flow SVG (designed before built)
- Platform statistics (live data — already exists via `getTransparencyData()`)

**Tier 2 — Required before For Farmers page launches:**
- Trust Score component isolation screenshot (live platform)
- PENDING → VERIFIED state comparison screenshot (live platform)
- M-Pesa STK Push screen photo (photographed from a real phone during testing)
- Trust Score scroll-pinned narrative SVG (designed before built)
- Verification flow diagram SVG (designed before built)

**Tier 3 — Required before For Buyers page launches:**
- Marketplace listing card isolation screenshot
- M-Pesa payment flow from buyer perspective SVG

**Tier 4 — Required before Education Hub pages launch:**
- Student project submission interface screenshot
- Portfolio entry state comparison screenshot (unverified vs verified)
- Education pipeline SVG (three documents → review → outcome)

**What never blocks a launch:**
- Photography (pages are designed to function without it)
- The county GeoJSON map (the Transparency page launches without the map and states its absence honestly)

---

# PART 15 — PHOTOGRAPHY STRATEGY

V2's photography strategy: no stock photography; real photography or nothing; black-and-white editorial treatment.

This is retained. Two additions:

**Addition 1: The M-Pesa photograph is not optional.**

A photograph of an actual phone displaying the M-Pesa STK Push prompt during a UmojaHub transaction is the most specific and powerful single image on the website. It cannot be illustrated. It cannot be mocked. It requires a real transaction during the platform testing phase.

This photograph belongs: on the M-Pesa payment explanation section (For Farmers, For Buyers pages), and potentially on the homepage if the discovery of the payment mechanic is a key moment.

Treatment: no filter, no frame. The phone is shown in a hand or on a surface — context without styling. The specificity of the M-Pesa interface (which is unmistakably Kenyan) is itself the visual statement.

**Addition 2: The absence of photography is stated once and archived.**

V2 proposed: "An empty space is better than a lie. The absence of photography is noted in the page as an honest acknowledgment."

This is correct but should not be a UI element. The honest absence is noted in a comment in the component code and in the page's status on the implementation roadmap. It is not shown as a design element to website visitors. Visitors do not need to be told what assets the team hasn't acquired yet. An empty space without explanation reads as a design decision. An empty space with an explanation reads as an apology.

---

# PART 16 — ILLUSTRATION STRATEGY

V2: zero decorative illustration.

This document: zero illustration, including conceptual illustration.

The distinction between V2 and this document: V2 permitted "conceptual diagrams that cannot be represented as process flows" as the one category of illustration. This document removes this category.

**Why:** Any conceptual relationship that cannot be expressed as an SVG diagram built from the node vocabulary in Part 17 should be expressed as prose. Conceptual illustration tends to become decorative illustration under deadline pressure. The category does not belong in the system.

The Central Structural Diagram (the two hubs sharing one verification layer) replaces the conceptual illustration category. It is an SVG diagram, not an illustration. It uses the same node vocabulary as every other diagram on the site.

---

# PART 17 — DIAGRAM STRATEGY

V2's diagram vocabulary is correct in principle. The pending/resolved polarity adds one new element.

**Updated node vocabulary:**

**Pending nodes (state: before verification reaches this point):**
- Border: 1.5px dashed `#D4CFC8`
- Background: `pending-raised` (#EDE9E0)
- Label: `text-forming` (#5C5853)

**Resolved nodes (state: after the verification line passes through):**
- Border: 1.5px solid `border-resolved` (#D0CCC4)
- Background: `resolved-near` (#F8F7F5)
- Label: `text-resolved` (#1A1916)

**Verified outcome nodes (state: VERIFIED, APPROVED, TRUSTED):**
- Border: 1.5px solid `border-verified` (#8AB89D)
- Background: `verified-tint` (#EDF4EF)
- Label: `text-resolved` (#1A1916) with `verified` (#1B5C35) dot prefix

**The verification line in diagrams:**

The connection lines between nodes are not simple arrows. They are the verification line. When animated, they fill from source to destination. Before animation, they are in the pending color (`pending-amber` at 40% opacity). After the line completes, they solidify to `text-ghost` (#9C9891) color — the connection is established, but the line has delivered its energy and settled.

**The Central Structural Diagram** uses this vocabulary with the hub color distinction: Food Security Hub nodes use a `forest-green` left-border accent, Education Hub nodes use a `deep-navy` left-border accent, and the shared verification layer nodes use no hub accent — they are hub-agnostic.

**Diagram priority (unchanged from V2, with one addition):**

0. **Central Structural Diagram** (new, highest priority) — the two hubs sharing one verification architecture
1. M-Pesa Payment Flow (farmer perspective)
2. M-Pesa Payment Flow (buyer perspective — reuses 80% of farmer diagram)
3. Farmer Verification Process
4. Trust Score Component Breakdown (scroll-pinned, not a static diagram)
5. Education Hub Pipeline
6. Marketplace Transaction Flow
7. Trust Tier Ladder
8. Document Audit Trail
9. Cooperative Group Order Flow

The Central Structural Diagram is the most important diagram on the site and must be designed before implementation begins. Every other diagram is built from the same vocabulary. The Central Diagram establishes that vocabulary.

---

# PART 18 — PAGE HIERARCHY STRATEGY

Not all pages are equal. Design effort and launch priority should reflect the pages' roles.

**Tier 1 — The Platform's Identity Pages**

These three pages define UmojaHub. If a visitor reads only these three, they understand the platform completely.

1. **Homepage** — the journey from problem to discovery to invitation
2. **Trust page** — the deepest methodology documentation; the primary trust signal
3. **How It Works page** — the complete structural explanation with all major diagrams

These pages launch first. They are the minimum viable website.

**Tier 2 — The Audience Entry Points**

The pages most visitors from Google and social links will land on.

4. **For Farmers** — the largest audience; the most mechanically complete page
5. **For Students** — the second largest audience; the most distinctive hub
6. **For Buyers** — required to make the marketplace credible

**Tier 3 — The Supporting Audience Pages**

7. **For Lecturers** — required for Education Hub credibility
8. **For Employers** — makes the portfolio entry claim credible to the employment market
9. **For Suppliers** — Food Security Hub completeness

**Tier 4 — The Structural Pages**

10. **Transparency** — data display showpiece; builds credibility through openness
11. **About** — organizational context; minimal design
12. **For Cooperatives** — group ordering mechanics
13. **For Institutions** — faculty registration path
14. **For NGOs/Government** — impact and geography focus

**Launch sequence:**

Tier 1 pages (Homepage + Trust + How It Works) launch together — they form a complete unit. A visitor who can navigate between these three pages understands UmojaHub fully.

Tier 2 pages launch in the first sprint after Tier 1. The platform is not usable without them.

Tiers 3 and 4 launch as content is ready, with no hard deadline dependency.

---

# DECISIONS THAT CHANGED FROM V2

Every decision in this document was reconsidered from V2. The decisions that changed:

| Decision | V2 | V1 Experience | Reason |
|---|---|---|---|
| Display typeface | Instrument Serif | Fraunces | Specificity, optical-size behavior encodes polarity |
| Primary surface | warm off-white #F8F6F2 | pending-base #F4F1EB | Encodes pending state semantically |
| Pure resolved surface | not present | #FFFFFF white (resolved) | Polarity requires a confirmed resolved state |
| Hub color distinction | not present | Food Security green, Education navy | Hub architecture must be visually legible |
| Dark sections | for "system layer" | for resolved/confirmed states | V2's reason was borrowed from Stripe; this reason is derived from the product |
| Section entrances | Emergence (opacity only) | Resolution (opacity + blur 1px) | Encodes pending→resolved; communicates the visual idea |
| Homepage structure | 7 informational sections | 5-act narrative journey | Curiosity and discovery over comprehensive information |
| Limitations placement | after claims | before or simultaneous with claims | Lead with bounds; more trust-building |
| Homepage opening | platform definition | problem statement | Visitors recognize their problem before they recognize a platform |
| Dual-hub expression | nav dropdown only | Central Structural Diagram + hub colors | The most important structural insight deserves the most visual investment |
| Blur test solution | not addressed | Verification line motif + dashed pending borders | Specific recurring elements that cannot appear on other platforms |
| Illustration policy | SVG conceptual diagrams permitted | zero illustration, all concepts expressed as SVG node diagrams | Removes the category that becomes decorative under pressure |
| Photography absence | stated to visitors as honest acknowledgment | coded into the component, invisible to visitors | Visitors don't need to read about missing assets |
| GSAP primary question | not answered | Verification line completing (amber→green) | One animation identifies UmojaHub; V2 could not name it |

---

# DECISIONS CONFIRMED FROM V2

These V2 decisions were re-examined and retained:

- Geist + Geist Mono for interface and data text
- 8-point spacing system
- 12-column grid, 24px gutters
- max-w-[72ch] for all prose
- No shadows (depth through borders and surface color)
- No border-radius > 4px except status pills
- No stock photography
- prefers-reduced-motion via gsap.matchMedia(), no initial CSS opacity:0
- Scroll-pinned Trust Score narrative and M-Pesa sequence
- Left-spine layout (no center alignment)
- Hub-structured navigation dropdown
- SectionAnchor sidebar on audience pages
- StatusLabel component vocabulary (● VERIFIED, ● PENDING)
- LimitationPanel as a required section-level element
- SVG diagrams as React components with full accessibility
- revalidate = 300 on homepage for live platform statistics
- All content from existing audience pages survives; all visual implementation is rebuilt
- Components designed from content requirements, not extracted from libraries

---

# IMPLEMENTATION GATES

No implementation begins until the following are confirmed:

**Gate 1: Design of the Central Structural Diagram**

The Central Structural Diagram must be designed (at sketch level, not pixel level) before any code is written. It is the primary visual expression of the platform's architecture. If the diagram fails, the visual idea fails.

**Gate 2: Verification Line implementation proof**

Before any audience page is built, the verification line animation must be implemented in isolation — a single React component demonstrating the amber→green fill with the status label resolving alongside it. This is the visual signature. It must work before it is used anywhere.

**Gate 3: M-Pesa STK Push photograph**

Before the For Farmers and For Buyers pages launch, a real photograph of the M-Pesa STK Push screen on a real phone must exist. This is the most specific asset on the website. A placeholder will not be accepted.

**Gate 4: This document approved**

No implementation begins before this document is approved by the user.

---

*End of WEBSITE_EXPERIENCE_ARCHITECTURE_V1.md*
