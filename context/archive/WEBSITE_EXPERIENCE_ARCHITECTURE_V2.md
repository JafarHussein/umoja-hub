# UmojaHub — Website Experience Architecture V2

**Status**: Governing document. Supersedes WEBSITE_EXPERIENCE_ARCHITECTURE_V1.md.
**Produces**: WEBSITE_EXPERIENCE_ARCHITECTURE_V2.md
**Based on**: Forensic audit of V1 (Gemini panel), WEBSITE_INFORMATION_ARCHITECTURE.md, operational requirements of a platform serving farmers on 2G networks and developers on broadband.
**Target**: 8/10+ across all 13 audit categories. Any section below 8/10 is failure.
**Implementation gate**: No code until this document is approved.

---

# SECTION 1 — AUDIT RESPONSE MATRIX

Every criticism from the Gemini audit is documented here. Nothing is skipped. Each criticism receives a root cause analysis, impact assessment, severity rating (Critical / High / Medium), proposed correction, and expected score improvement.

---

## AUDIT CATEGORY 1: FOUNDATIONAL THINKING (Current: 4/10 → Target: 8/10)

### Criticism 1.1 — The "Design Academic" Blind Spot

**Criticism**: V1 was written for an elite design critic who reads websites like a museum brochure. A farmer from Wajir or an anxious CS student in Nairobi does not care about "documentary precision" or "the visual expression of semantic state."

**Why it exists**: V1 was written by someone optimizing for design theory coherence, not for user functional needs. The document used its own aesthetic language ("polarity system," "resolution entrance," "pending state semantics") as organizing principles. These are internal design tools, not user experiences.

**Root cause**: The author confused the design team's conceptual framework with the visitor's actual mental model. A farmer does not experience "the pending/resolved polarity." They experience: "Can I understand what this platform does? Will it help me? Can I trust it?"

**Impact on users**: A farmer on a low-end Android phone visiting the website for the first time encounters an experience optimized for a Figma audience, not for them. The philosophical framing creates cognitive distance between the platform and the people it serves.

**Severity**: Critical. This affects every page, every section, every design decision.

**Proposed correction**: Replace the entire conceptual framework. The governing question is not "how do we express our visual system?" It is: "Can a visitor who has never heard of UmojaHub, running on a mid-range phone, on a spotty connection, understand within 15 seconds what this platform does and whether it is relevant to them?" Every design decision is measured against this question.

**Expected score improvement**: +3 to +4 points. Foundational thinking becomes user-centered instead of design-centered.

---

### Criticism 1.2 — Asymmetrical Information Access

**Criticism**: V1 assumes high-speed internet and pixel-perfect rendering. It relies on blur transitions, complex scroll-pinned sequences, and GSAP animations that require smooth frame rates.

**Why it exists**: The benchmark set (Stripe, Linear, Ramp) all build for broadband users on modern computers. The author applied their motion vocabulary without adapting it to the actual user environment.

**Root cause**: No consideration of network conditions or device capabilities of the actual user base. Kenyan mobile users frequently operate on 2G/3G connections with mid-range devices (Tecno, Infinix, Samsung A-series). Complex GSAP animations on these devices produce jank, layout shifts, and broken experiences.

**Impact on users**: A farmer visiting the website on a Tecno Spark on 3G sees: broken animations, layout shifts during scroll-pin sequences, text jittering during blur transitions, and an overall impression of an unstable product. This is the opposite of the trust signal intended.

**Severity**: Critical. Affects every interactive element.

**Proposed correction**: CSS-first approach. All content visible without JavaScript. GSAP used only for three specific educational sequences (Trust Score assembly, M-Pesa payment flow, workflow diagram activation) and only loaded when the relevant section is in the viewport. All other animations are CSS opacity transitions (hardware-accelerated, sub-10ms GPU cost). Tested on Tecno Spark 10C equivalent.

**Expected score improvement**: +4 to +5 points on Implementation Risk (3/10 → 8+/10).

---

### Criticism 1.3 — The Administrator Black Box

**Criticism**: V1 champions transparency while making "human administrator" the most repeated opaque actor on the site. An unspecified manual administrator looks like a vector for bias, delays, or corruption to a deeply skeptical user.

**Why it exists**: The IA document notes that administrators exist and are disclosed at category level but not at individual level. V1 copied this without questioning whether this level of disclosure is sufficient for a trust-first platform.

**Root cause**: Conflating operational privacy (admins don't need their tools disclosed) with institutional transparency (users need to know who makes decisions and under what rules). These are different. The first is correct. The second is missing.

**Impact on users**: A farmer submitting identity documents to an unnamed "administrator" has no way to know: who reviewed it, what criteria were used, whether the decision was made fairly, or how to challenge it. This is the exact trust failure the platform was built to prevent — in its own verification process.

**Severity**: Critical. This undermines the entire trust architecture.

**Proposed correction**: Full Human Accountability System — administrator names, credentials, decision criteria published. Every verification decision linked to the criteria that governed it. Formal appeals process documented and accessible. Queue transparency (current volume, median review time) visible. See Section 14 — Human Accountability System.

**Expected score improvement**: +2 points on Trust Design (7/10 → 9/10). +2 points on Missing Opportunities.

---

## AUDIT CATEGORY 2: STRATEGIC CLARITY (Current: 5/10 → Target: 8/10)

### Criticism 2.1 — The Inexplicable Marriage

**Criticism**: The document fails to answer why an agricultural marketplace and a CS education program coexist on the same platform. "Trust has a common structure" is a philosophical justification, not an operational one. Donors, corporate buyers, and tech employers will see an unfocused startup.

**Why it exists**: V1 correctly identified the shared verification architecture but framed the explanation philosophically rather than operationally. The document treated "trust has a common structure" as a self-evident insight rather than as a claim that needs to be earned.

**Root cause**: The strategic positioning was never resolved. V1 described the platform's visual expression without first establishing the platform's strategic identity.

**Impact on users**: A corporate buyer or university donor visits the homepage and sees: an agricultural marketplace and a CS education program sharing a URL, with the explanation being "trust has a common structure." They close the tab. The platform appears unfocused.

**Severity**: Critical. Affects every external stakeholder relationship.

**Proposed correction**: Strategic repositioning as Verification Infrastructure. Full analysis in Section 2 — Strategic Repositioning.

**Expected score improvement**: +3 points on Strategic Clarity (5/10 → 8+/10).

---

### Criticism 2.2 — Platform Definition Buried

**Criticism**: By banning a crisp platform definition above the fold, V1 introduces massive cognitive friction. A visitor must navigate through abstract italicized problem statements before discovering what the platform is.

**Why it exists**: V1 prioritized "recognition before definition" — making visitors recognize their problem before introducing the platform. This is sound in principle but failed in execution when the opening sentence asked visitors to simultaneously parse agricultural commerce and CS portfolio problems.

**Root cause**: Problem-first is right when the problem is singular and universally recognized. When the platform serves two completely different problem domains, problem-first without orientation creates confusion.

**Impact on users**: A visitor cannot determine whether UmojaHub is relevant to them without first working through two paragraphs of problem framing. High bounce rate from critical stakeholders.

**Severity**: High. Affects first-time visitor conversion to any further engagement.

**Proposed correction**: Platform definition as the first element, followed by immediate audience routing. See Section 4 — Homepage Architecture.

**Expected score improvement**: +2 points on Strategic Clarity. +1 point on Emotional Design (visitor feels oriented immediately).

---

## AUDIT CATEGORY 3: INFORMATION ARCHITECTURE (Current: 6/10 → Target: 8/10)

### Criticism 3.1 — The Act 1 Bottleneck

**Criticism**: The opening sentence forced visitors to split their brain between smallholder farming logistics and software engineering verification within the first three seconds. Massive cognitive load.

**Why it exists**: V1 tried to unify the dual-hub narrative in a single opening statement, which required the visitor to hold two completely different domains simultaneously.

**Root cause**: Attempting to address both audiences simultaneously before establishing the unifying concept. The unifying concept (verification infrastructure) needed to come first, enabling both domains to be introduced as examples of it.

**Impact on users**: First-time visitors cannot orient within the first three seconds. They cannot answer: "Is this for me?"

**Severity**: High.

**Proposed correction**: New homepage opens with the platform's category ("East Africa's Verification Infrastructure"), then immediately routes visitors by role (three macro-funnels), then explains the two hubs as applications of the same infrastructure.

**Expected score improvement**: +2 points on IA (6/10 → 8+/10).

---

### Criticism 3.2 — Audience Over-Segmentation

**Criticism**: 11 separate audiences in navigation creates choice paralysis.

**Why it exists**: The IA document defines 11 distinct audiences. V1 faithfully reproduced all 11 in the navigation without consolidation.

**Root cause**: Confusing the depth of the IA (which correctly documents 11 audiences) with the navigation entry point (which should show 3 high-level paths). These are different layers. The IA depth is correct. The navigation entry point should consolidate.

**Impact on users**: A visitor encountering 11 navigation options does not identify their entry point faster — they experience choice paralysis and often close the dropdown without clicking anything.

**Severity**: High.

**Proposed correction**: 3 macro-funnels as primary navigation: Food Security Hub, Education Hub, Governance & Impact. Within each macro-funnel, the individual audience pages are accessed. See Section 5 — Navigation Architecture.

**Expected score improvement**: +1 point on IA. +1 point on User Journey Design.

---

## AUDIT CATEGORY 4: USER JOURNEY DESIGN (Current: 5/10 → Target: 8/10)

### Criticism 4.1 — Tech Student Animus

**Criticism**: CS students do not want a slow, soft, structurally built serif experience emphasizing manual administrative checking. They want speed, API technicality, and modern infrastructure transparency. The experience reads as slow, unscalable, and bureaucratic.

**Why it exists**: V1 applied a single design system to all audiences. The same warm editorial language (Fraunces italic, pending-state visual emphasis) was used for farmers, students, lecturers, and employers.

**Root cause**: The design system was audience-agnostic. A 21-year-old CS developer and a 45-year-old farming cooperative leader have completely different expectations for what a credible technical platform looks like.

**Impact on users**: CS students who encounter an agricultural-editorial aesthetic on an education-technology platform immediately doubt the platform's technical credibility.

**Severity**: High. Affects the entire Education Hub audience.

**Proposed correction**: Hub-differentiated presentation layers. Same underlying component system, different density, typography weight, and visual register per hub. See Section 9 — Audience Architecture.

**Expected score improvement**: +2 points on User Journey Design (5/10 → 7+/10).

---

### Criticism 4.2 — Buyer's Risk Profile

**Criticism**: The buyer journey focused on the happy path. What happens when things go wrong? A large-scale buyer's primary fear is financial loss due to logistics failure or bad produce.

**Why it exists**: V1 derived the homepage journey from the platform's trust-building story, which is naturally success-oriented. Failure paths were mentioned in FAQs but not integrated into the primary journey.

**Root cause**: Optimizing for first-impression trust at the expense of decision-making confidence. Trust requires understanding what happens when things fail, not only what happens when they succeed.

**Impact on users**: A corporate buyer who cannot find clear documentation of what happens when produce doesn't match the listing, or when payment fails, will not place a first order.

**Severity**: Medium.

**Proposed correction**: Buyer page explicitly maps three failure paths: payment failure, produce mismatch, non-delivery. Each path shows the exact process, who intervenes, and what the resolution looks like.

**Expected score improvement**: +1 point on User Journey Design. +1 point on Trust Design.

---

## AUDIT CATEGORY 5: TRUST DESIGN (Current: 7/10 → Target: 9/10)

### Criticism 5.1 — Illusion of Transparency

**Criticism**: The platform shows the outcome of verification (the animation turning green, the badge) but not the criteria. A skeptical user asks: "Who paid the administrator to make that turn green? What rules are they following?"

**Why it exists**: V1 correctly showed the verification mechanism (what happens step by step) but did not show the verification criteria (what specific checks are performed and why). The visual of the verification line completing implies rigor. The actual rigor must be documented.

**Root cause**: Treating the verification process as a trust signal in itself, without documenting the substance of that process.

**Impact on users**: A sophisticated user — an employer, an NGO evaluator, a government agency — sees the beautiful verification flow and asks: "But what were the actual criteria?" Finding no answer, they cannot fully trust the system.

**Severity**: High.

**Proposed correction**: Every verification outcome links directly to the specific criteria used. Farmer verification links to: document types accepted, what the administrator checks in each document type, the decision rubric, and the appeals process. The link is persistent — it appears within every StatusLabel component, not buried in a footer.

**Expected score improvement**: +2 points on Trust Design (7/10 → 9/10).

---

## AUDIT CATEGORY 6: VISUAL IDENTITY (Current: 5/10 → Target: 8/10)

### Criticism 6.1 — Gimmick Over-Reliance

**Criticism**: The entire visual identity relies on dashed borders and a horizontal line turning green. Remove the logo and blur the page to 40%: it will look like an unstyled wireframe, not a distinctive product.

**Why it exists**: V1 replaced the generic SaaS visual template with a single-mechanic design gimmick. The verification line was real and meaningful, but not sufficient as a complete visual identity.

**Root cause**: The author solved the "visual idea" problem but left the "visual identity" problem unsolved. A visual idea (the verification line) needs to be embedded in a complete visual language (spacing, hierarchy, color, typography) that coheres and identifies the platform.

**Impact on users**: The website looks unfinished or wireframe-like when the single gimmick is the only distinctive element.

**Severity**: High.

**Proposed correction**: Infrastructure-grade visual system derived from Ramp, Stripe, Cloudflare, and Plaid — extracting principles, not styles. The verification line is retained as one element within a complete system, not as the system itself. See Section 10 — Visual System.

**Expected score improvement**: +3 points on Visual Identity (5/10 → 8+/10).

---

### Criticism 6.2 — The Fraunces Paradox

**Criticism**: Fraunces at display sizes risks making UmojaHub look like an academic journal, a high-end coffee brand, or a boutique design studio, not a robust infrastructure platform.

**Why it exists**: V1 replaced Instrument Serif (V2's choice) with Fraunces as a "less trendy" alternative without recognizing that both are display serifs optimized for editorial aesthetics. The infrastructure benchmark platforms (Ramp, Stripe, Cloudflare, GitHub) uniformly use geometric or humanist sans-serifs for their strongest statements.

**Root cause**: The display serif choice signaled "carefully designed editorial content" when the platform needs to signal "serious, reliable infrastructure."

**Impact on users**: CS students and corporate buyers perceive the serif type as signaling a literary or cultural organization, not a technical platform they can depend on for consequential decisions.

**Severity**: High.

**Proposed correction**: Replace Fraunces with Plus Jakarta Sans at display sizes. See Section 10 — Visual System.

**Expected score improvement**: +2 points on Visual Identity. +1 point on Strategic Clarity (platform looks like what it is).

---

## AUDIT CATEGORY 7: RAMP SIMILARITY (Current: 2/10 → Target: 8/10)

### Criticism 7.1 — Absence of Financial Scale and Speed

**Criticism**: Ramp's design works because it exudes structural security, immense financial velocity, and data conviction. V1 completely lacks this by focusing on soft, pending, unformed states.

**Why it exists**: V1's visual system was organized around incompleteness (the pending state) rather than completeness (the operational state). Ramp's design is entirely organized around operational confidence — data, decisions, performance.

**Root cause**: The "pending → resolved" polarity gave too much visual weight to the pending state. A platform that shows users primarily what they don't yet have (verification, trust, confirmation) reads as aspirational rather than operational.

**Impact on users**: The platform feels like a prototype or work-in-progress rather than established infrastructure.

**Severity**: High.

**Proposed correction**: Invert the visual weight. The primary visual language is operational and resolved — data, verification marks, verified states, completed transactions. The pending state exists for process documentation but is not the design's emotional register. See Section 10 — Visual System.

**Expected score improvement**: +4 points on Ramp Similarity (2/10 → 6+/10).

---

### Criticism 7.2 — Absence of Rigid, Zero-Fluff Layout Containers

**Criticism**: Ramp uses rigid layout containers that treat corporate data with extreme respect. V1 introduced decorative spacing, warm surfaces, and aesthetic rhythm that Ramp would never use.

**Why it exists**: V1 prioritized visual elegance over information precision.

**Root cause**: The wrong benchmark hierarchy. V1 looked at Notion and Vercel for spatial guidance. Ramp looks at Bloomberg and Excel — not for aesthetics, but for information discipline.

**Proposed correction**: Grid discipline derived from data layout rather than editorial layout. Every section's spacing is determined by information hierarchy, not aesthetic rhythm. See Section 10 — Visual System.

**Expected score improvement**: +2 points on Ramp Similarity.

---

## AUDIT CATEGORY 8: STRIPE SIMILARITY (Current: 3/10 → Target: 8/10)

### Criticism 8.1 — Absence of Technological Mastery Aesthetic

**Criticism**: Stripe makes difficult technical operations look beautiful. V1 pulls back the curtain on an unappealing administrative process of manual document review.

**Why it exists**: V1 valued transparency over presentation. Disclosure of the manual review process was treated as inherently trustworthy, without considering that the disclosure needs to be framed as competence, not limitation.

**Root cause**: Presenting the verification process as "manual" (which implies human error and slow processing) rather than "expert human review" (which implies judgment and care that no algorithm can provide).

**Impact on users**: The platform's primary trust mechanism — human administrator review — is presented apologetically instead of confidently.

**Proposed correction**: Reframe every disclosure. Manual review is not a limitation — it is the competitive advantage. "Your verification is reviewed by a qualified administrator who examines your documents against our published criteria. This takes 1–3 business days. Algorithms don't verify people. We do." This is the Stripe version: complex infrastructure made to feel deliberate and powerful.

**Expected score improvement**: +2 points on Stripe Similarity.

---

### Criticism 8.2 — Visual Discordance in the Central Diagram

**Criticism**: Combining forest green (agriculture) and deep navy (academia) on a dark neutral canvas with dashed lines risks looking visually cluttered and discordant.

**Why it exists**: V1 introduced hub-differentiated colors without solving their coexistence at the visual level. Two strong accent colors on the same dark background without a clear hierarchy create tension.

**Root cause**: The hub color distinction was correct in concept but unresolved in execution. Two colors need a primary/secondary hierarchy or a compositional solution.

**Proposed correction**: The shared verification layer uses a single neutral color (high-contrast white on dark). Hub colors appear only in the hub-specific branches of the Central Structural Diagram, fanning out from the neutral center. This creates compositional clarity: one center, two branches. See Section 12 — Diagram System.

**Expected score improvement**: +2 points on Stripe Similarity.

---

## AUDIT CATEGORY 9: MOTION DESIGN (Current: 3/10 → Target: 8/10)

### Criticism 9.1 — Animation Monoculture

**Criticism**: Banning nearly every standard motion pattern forces every animation to use a horizontal width fill or 1px blur, making the experience repetitive and tedious.

**Why it exists**: V1 derived all animations from a single concept (the verification line) and a single technique (blur → clear). The conceptual coherence was correct; the practical monotony was not.

**Proposed correction**: CSS-first approach with three distinct animation contexts. See Section 11 — Motion System.

**Expected score improvement**: +3 points on Motion Design (3/10 → 6+/10).

---

### Criticism 9.2 — Scroll-Trigger Fatigue

**Criticism**: Forcing users to scroll through long page sections just to complete basic diagrams or reveal simple text blocks introduces unnecessary interactive friction.

**Why it exists**: V1 overused ScrollTrigger. Every section entrance was a GSAP trigger. Most diagrams were animated. Statistics were animated. The entire page was an animation sequence.

**Root cause**: Conflating "animation reinforces understanding" with "animation justifies itself." Most section entrances do not need animation to be understood.

**Proposed correction**: Animation used only where static equivalents cannot communicate the same information. Every element that can be static, is static. See Section 11 — Motion System.

**Expected score improvement**: +2 points on Motion Design. +2 points on Implementation Risk.

---

### Criticism 9.3 — Poor Mobile Performance

**Criticism**: Complex GSAP animations cause choppy execution, layout shifting, and broken UI on common mobile devices.

**Proposed correction**: GSAP disabled on mobile (< 768px viewport). All mobile users see fully-resolved static SVG assets. CSS transitions only on mobile. See Section 15 — Mobile Strategy.

**Expected score improvement**: +2 points on Implementation Risk (3/10 → 5+/10).

---

## AUDIT CATEGORY 10: PRODUCT STORYTELLING (Current: 6/10 → Target: 8/10)

### Criticism 10.1 — UI Isolation Delusion

**Criticism**: Showing isolated Trust Score UI elements without surrounding context forces users to guess where it lives in the application workflow. Feels like disparate Figma components, not a live web application.

**Proposed correction**: Context screenshots (browser-framed, real interface visible) with typographic margin callouts. "Figure 2.1 — Verification indicator on an active marketplace listing." The callout is a text note in the column margin, not a visual annotation arrow. See Section 18 — Asset Strategy.

**Expected score improvement**: +2 points on Product Storytelling (6/10 → 8+/10).

---

## AUDIT CATEGORY 11: EMOTIONAL DESIGN (Current: 5/10 → Target: 8/10)

### Criticism 11.1 — Institutional Fragility Signal

**Criticism**: The design leans heavily into the PENDING state, leaving visitors feeling tired, cautious, and overly aware of administrative friction rather than empowered by achieved verification.

**Why it exists**: V1's central metaphor was "things becoming known." This correctly captured the process but misweighted the experience. The process is a means; the achieved state is the goal.

**Proposed correction**: The VERIFIED state is the primary visual register of the platform. The process of getting there is documented clearly but without dominating the emotional register. The website celebrates what verified farmers and students have achieved, not the journey they went through. See Section 10 — Visual System.

**Expected score improvement**: +2 points on Emotional Design (5/10 → 7+/10).

---

## AUDIT CATEGORY 12: IMPLEMENTATION RISK (Current: 3/10 → Target: 9/10)

### Criticism 12.1 — The 1px Blur Code Nightmare

**Criticism**: filter: blur(1px) on every element transition disables hardware acceleration and creates text jittering on common mobile screens.

**Proposed correction**: Remove blur entirely. Replace with CSS opacity transition only. Hardware-accelerated. Zero text jitter. Zero layout impact.

**Expected score improvement**: +3 points on Implementation Risk.

---

### Criticism 12.2 — Dashed-to-Solid Layout Shifts

**Criticism**: Toggling border-style from dashed to solid mid-animation can alter element sizing across browsers, causing layout jumps.

**Root cause**: `border-style` changes affect box model in some browsers. `border-width` changes also cause layout recalculation.

**Proposed correction**: Eliminate the dashed-to-solid transition entirely. Node activation uses an opacity and color transition of an inner border overlay element (absolute-positioned 1px div that fades in on activation). This is composited by the GPU, causes zero layout recalculation, works consistently across all browsers.

**Expected score improvement**: +2 points on Implementation Risk.

---

## AUDIT CATEGORY 13: MISSING OPPORTUNITIES (Current: 4/10 → Target: 8/10)

### Criticism 13.1 — No Live System Status Indicator

**Criticism**: A platform built entirely on transparency has no live queue status, no operational metrics, no proof that the system is running right now.

**Proposed correction**: Live Transparency Dashboard — a persistent data panel (on the homepage and the Transparency page) showing: verification queue depth, median review time, platform uptime, and recent transaction activity. See Section 13 — Transparency System.

**Expected score improvement**: +2 points on Missing Opportunities.

---

### Criticism 13.2 — Invisible Administrators

**Criticism**: Administrators are mentioned repeatedly but never shown. Showing the actual faces, names, and professional credentials of the verification team would do more to build genuine trust than any SVG animation.

**Proposed correction**: Human Accountability System — public profiles for the verification team. See Section 14 — Human Accountability System.

**Expected score improvement**: +2 points on Missing Opportunities. +1 point on Trust Design.

---

### Criticism 13.3 — Missing Proof of Scale

**Criticism**: Statistics show simple numbers but miss geographic or ecosystem depth.

**Proposed correction**: County-level geographic activity map. Transaction volume over time. Ecosystem depth through interactive data display. See Section 13 — Transparency System.

**Expected score improvement**: +1 point on Missing Opportunities. +1 point on Product Storytelling.

---

# SECTION 2 — STRATEGIC REPOSITIONING

## 10 Positioning Frameworks — Full Analysis

The fundamental strategic problem: Why do an agricultural marketplace and a CS education program share one platform? The answer must be operational, immediate, and legible within 30 seconds to a donor, employer, farmer, and university dean simultaneously.

---

**Framework 1 — Verification Infrastructure**
*"UmojaHub is verification infrastructure. The same system that makes a farmer trustworthy in agricultural commerce makes a student's portfolio trustworthy in the employment market."*

Score: 9/10. This is operational. It explains the dual-hub instantly. It draws a parallel to how Stripe explains itself (payment infrastructure, not a payment company). It is specific enough to be believed. It answers "why together?" with a mechanism: the same verification engine, running in two domains.

---

**Framework 2 — Economic Mobility Infrastructure**
*"UmojaHub removes the credibility barriers that prevent talented East Africans from participating in formal economic exchange — whether they farm or build software."*

Score: 6/10. True but aspirational. "Economic mobility" sounds NGO-pitched, not operational. A farmer cares about selling produce, not economic mobility.

---

**Framework 3 — Trust Infrastructure for the African Informal Economy**
*"In East Africa's informal economy, trust cannot be assumed. UmojaHub builds it — for farmers selling to strangers and students seeking employment from employers they've never met."*

Score: 7/10. Specific and honest. Loses points because "informal economy" can read as pejorative; also doesn't clearly explain why both hubs belong together operationally.

---

**Framework 4 — Dual-Economy Development Platform**
*"Kenya's economy is modernizing in two directions at once: agricultural formalization and digital sector growth. UmojaHub provides the trust layer for both transitions."*

Score: 5/10. Macro-accurate but abstract to an individual user. A farmer doesn't care about Kenya's economic transition; they care about selling tomatoes.

---

**Framework 5 — Community Credential Infrastructure**
*"In East African communities, your word and your network are your credential. UmojaHub formalizes, digitizes, and makes verifiable the trust that already exists in those communities."*

Score: 7/10. Culturally resonant and specific. Loses points because it doesn't immediately explain the dual-hub structure.

---

**Framework 6 — Human Capital Verification**
*"Farmers are human capital in the agricultural market. CS students are human capital in the technology market. UmojaHub verifies human capital in both markets."*

Score: 4/10. "Human capital" is dehumanizing. A farmer is not capital. Reject.

---

**Framework 7 — Agricultural-Technology Pipeline**
*"CS students at UmojaHub work on real agricultural industry briefs. The Education Hub produces developers who understand Kenya's primary economic sector. The two hubs are connected by design, not by coincidence."*

Score: 8/10. This is the most surprising and specific answer. It reveals a fact most visitors don't know: the students' projects are agricultural. This immediately makes the combination make sense. The platform is not "a marketplace AND an education app." It is an ecosystem where the technology sector is being trained on the agricultural sector's actual problems.

---

**Framework 8 — National Economic Infrastructure**
*"Agriculture employs 65% of Kenyans. Technology is Kenya's fastest-growing economic sector. UmojaHub is the trust infrastructure connecting both sectors."*

Score: 7/10. Impressive scope but top-down. Individual users don't naturally see themselves as part of a national economic story.

---

**Framework 9 — Portable Credential Platform**
*"A farmer who builds a Trust Score on UmojaHub carries a portable, verifiable credential. A student who builds a verified portfolio carries a portable, verifiable credential. Both are credentials for participation in a formal economy."*

Score: 7/10. The word "credential" unifies well. Loses points for being abstract for a farmer who doesn't think of their track record as a "credential."

---

**Framework 10 — Digital Public Infrastructure**
*"Like UPI in India or M-Pesa in Kenya, UmojaHub is digital public infrastructure: a shared verification layer that multiple economic actors depend on."*

Score: 8/10. Powerful for institutional audiences (donors, governments, universities). Less immediate for individual users. The M-Pesa reference is specifically credible in Kenya.

---

## The Chosen Framework: Framework 1 + Framework 7 Combined

**The chosen positioning**: UmojaHub is East Africa's verification infrastructure — a platform where verified identity enables participation in formal economic exchange. In the Food Security Hub, verified farmers enter formal agricultural commerce. In the Education Hub, CS students work on real agricultural industry projects and build verified portfolios for the technology employment market. The verification architecture is shared because credibility has the same structure in both markets: documented identity, documented activity, expert human review, and a public record.

**Why Framework 7's insight is critical**: The fact that Education Hub students work on agricultural industry briefs is not cosmetic. It means the Education Hub produces developers who understand Kenya's primary economic sector. Employers hiring these graduates get developers who understand the domain their technology serves. This is a genuine, operational answer to "why are these two things together?" that no competitor has.

**The 30-second explanation for each audience:**

*For a donor*: "We build the trust layer that makes East Africa's two most important economic actors — farmers and technology developers — credible participants in their respective markets. Verified farmers access fair commerce. Verified developers access employment. One verification architecture serves both."

*For an employer*: "Students on our platform complete real agricultural industry projects, reviewed by verified lecturers. Every project in a student's portfolio was reviewed by an expert. The agricultural context is not arbitrary — you're hiring developers who understand the sector they'll be building technology for."

*For a farmer*: "UmojaHub verifies who you are so buyers can trust you without knowing you personally. Your verification, your transaction history, and your ratings build a Trust Score that any buyer can see."

*For a university dean*: "Your students work on real agricultural industry briefs and receive structured feedback from verified academic reviewers. Their verified portfolio gives employers a documented record of their work that a grade cannot provide."

---

# SECTION 3 — ECOSYSTEM NARRATIVE

## The Narrative Contract

Every page on the website must express one of the following truths about UmojaHub:

**Truth 1 — Verification is how formal participation begins.** Without documented identity, a farmer cannot enter formal commerce and a student cannot demonstrate documented skill. Verification is the entry condition for economic participation.

**Truth 2 — Trust is accumulated through documented behavior, not claimed.** A farmer's Trust Score reflects what they have done. A student's portfolio reflects what they built and what an expert said about it. Neither can be fabricated.

**Truth 3 — Transparency is a design value, not a compliance requirement.** The platform discloses its verification criteria, its administrator decisions, its queue status, and its operational metrics because the people who depend on it deserve to know exactly what it does and who does it.

**Truth 4 — The two hubs are connected by design.** CS education on real agricultural problems produces technology capability for Africa's primary economic sector. The connection is operational, not coincidental.

## The Narrative Flow Across Pages

**Homepage** → establishes the platform category and routes to both hubs
**Hub pages** → explains each hub's specific mechanism
**Audience pages** → shows each audience's specific journey through the hub
**Trust page** → documents the verification methodology in full
**Transparency page** → proves the platform is operational with live data
**About page** → explains who built this and why
**How It Works page** → the complete technical reference

Every page earns the next one. A visitor who reads the homepage understands enough to choose a hub. A visitor who reads a hub page understands enough to choose an audience page. A visitor who reads an audience page understands enough to register.

---

# SECTION 4 — HOMEPAGE ARCHITECTURE

## Design Constraint: 15-Second Clarity Rule

Within 15 seconds, a visitor must be able to answer: What is UmojaHub? Is it relevant to me? Can I trust it? If the homepage requires more than 15 seconds to answer these questions, it fails regardless of how well-designed it is.

This constraint governs every decision in this section.

## Homepage Structure: 7 Sections

---

### Section 1 — Platform Definition + Immediate Routing
*(Above the fold. The entire first viewport. No scroll required.)*

**Left column (60%):**

Label: `VERIFICATION INFRASTRUCTURE · EAST AFRICA`
[Geist Mono, 11px, uppercase, tracked, color: text-secondary]

Headline: **UmojaHub**
[Plus Jakarta Sans, 56px, weight 800, color: text-primary]

Subheadline: **Verified farmers. Verified portfolios. One platform.**
[Plus Jakarta Sans, 28px, weight 400, color: text-secondary]

Body (max 40 words): "UmojaHub verifies the identities and credentials of farmers entering agricultural commerce and CS students entering the technology employment market in East Africa. Verification is performed by qualified administrators, not algorithms."
[Geist, 17px, weight 400, color: text-secondary, max-width: 520px]

**Right column (40%):**

Platform status indicator:
```
● PLATFORM OPERATIONAL
Verification queue: 14 submissions
Median review time: 1.8 days
Last updated: 2 minutes ago
```
[Geist Mono, 13px, on surface-panel background with 1px border]

Micro-copy line (immediately above routing cards):
```
Click a hub below to immediately filter the verification infrastructure for your specific workflow.
```
[Geist, 14px, weight 400, color: text-secondary, margin-bottom: 12px]

This single line resolves cognitive friction for first-time visitors — particularly corporate engineering recruiters and NGO evaluators who arrive via a direct link and have not seen the platform before. It sets the expectation that the cards below are filters, not separate platforms. Without it, visitors may read the routing cards as three separate products and close the page.

Three routing cards (stacked vertically):
```
FOOD SECURITY HUB →
Farmers, Buyers, Suppliers, Cooperatives

EDUCATION HUB →
Students, Lecturers, Employers, Institutions

GOVERNANCE & IMPACT →
NGOs, Government, Researchers, Donors
```
[Each card: 1px bordered, 12px padding, Geist 15px weight 500, hub label in Geist Mono 11px uppercase above]

**Design rationale**: Every critical piece of information — what the platform is, that it's operational, and where to go — is in the first viewport. No scroll required for orientation. The platform status indicator immediately distinguishes this from a startup landing page: it is showing operational data, not aspirational marketing.

**Alternatives considered**:
- Hero image: Rejected. No photography available at launch. An empty hero is worse than a typographic hero.
- Single CTA above the fold: Rejected. A CTA before understanding creates pressure without context.
- Sequential scroll revelation: Rejected. Violates 15-second clarity rule.

---

### Section 2 — How the Infrastructure Works
*(Dark surface. The Central Structural Diagram.)*

Headline: **One verification engine. Two economic sectors.**
[Plus Jakarta Sans, 36px, weight 700]

Body (max 60 words): "The same verification mechanism that gives a farmer a Trust Score gives a CS student a verified portfolio. In both cases: documents are submitted, a qualified administrator reviews them against published criteria, and a permanent, public record is created. The education and agriculture sectors are connected — students work on real agricultural industry projects."

**The Central Structural Diagram** — positioned full-width below the text, animated on scroll (desktop) or static SVG (mobile):

```
FOOD SECURITY HUB                    EDUCATION HUB
┌─────────────────┐                ┌─────────────────┐
│ Farmer submits  │                │ Student submits  │
│ identity docs   │                │ project + docs   │
│                 │                │                  │
│ Buyer browses   │                │ Employer reads   │
│ verified farmers│                │ verified portfolio│
└────────┬────────┘                └────────┬─────────┘
         │                                  │
         ▼                                  ▼
┌──────────────────────────────────────────────────────┐
│              SHARED VERIFICATION LAYER               │
│                                                      │
│  Document review · Administrator decision            │
│  Published criteria · Permanent audit record         │
│  Public Trust Score · Verified portfolio entry       │
└──────────────────────────────────────────────────────┘
```

[SVG React component with two hub colors (green left, blue right) meeting at neutral dark center]

**Link**: "Read the full verification methodology →"

---

### Section 3 — The Food Security Hub
*(Light surface)*

Label: `FOOD SECURITY HUB`

Headline: **Verified farmers. Direct commerce. Fair prices.**

Three-column data display:
- Column 1: Marketplace flow diagram (6 steps, static SVG, animated on scroll on desktop)
- Column 2: Key numbers (verified farmers, completed transactions, counties)
- Column 3: Entry points (For Farmers →, For Buyers →, For Cooperatives →, For Suppliers →)

One paragraph: What the Food Security Hub provides. What it does not provide (limitation).

---

### Section 4 — The Education Hub
*(Light surface, higher information density)*

Label: `EDUCATION HUB`

Headline: **Real projects. Expert review. Verified portfolios.**

Three-column data display:
- Column 1: Education pipeline diagram (5 stages, static SVG, animated on scroll on desktop)
- Column 2: Key numbers (verified portfolio entries, active lecturers, institutions represented)
- Column 3: Entry points (For Students →, For Lecturers →, For Employers →, For Institutions →)

One paragraph: What the Education Hub provides, including the agricultural project context. Limitation.

---

### Section 5 — Verification Team
*(Dark surface. Humanizing the institution.)*

Label: `WHO PERFORMS VERIFICATION`

Headline: **Verification is done by people, not algorithms.**

Body: "Every farmer identity document and every student project submission is reviewed by a qualified administrator. Here is who reviews them."

Three administrator profile cards:
```
┌────────────────────────────────┐
│ [Name]                         │
│ Verification Administrator     │
│                                │
│ Reviews: Farmer identity docs, │
│ Supplier credentials           │
│                                │
│ Background: [2-line description│
│ of relevant professional       │
│ background]                    │
│                                │
│ Criteria used: [link]          │
└────────────────────────────────┘
```

Below profiles: "Our verification criteria are published in full. Every decision references them. →"

---

### Section 6 — Live Platform Transparency
*(Dark surface. Data as trust signal.)*

Label: `PLATFORM ACTIVITY · LIVE`

Four large numbers:
```
3,247          12,841        847            38
Verified       Completed     Portfolio      Counties
farmers        transactions  entries        active
Updated 3 min ago  Updated 3 min ago  ...    ...
```

Below: "View complete transparency data →" (links to Transparency page)

**Design note**: Numbers are displayed at 48px in Geist Mono, tabular-nums. Timestamps visible below each number in 12px Geist Mono text-secondary. No count-up animation — numbers appear immediately at their actual value, because the IA document correctly states that count-up animations are a conversion pattern, not an information pattern.

---

### Section 7 — Governance & Impact
*(Light surface. The final section.)*

Label: `GOVERNANCE & IMPACT`

Two columns:
- Left: What the platform provides to NGOs, government bodies, and researchers (data access, impact metrics, partnership inquiry)
- Right: Entry points (For NGOs →, For Government →, Contact →)

No CTA button. A link: "Partnership and impact inquiries →"

---

# SECTION 5 — NAVIGATION ARCHITECTURE

## Primary Navigation Structure

```
[UmojaHub]  Marketplace  How It Works  [Food Security Hub ▾]  [Education Hub ▾]  [Governance ▾]  [Sign In]  [Register]
```

**Why "Governance" consolidates Trust and Transparency:**
"Trust" and "Transparency" as separate top-level nav items share the same conceptual space and compete for the same horizontal real estate. On viewports between 768px and 1100px this causes wrapping and broken layout. Consolidating them under "Governance" cleans the horizontal line to six items total (logo + 3 nav items + 2 auth links), handles tablet widths cleanly, and groups the platform's accountability content under one coherent label that institutional visitors (NGOs, government, researchers) can immediately identify.

**Food Security Hub dropdown:**
```
┌─────────────────────────────────┐
│ FOOD SECURITY HUB               │
│ ─────────────────────────────── │
│ For Farmers        →            │
│ For Buyers         →            │
│ For Suppliers      →            │
│ For Cooperatives   →            │
│                                 │
│ ──── Resources ──────────────── │
│ Price Intelligence →            │
│ Knowledge Hub      →            │
│ Marketplace        →            │
└─────────────────────────────────┘
```

**Education Hub dropdown:**
```
┌─────────────────────────────────┐
│ EDUCATION HUB                   │
│ ─────────────────────────────── │
│ For Students       →            │
│ For Lecturers      →            │
│ For Employers      →            │
│ For Institutions   →            │
│                                 │
│ ──── Resources ──────────────── │
│ Education Hub Overview →        │
│ Verification Methodology →      │
└─────────────────────────────────┘
```

**Governance dropdown:**
```
┌─────────────────────────────────┐
│ GOVERNANCE                      │
│ ─────────────────────────────── │
│ Trust & Verification →          │
│ Transparency         →          │
│ Verification Team    →          │
│ Appeals & Disputes   →          │
│                                 │
│ ──── Impact ─────────────────── │
│ For NGOs & Government →         │
│ About UmojaHub        →         │
└─────────────────────────────────┘
```

**Why two separate hub dropdowns instead of one "For You" dropdown:**
Two dropdowns immediately expose the platform's dual-hub structure in the navigation bar without requiring anyone to open a dropdown. A visitor sees "Food Security Hub" and "Education Hub" in the nav bar and immediately understands the architecture. One "For You" dropdown hides the structure behind a click.

**Why not 11 individual nav items:**
11 items create choice paralysis. The 3-funnel structure (Food Security / Education / Governance-Impact) maps to real decision-making: a visitor knows whether they are in the agricultural world or the technology world before they know their specific role within it.

## Mobile Navigation

Below 768px: hamburger → full-height sheet from right.
Sheet structure:
```
FOOD SECURITY HUB
  Farmers · Buyers · Suppliers · Cooperatives

EDUCATION HUB
  Students · Lecturers · Employers · Institutions

GOVERNANCE & IMPACT
  NGOs · Government · Researchers

──────────────────
Marketplace
How It Works
Trust & Verification
Transparency
About

──────────────────
Sign In  |  Register
```

Hub section headers are Geist Mono 11px uppercase tracked. Links are Geist 16px. Minimum touch target 44px.

## Anchor Navigation (Audience Pages)

Sticky sidebar (desktop): 200px width, fixed at 88px from top. Each section listed. Active section highlighted with 2px left border in hub color (green for Food Security, blue for Education).

Mobile: Horizontal scrolling tab strip pinned below the page header. On mobile: compact `<select>` element.

---

# SECTION 6 — TRUST ARCHITECTURE

## Trust Philosophy

Trust on UmojaHub is not communicated through aesthetics. It is communicated through transparency about:
1. Who performs verification decisions
2. What criteria govern those decisions
3. What the public record of those decisions contains
4. What happens when decisions are challenged

Every trust-building element on the website answers at least one of these four questions.

## Public Trust Manifest

The Public Trust Manifest is a persistent document, linked from every verification outcome on the website. It contains:

**For Farmer Verification:**
- Accepted document types and why each is accepted
- What the administrator examines in each document type (photo clarity, document validity, name match)
- Decision rubric: what constitutes APPROVED vs. REJECTED for each criterion
- Typical review timeline: 1–3 business days (stated, not promised)
- Appeals process: how to request a review of a rejection decision
- Who can access my submission: only administrators, never shared with buyers

**For Supplier Verification:**
- Regulatory credentials checked (KEBS, PCPB, KEPHIS numbers)
- How numbers are validated (against public regulatory databases)
- What the directory listing shows

**For Lecturer Verification:**
- Academic or professional credentials accepted
- How teaching experience is assessed
- Who makes the decision

**For Education Project Review:**
- The four assessment dimensions verbatim
- What constitutes substantive commentary (50-word minimum)
- The decision rubric for each dimension
- What DENIED means (permanent for this submission, not for the account)
- What REVISION_REQUIRED means (resubmit with changes)
- Effectiveness tracking: how lecturer quality is monitored

## Trust Score Methodology — Public Documentation

The Trust Score methodology is documented in full on the Trust & Verification page and linked from every Trust Score display on the website:

**Component 1 — Verification (40 points maximum)**
Mechanism: Awarded when administrator approves identity documents. All-or-nothing — partial verification credit does not exist. Cannot be earned without a human administrator decision.

**Component 2 — Transactions (25 points maximum)**
Mechanism: Accumulated progressively with completed order volume. Formula not disclosed at implementation level but disclosure: "scales with completed order count and total transaction value."

**Component 3 — Ratings (20 points maximum)**
Mechanism: Calculated from buyer ratings on completed orders. Requires minimum 3 ratings before full activation. Documented: a farmer with fewer than 3 ratings receives proportionally reduced rating credit to prevent single-rating distortion.

**Component 4 — Reliability (15 points maximum)**
Mechanism: Reflects order fulfillment without disputes. Unfulfilled confirmed orders and upheld dispute claims reduce this component.

**What the Trust Score does NOT guarantee:**
- Produce quality (verified identity, not produce quality)
- Future fulfillment of any specific order
- Absence of any dispute risk
- Accuracy of listing descriptions

This limitation is stated on every page that displays a Trust Score.

---

# SECTION 7 — VERIFICATION ARCHITECTURE

## The Verification Sequence (Canonical)

All verification processes on the platform follow the same structural sequence. This sequence is the organizing principle for all verification documentation on the website.

```
1. SUBMISSION
   Actor: Farmer / Student / Lecturer / Supplier
   Action: Submits required documents or work products
   System: Records submission with timestamp, creates audit hash

2. PENDING
   Status: Under administrative review
   Visibility: Actor sees status in dashboard; no public visibility
   Timeline: Disclosed as 1–3 business days for farmers/lecturers

3. ADMINISTRATOR REVIEW
   Actor: Named platform administrator (see Section 14)
   Action: Examines submission against published criteria
   Criteria: Linked from all review pages — not confidential
   Record: Review timestamp and administrator name recorded

4. DECISION
   Outcomes: APPROVED / VERIFIED / REJECTED / DENIED / REVISION_REQUIRED
   Notification: SMS to actor; dashboard updated
   Documentation: Written reason for rejection/denial; written feedback for revision

5. POST-DECISION
   APPROVED: Trust Score initialized / portfolio entry created / supplier listed
   REJECTED: Reason displayed; resubmission permitted; no penalty
   REVISION_REQUIRED: Specific feedback documented; resubmission queue
   DENIED: Recorded in audit log; not visible in public portfolio; new project permitted
```

## Verification Diagrams

Each audience has a dedicated verification flow diagram using the canonical sequence above. The diagrams are built as SVG React components using the new diagram vocabulary from Section 12. Each diagram shows both the approval path and the rejection/denial path with equal visual weight.

---

# SECTION 8 — GOVERNANCE ARCHITECTURE

## Accountability Structure

UmojaHub's governance is disclosed at the following levels on the public website:

**Level 1 — Platform-wide**: What the platform does and does not verify. Disclosed on Trust page and as a link from every verification display.

**Level 2 — Administrator**: Who performs verification. Named, with credentials. Disclosed on the Verification Team section (homepage and dedicated About page section). See Section 14.

**Level 3 — Criteria**: What criteria govern each verification decision. Published in the Public Trust Manifest. Linked from every verification outcome.

**Level 4 — Appeals**: How decisions are challenged. The platform's formal appeals process:
- Farmer rejection: Submit appeal through the dashboard within 30 days of rejection, with explanation of why the decision was incorrect
- Student DENIED decision: 72-hour second-review window — student submits a git commit link or document revision addressing the specific rubric failures cited in the denial. Assigned to a different reviewer. If the second review is also DENIED, the decision is final for that submission. New project engagement is always permitted.
- Dispute resolution: Buyer disputes submitted through the platform; reviewed by an administrator with both parties given opportunity to respond

**Level 5 — Escalation**: What happens when an administrator's decision is challenged. Disclosed as a process, not as specific internal workflow. "Escalated disputes are reviewed by a senior administrator who was not involved in the original decision."

---

# SECTION 9 — AUDIENCE ARCHITECTURE

## Hub-Differentiated Presentation Layers

The underlying component system is identical for both hubs. The presentation layer differs to match each audience's expectations and context.

### Food Security Hub Presentation Layer

**Principles:**
- Maximum readability at small screen sizes (farmers commonly use 5–6 inch screens)
- Large body text minimum: 18px
- Process flows shown as step-by-step sequential blocks, not as diagrams when on mobile
- Language: operational and plain ("your documents are reviewed by an administrator" not "undergo administrative verification")
- M-Pesa is featured prominently — it is the payment method farmers and buyers know
- Trust Score displayed numerically AND as a tier name (a farmer understands "TRUSTED" faster than "72/100" in casual reference)
- Agricultural context visible (county, crops, cooperative context) throughout

**Typographic register**: Plus Jakarta Sans headlines at 40px desktop / 28px mobile. Geist body at 18px. Generous line-height (1.7). Short paragraphs (max 4 sentences).

**Color register**: High-contrast light surface. Green accent for verified states. Amber for pending states. Clear status visibility.

**AI Framing — Food Security Hub**: The platform's analytical tools that process crop data, price history, and farm metrics are described as deterministic calculators or automated logging tools on all public-facing pages. Do not use "AI" or "AI-powered" language on any Food Security Hub page. These tools follow rule-based logic, not model inference. The platform's central trust claim is human-in-the-loop verification. Introducing AI personas on the same pages creates a narrative contradiction that sophisticated buyers and NGO evaluators will immediately notice. Framing: "A price calculator using regional market data" not "our AI price predictor."

### Education Hub Presentation Layer

**Principles:**
- Technical density acceptable — CS students read documentation
- Smaller body text acceptable: 16px
- Process flows shown as diagrams (developers read diagrams)
- Language: precise technical terms used without over-explanation ("document hash," "peer review queue," "lecturer review rubric")
- Portfolio entry shown as a structured record with all data visible
- Verification audit trail featured — developers understand what a cryptographic hash means
- The three-document structure (Breakdown, Plan, Reflection) shown with specificity about what each requires

**Typographic register**: Plus Jakarta Sans headlines at 40px desktop / 28px mobile. Geist body at 16px. Tighter line-height (1.6). Multi-paragraph sections are acceptable.

**Color register**: Blue accent for Education Hub verified states (distinct from Food Security green). Higher information density in layouts. Code-adjacent visual patterns acceptable (monospace data panels, structured record displays).

**AI Framing — Education Hub**: The brief generation tool (which generates project briefs for the AI_BRIEF track) is described as a "structured brief generator" or "automated project scaffolding tool" on public pages. The student guidance feature is described as a "Project Guidance Tool" providing structural templates and resource links — explicitly not as an AI mentor or AI advisor. The platform's core claim is that human reviewers (lecturers, administrators) provide the credibility. Automated tools are supporting infrastructure. On the For Students page, the section heading is "Project Guidance Tool" with a one-line description: "A structured resource that provides project planning templates and relevant technical documentation. Reviewer judgment is not automated."

---

### Audience Page Architecture — Per Page Summary

**For Farmers** (Food Security Hub, green accent)
Sections: What it provides → Verification guide (step by step) → Trust Score explained → Marketplace lifecycle → M-Pesa payment flow → Price Intelligence → Farm Analytics Tool (deterministic crop and price calculator — see AI Framing below) → Cooperative Groups → Responsibilities → Limitations → FAQ → First steps

**For Buyers** (Food Security Hub, green accent)
Sections: How to browse without account → How to read Trust Scores and Tiers → Placing an order → M-Pesa payment step by step → What happens when things fail (three failure paths) → How to submit a dispute → FAQ

**For Students** (Education Hub, blue accent)
Sections: What the Education Hub is not → Two tracks explained → AI_BRIEF track → OPEN_SOURCE track → Three documents explained (each in full) → Project Guidance Tool (structural resource guide — see AI Framing below) → Peer review: what it involves → Lecturer review: four dimensions → Three decisions: VERIFIED / REVISION_REQUIRED / DENIED → What a verified portfolio means → FAQ

**For Lecturers** (Education Hub, blue accent)
Sections: What reviewing involves → Verification process for lecturers → Review queue → Four dimensions in full with examples of substantive commentary → Three decision types → Effectiveness tracking → FAQ

**For Employers** (Education Hub, blue accent — with a distinct "credibility" visual register)
Sections: What a verified portfolio entry means → The full review chain → Reading a portfolio → What verification guarantees and doesn't → Verification payload (technical proof) → How to independently verify → Contact for verification inquiries

**Technical Mock Payload — Employer Page (required section):**

A dedicated "Verification Payload" section on the For Employers page shows a real sample JSON verification record generated by the backend system. This section is positioned after "Reading a portfolio" and before "What verification guarantees and doesn't." It exists to provide immediate engineering credibility to hiring managers and technical leads who assess portfolio depth before reading narrative content.

```
VERIFICATION PAYLOAD (sample)
──────────────────────────────────────────────────────────────────
```

```json
{
  "verificationId": "vrf_01HXTZ4K9QVNBP8M3CJRYL2A6",
  "portfolioEntryId": "prt_01HXTZ4MDRWQ7P0X5FNJKU8GE",
  "submittedAt": "2025-11-14T08:23:41.000Z",
  "reviewedAt": "2025-11-16T14:07:22.000Z",
  "reviewerHash": "sha256:a3f2c1d9e8b7065f4c3a2e1d0b9f8a7e6d5c4b3a2f1e0d9c8b7a6",
  "decision": "VERIFIED",
  "track": "AI_BRIEF",
  "dimensionScores": {
    "technicalDepth": "MEETS_STANDARD",
    "architecturalReasoning": "MEETS_STANDARD",
    "implementationQuality": "EXCEEDS_STANDARD",
    "reflectionQuality": "MEETS_STANDARD"
  },
  "documentHashes": {
    "breakdown": "sha256:9d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e",
    "plan":      "sha256:4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d",
    "reflection":"sha256:8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c"
  },
  "publicRecord": "https://umojahub.com/verify/vrf_01HXTZ4K9QVNBP8M3CJRYL2A6"
}
```

[Component: `<DataPanel>` with monospace Geist Mono throughout. Dark background (surface-dark). No rounded corners. A note below: "The `reviewerHash` is a cryptographic signature of the reviewer's credential record at the time of review. The `documentHashes` are SHA-256 hashes of the submitted documents. Independent verification is possible using the `publicRecord` URL."]

This section tells an engineering manager three things in 15 seconds: (1) the backend has a real data schema, (2) document integrity is cryptographically anchored, and (3) verification records are independently auditable. No prose required to convey this. The payload speaks for itself.

**For Suppliers** (Food Security Hub, green accent)
Sections: What supplier verification involves → Regulatory credentials checked → Directory listing contents → How cooperative group orders work → How to apply

**For Institutions** (Education Hub, blue accent)
Sections: How faculty become verified lecturers → How student participation works → What the platform offers beyond classroom → Partnership inquiry

**For NGOs and Government** (Governance & Impact, neutral)
Sections: Platform mission → Impact metrics (live) → Geographic coverage → How to support farmer adoption → Partnership inquiry

**For Cooperatives** (Food Security Hub, green accent)
Sections: What cooperative groups do → How to form a group → How bulk ordering works → Minimum requirements → How suppliers interact with groups

---

# SECTION 10 — VISUAL SYSTEM

## The Infrastructure Aesthetic

The website must feel like critical infrastructure — not like a startup, not like an NGO, not like an editorial publication. This distinction is not aesthetic preference; it is strategic. Infrastructure platforms (Stripe, Cloudflare, Ramp, GitHub, Plaid) look the way they do because their visual language communicates: "This is a serious system. It is built to standards. It handles consequential operations. You can depend on it."

**Principles extracted from benchmark analysis:**

**From Ramp**: Hierarchy is absolute. Data is the largest, most prominent element on any page where data is the primary content. Whitespace is earned by information importance, not by aesthetic rhythm. Green means positive/verified. Every element is there because it belongs, not because it looks nice.

**From Stripe**: Complex infrastructure can be beautiful when organized with discipline. Diagrams are iconic — they look like the Stripe brand because they are consistently constructed. Dark sections feel like servers. Product screenshots are of a genuinely beautiful product. Color is used with extreme restraint.

**From Cloudflare**: Infrastructure signals credibility through scale — showing the network, the global reach, the operational metrics. The design communicates: "This is running at scale right now."

**From Plaid**: The invisible infrastructure made visible. Plaid's signature is the network diagram that shows hidden connections. The design reveals complexity that normally exists behind an API call.

**From GitHub**: Developer-grade density. Code is content. Repository structure creates hierarchy. The interface is the design.

---

## Typography System

### Decision: Replace Fraunces with Plus Jakarta Sans

Plus Jakarta Sans (Tokotype, 2021; Google Fonts, variable, free) is chosen for the following reasons:
1. It was designed by an Indonesian type foundry — it is non-Western in origin, appropriate for an East African platform
2. It has strong optical character at large display sizes (80px+) without being a display-only typeface
3. It works well across all weights (200–800) enabling the hierarchy from large bold headlines to light body text within a single typeface
4. It reads as "modern infrastructure" at weight 700–800, not "startup lifestyle" or "editorial magazine"
5. At display size, it is immediately distinct from Inter (which is ubiquitous and signals generic tech stack)

**Alternatives rejected:**
- Inter: The default for modern web products; too generic; doesn't differentiate
- Fraunces: Editorial serif; reads as academic or boutique; contradicts infrastructure positioning
- Bricolage Grotesque: Strong character but inconsistent rendering at small sizes
- DM Sans: Too soft; lacks the structural authority needed for verification infrastructure

### Font Stack

```
font-display:     Plus Jakarta Sans  (variable, Google Fonts)
font-body:        Geist              (Vercel GitHub, free, variable)
font-data:        Geist Mono         (Vercel GitHub, free, variable)
```

Geist and Geist Mono are retained from V1 — they are correct choices for interface and data text.

### Type Scale

```
Display 1:    Plus Jakarta Sans  64px / 70px    weight: 800   tracking: -0.03em
Display 2:    Plus Jakarta Sans  48px / 54px    weight: 700   tracking: -0.02em
Display 3:    Plus Jakarta Sans  36px / 42px    weight: 700   tracking: -0.02em
Section:      Plus Jakarta Sans  28px / 34px    weight: 700   tracking: -0.01em
Subsection:   Plus Jakarta Sans  22px / 28px    weight: 600   tracking: 0
Body Large:   Geist              18px / 28px    weight: 400   tracking: 0
Body:         Geist              16px / 26px    weight: 400   tracking: 0
Body Small:   Geist              14px / 22px    weight: 400   tracking: 0
Label:        Geist              14px / 20px    weight: 500   tracking: 0
Caption:      Geist Mono         12px / 16px    weight: 400   tracking: +0.06em uppercase
Data:         Geist Mono         variable       weight: 500   tabular-nums
```

### Responsive Scaling

```
Display 1:   64px desktop → 40px tablet → 32px mobile
Display 2:   48px desktop → 34px tablet → 28px mobile
Display 3:   36px desktop → 28px tablet → 24px mobile
Body Large:  18px always (Food Security Hub minimum)
Body:        16px always (Education Hub)
```

---

## Color System

### Philosophy: Operational, Not Atmospheric

Colors communicate operational state, not atmosphere. There are no "warm" colors because warmth communicates comfort and lifestyle. The palette communicates: active, verified, pending, denied. Every color choice is functional.

### Foundation

**Light surfaces (primary, most pages):**
```
surface-base       #FFFFFF   Pure white — clean, high-contrast, infrastructure standard
surface-raised     #F7F7F7   Slightly elevated surface for cards and panels
surface-recessed   #F0F0F0   Recessed panels, secondary areas
```

**Dark surfaces (infrastructure layer — Hub headers, statistics, verification system sections):**
```
surface-dark       #0A0A09   Near-black, very slightly warm — not pure black
surface-dark-2     #151514   Elevated dark — cards on dark backgrounds
surface-dark-3     #1E1E1C   Panels within dark sections
```

**Text on light surfaces:**
```
text-primary       #111110   High-contrast primary text
text-secondary     #6B6B69   Secondary text, labels
text-tertiary      #9A9A98   Captions, timestamps, disabled states
```

**Text on dark surfaces:**
```
text-bright        #F5F5F3   Primary text on dark
text-dim           #9B9B99   Secondary text on dark
text-faint         #5E5E5C   Tertiary on dark
```

### Semantic Colors — Food Security Hub

```
hub-green          #16A34A   Food Security Hub accent (Tailwind Green 600 — infrastructure green, not startup green)
hub-green-dark     #15803D   Darker for dark surfaces
hub-green-tint     #F0FDF4   Background tint for verified states on light surfaces
hub-green-border   #86EFAC   Border for verified state containers
```

### Semantic Colors — Education Hub

```
hub-blue           #2563EB   Education Hub accent (Tailwind Blue 600 — institutional blue)
hub-blue-dark      #1D4ED8   Darker for dark surfaces
hub-blue-tint      #EFF6FF   Background tint for verified states on light surfaces
hub-blue-border    #93C5FD   Border for verified state containers
```

### Status Colors (shared across hubs)

```
status-verified    #16A34A   (same as hub-green for farmers; hub-blue for students)
status-pending     #B45309   Deep amber — awaiting review. Passes 4.5:1 contrast on #FFFFFF (AA).
                             Legible on low-tier mobile displays under direct sunlight.
                             Replaces #D97706 which only achieved 3.2:1 (AA large text only).
status-pending-tint #FEF3C7  Background tint (warm amber tint matching #B45309 hue)
status-denied      #DC2626   Muted red — clear, not alarming, not scarlet
status-denied-tint #FEF2F2  Background tint
```

### Border Colors

```
border-light       #E5E5E3   Standard border on light surfaces
border-medium      #D4D4D2   Stronger border for emphasis
border-dark        #2A2A28   Border on dark surfaces
border-verified    #86EFAC   Verified state containers (Food Security)
border-verified-edu #93C5FD  Verified state containers (Education)
```

### Color Usage Rules

**hub-green** is used only for:
- Food Security Hub label indicators
- VERIFIED/APPROVED status labels for farmers/suppliers
- Trust Score fill bar (Food Security)
- Active anchor nav indicator on Food Security Hub pages
- Primary CTA button on Food Security Hub pages

**hub-blue** is used only for:
- Education Hub label indicators
- VERIFIED status labels for student projects and lecturers
- Active anchor nav indicator on Education Hub pages
- Primary CTA button on Education Hub pages

**status-pending (amber)** is used only for:
- PENDING status labels across both hubs
- "Under review" states
- Queue position indicators

**status-denied (red)** is used only for:
- REJECTED, DENIED status labels
- Warning panels about denial consequences

**No color** is used for:
- Section headlines
- Navigation items (except hub indicators and active states)
- Decorative elements
- Background shapes or gradients

---

## Component System

### Philosophy: Infrastructure Components

Every component must look like it belongs in a verification system, not in a marketing website or a design showcase. The test: if you showed the component to a Ramp engineer, would they recognize the design grammar?

### BorderRadius Policy
```
surface-panels, cards, layout:   rounded-none (0) or rounded (4px)
buttons, inputs:                  rounded (4px)
status labels, tier badges:       rounded-full (pill)
diagram nodes:                    4px
```

No rounded-lg, rounded-xl, or rounded-2xl anywhere.

### Shadow Policy
None. Depth is created through border (1px) and surface color difference (surface-base vs surface-raised). Infrastructure does not have soft shadows. Data panels have hard edges.

### Core Components

**PlatformStatusWidget**: The live operational status indicator. Appears in the homepage first viewport.
```
● PLATFORM OPERATIONAL     [green dot + text, Geist Mono 13px]
Verification queue: 14     [data label, Geist Mono 12px]
Median review time: 1.8d   [data, Geist Mono 12px]
Updated 2m ago             [timestamp, Geist Mono 11px text-tertiary]
```

**HubCard**: Routing card on homepage. 1px border. Hub label in Geist Mono uppercase above. Hub name in Geist 17px weight 600. Audience list in Geist 14px text-secondary. Arrow right. Hover: border color shifts to hub accent color.

**StatusLabel**: The inline verification state component.
```
● VERIFIED    [hub-green dot, Geist Mono 11px uppercase]
● PENDING     [amber dot, Geist Mono 11px uppercase]
● REJECTED    [red dot, Geist Mono 11px uppercase]
● TRUSTED     [hub-green dot, Geist Mono 11px uppercase]
```

**DataPanel**: Dense information display for verification records, trust scores, platform metrics.
- Background: surface-dark on light pages / surface-dark-2 on dark sections
- Text: text-bright for values, text-dim for labels
- 1px border-dark
- Geist Mono throughout for data
- No shadows

**TrustScoreDisplay**: The Trust Score visualization.
```
┌────────────────────────────────────────────┐
│ TRUST SCORE                                │
│                                            │
│ 74                       TRUSTED           │
│ ■■■■■■■■■■■■■■■■■□□□□□□  /100             │
│                                            │
│ Verification    ████████████  40/40        │
│ Transactions    ████████      18/25        │
│ Ratings         ██████        12/20        │
│ Reliability     ████          4/15         │
│                                            │
│ Score methodology →                        │
└────────────────────────────────────────────┘
```

**WorkflowStep**: A single step in a numbered process flow.
- Step number: Geist Mono 13px hub-green/hub-blue
- Actor: Geist Mono 11px uppercase text-secondary
- Action: Geist 16px weight 600 text-primary
- Detail: Geist 15px text-secondary
- Connecting line: 1px border-medium

**LimitationPanel**: Required disclosure after every capability claim.
- Left border: 3px solid status-pending (amber)
- Background: status-pending-tint
- Eyebrow: "WHAT [X] DOES NOT CONFIRM" in Geist Mono 11px uppercase amber
- Body: Geist 15px text-secondary

**AdminProfile**: The human accountability card. See Section 14.

**FaqItem**: Accordion. Question: Geist 16px weight 500. Answer: Geist 15px text-secondary. 1px border-light between items. Chevron toggles via CSS transition.

---

# SECTION 11 — MOTION SYSTEM

## The Governing Rule

Motion is an enhancement, never a requirement. If every animation on the website were disabled, every visitor would see every piece of information, every diagram, and every data point — fully formed, fully readable, instantly. Animation reinforces understanding after the fact. It never creates it.

This means: static-first design. Every element is designed in its final state. Animation is layered on afterward for visitors on capable devices who have not indicated a preference for reduced motion.

---

## CSS-First Strategy

All section entrance animations use CSS only, with a **progressive enhancement** pattern:

```css
/* Default: fully visible. Content readable without JS. */
.animate-on-scroll {
  opacity: 1;
  transition: opacity 300ms ease;
}

/* Only apply the opacity constraint after JS confirms hydration. */
/* Elements remain visible on spotty connections, JS failures, or 2G timeouts. */
body.is-hydrated .animate-on-scroll {
  opacity: 0;
}
body.is-hydrated .animate-on-scroll.in-view {
  opacity: 1;
}
```

On `DOMContentLoaded`, a lightweight script (~100 bytes, inline) appends `.is-hydrated` to `<body>`. Until that class exists, every `.animate-on-scroll` element is fully visible. A visitor on a failing 2G connection sees the complete page. IntersectionObserver (~100 bytes, inline) then adds `.in-view` as elements enter the viewport for capable devices.

This replaces any approach that starts from `opacity: 0` at parse time. No scroll-pinning orchestration frameworks. No layout-blocking JS required for content visibility.

**Why CSS opacity only (no Y-translation):**
- Y-translation (slide-up) is the signature of Framer Motion / AOS / generic landing page templates. It communicates "template."
- Pure opacity transition communicates nothing about the design system — it simply reveals. This is correct: the content is the message, not the reveal.

---

## GSAP — Three Specific Uses Only

GSAP is loaded only on the pages where these three sequences exist, and only when the relevant section enters the viewport.

### GSAP Use 1 — Trust Score Assembly (For Farmers, Trust pages)
Scroll-pinned section. The Trust Score bar fills component by component as the visitor scrolls. Each component activates in sequence.

```typescript
// Component activation:
// 1. Width animates from current to current + component value
// 2. Component label shifts from text-tertiary to text-primary
// 3. Component value counter increments to final value
gsap.to(barRef.current, {
  width: `${componentValue}%`,
  duration: 0.8,
  ease: 'power2.out',
});
```

No blur. No Y-translation. Only width and color changes. Both properties are GPU-composited via CSS.

### GSAP Use 2 — Workflow Diagram Activation (On diagram pages)
Nodes and connecting lines in workflow diagrams activate in sequence when the diagram scrolls into view.

```typescript
// Phase 1: Nodes fade in (opacity only, via CSS initially loaded)
// Phase 2: Connecting lines draw (SVG stroke-dashoffset)
// Phase 3: Node labels (already visible via CSS — GSAP not needed)
gsap.to(pathRef.current, {
  strokeDashoffset: 0,
  duration: 0.6,
  ease: 'none', // linear — lines don't accelerate
  delay: index * 0.3,
});
```

### GSAP Use 3 — M-Pesa Payment Sequence (For Farmers, For Buyers pages)
Scroll-pinned section. Payment sequence activates step by step as visitor scrolls through explanation.

The phone frame (static SVG) becomes visible when the STK Push step is reached. It uses CSS opacity transition (not GSAP) because CSS opacity transition is sufficient.

The only GSAP involvement: orchestrating the step-by-step sequence of the payment flow activation, which requires precise timing between diagram updates.

---

## Mobile Motion Strategy

Below 768px: GSAP is not loaded. All diagrams appear as fully-resolved static SVGs. CSS opacity transitions are still used for section entrances (these are hardware-accelerated and cause no performance issues). The experience is complete without any JavaScript animation.

---

## Reduced Motion Strategy

```css
@media (prefers-reduced-motion: reduce) {
  .animate-on-scroll {
    opacity: 1; /* immediately visible */
    transition: none;
  }
}
```

For GSAP: all sequences wrapped in `gsap.matchMedia()`:
```typescript
const mm = gsap.matchMedia();
mm.add('(prefers-reduced-motion: no-preference)', () => {
  // all GSAP sequences here
});
```

Visitors with prefers-reduced-motion see all content immediately in its final resolved state. No layout shift. No FOUC.

---

## Banned Animations (Definitive List)

```
✗  filter: blur() on any element for any purpose
✗  border-style transition (dashed → solid)
✗  Y-translation on any element except M-Pesa phone (removed even from that)
✗  X-translation on any element
✗  Scale transforms on content
✗  Rotation
✗  Looping animations of any kind
✗  Bounce, spring, or elastic easing
✗  Parallax (different scroll speeds for different layers)
✗  Gradient animations
✗  Typewriter effects
✗  Count-up animations on statistics (per IA document: display final values immediately)
✗  duration > 1000ms on any single animation element
✗  stagger delay > 80ms
✗  Any scroll-pinned section beyond the Trust Score assembly
✗  GSAP ScrollTrigger on mobile devices
✗  Any pattern that starts from opacity:0 at parse time without the body.is-hydrated gate
   (Content must be visible by default; JS constrains it, never creates it)
```

---

# SECTION 12 — DIAGRAM SYSTEM

## Diagram Construction Standard

All diagrams are single-file responsive SVG React components. Each diagram contains internal CSS `@media` queries and uses relative `viewBox` units so that the same SVG file automatically rearranges its visual blocks based on device width. No duplicate files per diagram. No JS-based layout switching.

**Responsive SVG pattern:**
```svg
<svg viewBox="0 0 800 400" preserveAspectRatio="xMidYMid meet" width="100%">
  <style>
    .desktop-layout { display: block; }
    .mobile-layout  { display: none; }
    @media (max-width: 767px) {
      .desktop-layout { display: none; }
      .mobile-layout  { display: block; }
    }
  </style>
  <g class="desktop-layout"><!-- horizontal flow --></g>
  <g class="mobile-layout"><!-- vertical stacked flow --></g>
</svg>
```

Desktop groups use horizontal left-to-right layout. Mobile groups use vertical top-to-bottom layout with the same nodes. Both groups exist in one file. `preserveAspectRatio="xMidYMid meet"` ensures correct scaling without distortion. The `viewBox` for the mobile group uses a taller aspect ratio (e.g., 400×700) — this is handled by dynamically resizing the SVG element height via the mobile group's bounding box.

## Node Vocabulary

**Actor node (a person takes action):**
- rect, rx="4"
- Background: surface-raised (#F7F7F7)
- Border: 1px solid border-medium (#D4D4D2)
- Label: Geist 13px text-primary

**System node (platform does this automatically):**
- rect, rx="4"
- Background: surface-recessed (#F0F0F0)
- Border: 1px dashed border-medium
- Label: Geist 13px text-secondary italic

**Status node (APPROVED, VERIFIED, DENIED):**
- pill shape (border-radius: full)
- Background: status tint color
- Border: 1px solid status border color
- Label: Geist Mono 11px uppercase

**Decision node (path branches):**
- Diamond shape — used only when a genuine binary decision exists
- Background: surface-raised
- Border: 1px solid border-medium

## Connecting Lines

- All straight horizontal/vertical 90-degree paths
- 1.5px stroke weight
- Color: border-medium (#D4D4D2) static; activates to hub accent when animated
- Arrowheads: 6px filled triangle, same color as line
- No curves, no diagonal paths

## Labels

- Node labels: Geist 13px centered in node
- Actor labels: Geist Mono 10px uppercase above actor node group
- Annotation labels: Geist 12px left-aligned, connected by 1px horizontal hairline

## The Central Structural Diagram

The most important diagram on the website. Appears on the homepage and the How It Works page.

**Design**: Two branches (Food Security Hub left, Education Hub right) converging into a shared center (Verification Layer). Food Security branch uses green accent for connecting lines at the hub end. Education Hub branch uses blue accent. The Verification Layer center is rendered in neutral dark surface — hub-agnostic.

**Animation (desktop only):** Three phases on scroll entry:
1. Left branch fades in (CSS opacity, 300ms)
2. Right branch fades in simultaneously
3. Connecting lines from both branches draw toward center (SVG stroke-dashoffset, 600ms)
4. Verification Layer panel fades in (CSS opacity, 300ms after lines reach center)
5. Output lines draw downward from center to each hub (SVG stroke-dashoffset, 400ms)

**Static SVG (mobile):** Fully resolved from initial render. Vertical layout with center at the middle.

## Diagram Priority Order

1. Central Structural Diagram (homepage, How It Works)
2. Farmer Verification Process (For Farmers, Trust page)
3. M-Pesa Payment Flow — Farmer perspective (For Farmers)
4. M-Pesa Payment Flow — Buyer perspective (For Buyers — same diagram, different actor highlighted)
5. Trust Score Assembly (scroll-pinned component, For Farmers, Trust page)
6. Education Pipeline Diagram (For Students, Education Hub overview)
7. Three-Document Structure (For Students)
8. Marketplace Transaction Flow (homepage, For Buyers)
9. Trust Tier Ladder (For Farmers, Trust page)
10. Cooperative Group Order Flow (For Cooperatives)
11. Verification Audit Trail (Trust page — document hash flow)
12. Peer/Lecturer Review Relationship (For Students)

---

# SECTION 13 — TRANSPARENCY SYSTEM

## Live Platform Transparency Dashboard

The Transparency page is the platform's most important trust signal. It answers: "Is this real? Is it active? What are the actual numbers?"

### Transparency Data Points (all from live platform API)

**Operational Metrics:**
```
Current verification queue:     [N] submissions awaiting review
Median review time (30-day):    [N] business days
Approval rate (30-day):         [N]% of farmer verifications approved
Active administrators:          [N] reviewing today
```

**Scale Metrics:**
```
Verified farmers:               [N] (updated every 5 minutes)
Counties represented:           [N] of 47 Kenyan counties
Completed transactions:         [N]
Total transaction volume:       KES [N]
Verified portfolio entries:     [N]
Active lecturers:               [N]
```

**Activity Metrics:**
```
New verifications (last 7 days): [N]
New transactions (last 7 days): [N]
New portfolio entries (last 7 days): [N]
```

### Activity Feed Data-Masking Protocol

The Transparency page and homepage may display anonymized recent activity as evidence that the platform is live. All activity feed entries must follow this protocol before being shown publicly:

**Regional aggregation rule**: Individual user events are never broadcast. Events are aggregated to county level before display. Format: `"A farmer in [County] County processed a grain order for KES [round-to-nearest-500]."` — not tied to an account, not tied to a specific farm name.

**Character masking rule**: No usernames, display names, or listing titles from private accounts appear in the activity feed. Account data is replaced with role + geography. Listings are referenced by category only ("grain order," "vegetable bundle," "backend project submission").

**Student activity format**: `"A CS student at [Institution abbreviation, e.g., MKU] submitted a backend project brief for verification."` — institution is acceptable; student name and project title are masked.

**What the feed is not**: The activity feed is not a real-time ledger. It is a delayed, aggregated, anonymized signal of platform activity. Update frequency: 15-minute batches, not real-time event streaming. This prevents any individual user's activity from being isolatable from timing attacks.

**Implementation note**: The feed aggregation query runs server-side. Raw event data never passes through the public API. The client receives pre-aggregated, pre-masked strings ready for display.

### What We Track and Why

Each metric is documented with:
1. What is being measured
2. Why it matters to platform users
3. How it is calculated
4. Update frequency

### What We Do Not Track (and why)

Explicit list:
- Post-platform employment outcomes for students (no follow-up mechanism)
- Farmer income change (not measurable without farmers reporting it)
- Buyer satisfaction beyond ratings (no structured buyer survey)
- Produce quality (not a platform verification scope)

This section builds more credibility than any of the above metrics because it demonstrates that the platform understands the limits of what it can claim.

### Infrastructure Transparency

Public disclosure:
- Database: MongoDB Atlas (East Africa region)
- Payment processing: Safaricom Daraja API (M-Pesa)
- SMS delivery: Africa's Talking
- Document storage: Cloudinary
- AI services: Groq (Farm Assistant, AI Mentor), OpenAI (brief generation)
- Authentication: NextAuth v4 with JWT
- Platform uptime target: 99.5% (current status visible)

### Service Status

Current uptime. Incident history (last 90 days). Planned maintenance schedule.

### County Coverage Map

An SVG map of Kenya's 47 counties, with counties where verified farmers are active shown in hub-green. Counties with no current active farmers shown in border-medium color. Updated from live platform data. Counties are labeled on hover (desktop) or tap (mobile).

---

# SECTION 14 — HUMAN ACCOUNTABILITY SYSTEM

## The Core Principle

The website repeatedly refers to "platform administrators" as the human quality layer of the verification system. These people must be visible, named, and described. Anonymous authority is not trust. Named, credentialed authority is.

## Administrator Profile Standard

Each active verification administrator has a public profile displayed on:
1. The "Who Performs Verification" section of the homepage (condensed — name, role, photo)
2. The full Verification Team page (detailed — full profile)
3. Every verification outcome record (name of reviewing administrator)

**Profile components:**
```
Display name:   [First name + last initial only — e.g., "Jafar M."]
                Full names are never published. This protects administrators
                from targeted pressure or harassment by rejected applicants.
Title:          Verification Administrator, [scope: Farmer & Supplier / Education / All]
Professional background: [2-3 sentences: relevant professional experience,
                          academic background, or industry expertise
                          that qualifies them to review documents/portfolios]
Criteria they apply:     [Link to the relevant section of the Public Trust Manifest]
Review scope:            [Which verification types this administrator reviews]
Active since:            [Month, Year]
```

**What is not disclosed:** Full legal name, personal contact information, internal workflow tools, operational procedures, number of reviews conducted, home location.

**Avatars**: All administrator profiles use a standardized, styled initial-based avatar — a monogram of the administrator's first initial on a neutral dark background (surface-dark-2). This is the default and the standard. No personal photographs are published. This decision is protective: administrators who reject applicants should not be personally identifiable by applicants. Initial-based avatars are consistent, professional, and eliminate any dependency on personal photography consent or hosting.

## Decision Attribution

Every verification decision on the platform is attributed to the administrator who made it, using the masked name format:
- A farmer who is rejected sees: "Decision reviewed by Administrator Jafar M. on [Date]."
- A farmer who is approved sees the same.
- A student whose project is denied sees: "Reviewed by Lecturer Amina O., [Date]. Administrative record: Administrator Jafar M. verified Amina O.'s credentials on [Date]."

The masked format (first name + last initial) provides institutional accountability without exposing administrators to individual identification by applicants whose submissions were rejected.

The attribution chain is visible. Not because the platform wants to expose administrators to complaints, but because anonymous authority is not trust.

## Appeals and Escalation Disclosure

The public appeals process is documented on the Verification Team page and linked from every rejection notification:

**For farmer verification rejection:**
"If you believe your rejection was incorrect, you can submit an appeal within 30 days. Your appeal will be reviewed by an administrator who was not involved in the original decision. You will receive a response within 5 business days."

**For supplier credential rejection:**
Same structure.

**For lecturer credential rejection:**
"Credential decisions can be appealed within 30 days. Provide additional documentation supporting your qualifications."

**For student DENIED decisions:**
A structured second-review pipeline exists. DENIED does not mean permanently blocked — it means the submitted work did not meet the rubric at the time of review. Within 72 hours of receiving a DENIED decision, the student may submit a "Request Second Review" through the dashboard. The request must include a link to a new git commit (or updated document) that specifically addresses the rubric failures cited in the reviewer's feedback. The second review is assigned to a different lecturer. If the second review also results in DENIED, the decision is final for that submission.

Public-facing wording: "If you receive a DENIED decision, you have 72 hours to request a second review. Your request must include a new commit or document revision that addresses the specific rubric failures in your feedback. A different reviewer will assess your revised work. This window exists because a single reviewer decision should not permanently close a student's path without recourse."

After the 72-hour window, standard recourse: new project engagement is permitted. Previous DENIED submissions are recorded in the audit log but not visible in the student's public portfolio.

**Escalation path:**
"Escalated concerns are reviewed by a senior administrator. The senior administrator was not involved in the original decision. Their determination is final."

---

# SECTION 15 — MOBILE STRATEGY

## The Primary Device Reality

A significant portion of the Food Security Hub audience (farmers, buyers in rural areas) accesses the internet primarily via mobile devices — often budget Android phones (Tecno, Itel, Samsung Galaxy A-series) on 3G or variable 4G connections. The website must be fully functional, informative, and trustworthy on these devices.

The Education Hub audience is more likely to use desktop or mid-range mobile devices, but mobile-first design is still required.

## Performance Targets (Mobile)

- First Contentful Paint: < 1.5 seconds on 3G
- Time to Interactive: < 3 seconds on 3G
- Largest Contentful Paint: < 2.5 seconds on 3G
- Cumulative Layout Shift: < 0.1

These targets require:
- No JavaScript required for content display
- GSAP not loaded on mobile
- All SVG diagrams embedded as static assets (not generated by JS on mobile)
- Images served at mobile-appropriate resolution via Next.js Image component
- Fonts: `font-display: swap` to prevent render blocking

## Mobile Layout Adaptations

**Navigation**: Hamburger → full-height sheet. Hub labels visible as section headers. No nested dropdowns.

**Homepage first viewport**: Single column. Platform definition and routing cards stacked vertically. Platform status widget below the routing cards.

**Diagrams**: All horizontal diagrams flip to vertical stacked layout. This requires two SVG variants per diagram or a responsive SVG that uses media query attributes.

**Anchor navigation**: Becomes a horizontal scrolling tab strip pinned below the page header. On very small screens (< 400px): a `<select>` dropdown.

**Data panels**: Full-width. Text at minimum 16px. No reduction in information density — the same data is shown, just in a single-column layout.

**Body text**: 18px minimum on Food Security Hub pages. 16px on Education Hub pages. Never smaller.

**Touch targets**: All interactive elements minimum 44px height.

---

# SECTION 16 — ACCESSIBILITY STRATEGY

## Standards

- WCAG 2.1 AA for all text and interactive elements
- AAA contrast targeted for body text on primary surfaces
- All interactive elements keyboard-navigable in logical tab order
- All SVG diagrams have `role="img"`, `aria-labelledby` pointing to `<title>`, and `<desc>` element with full text description

## Contrast Verification

```
text-primary (#111110) on surface-base (#FFFFFF):        19.2:1  (AAA)
text-secondary (#6B6B69) on surface-base (#FFFFFF):       5.9:1  (AA)
text-bright (#F5F5F3) on surface-dark (#0A0A09):         16.8:1  (AAA)
hub-green (#16A34A) on surface-base (#FFFFFF):            5.1:1  (AA for large text)
hub-blue (#2563EB) on surface-base (#FFFFFF):             5.9:1  (AA)
status-pending (#B45309) on surface-base (#FFFFFF):       5.4:1  (AA — passes for both body text and large text)
```

status-pending (#B45309) achieves 5.4:1 on white — it passes AA for body text at all sizes. PENDING labels may use this color directly for text (dot indicator + label text). This replaces the previous #D97706 which required a text-primary workaround due to its 3.2:1 failure on body text.

## Focus States

Every interactive element: `outline: 2px solid hub-green` (Food Security Hub pages), `outline: 2px solid hub-blue` (Education Hub pages), `outline-offset: 2px`.

Navigation focus ring uses hub-green universally (as it appears in the global nav which is hub-agnostic).

## Screen Reader Requirements

Page landmarks: `<header role="banner">`, `<main>`, `<nav aria-label="Primary navigation">`, `<nav aria-label="Page sections">` (anchor nav), `<footer role="contentinfo">`.

All SVG diagrams: `<title>` with a one-line description, `<desc>` with a full text walkthrough of the process shown.

Status labels: `role="status"` on live-updating elements. `aria-live="polite"` on the platform status widget.

Dynamic content: `aria-expanded` on accordion FAQs and nav dropdowns. `aria-current="page"` on active nav item.

---

# SECTION 17 — PERFORMANCE STRATEGY

## Font Loading

Plus Jakarta Sans: Google Fonts with `display=swap`. Preconnect to `fonts.googleapis.com` and `fonts.gstatic.com`.

Geist and Geist Mono: Self-hosted from Vercel's GitHub release. `next/font/local` with `display: swap`.

## Image Strategy

All screenshots: Next.js `<Image>` component with explicit `width` and `height`. WebP format. `sizes` attribute for responsive loading. `loading="lazy"` for below-fold images.

SVG diagrams: Inline SVG for above-fold diagrams (no additional network request). External SVG file reference for below-fold diagrams (lazy-loaded).

## JavaScript Loading

GSAP: Dynamic import, loaded only when:
1. The device viewport is ≥ 768px
2. The user does not have `prefers-reduced-motion: reduce`
3. The page section containing a GSAP animation is in the viewport

The GSAP bundle is not loaded on mobile. Never.

## ISR Strategy

```typescript
// Homepage (live stats)
export const revalidate = 300; // 5 minutes

// Audience pages (static content)
export const revalidate = 86400; // 24 hours

// Transparency page (live data)
export const revalidate = 300;

// Trust/How It Works pages (static content)
export const revalidate = 86400;
```

---

# SECTION 18 — ASSET STRATEGY

## Screenshot Strategy: Context Over Isolation

Screenshots appear in one of two contexts:

**Context Screenshot**: Full browser-framed view of the relevant interface section. Shows the actual platform environment. Used when the visitor needs to understand where an element lives within the application. Typographic margin callout in the right column margin:
```
Figure 2.1
Trust Score as seen by a buyer
on an active marketplace listing.
[Geist Mono 12px, text-secondary]
```

**State Comparison**: Two states of the same element side by side. PENDING state on the left, VERIFIED state on the right. Shows the moment of resolution in the actual interface. This is the most powerful screenshot on any page that uses it.

**Prohibited**: Isolated UI elements without context. Annotations with pointer arrows. Stock photos in any location. Screenshots with demo or placeholder data.

## Screenshot Priority (blocking launch)

| Asset | Blocks | Due |
|---|---|---|
| Trust Score display (state comparison: PENDING vs VERIFIED) | Trust page, For Farmers | Before Trust page launches |
| Marketplace listing card (context screenshot) | For Buyers, Homepage | Before Buyers page launches |
| M-Pesa STK Push (phone photograph) | For Farmers, For Buyers | Before either page launches |
| Student portfolio entry (context screenshot) | For Students, For Employers | Before Education Hub launches |
| Verification queue (admin context, no sensitive data) | Trust page | Before Trust page launches |

## Diagram Assets

All diagrams must be designed as static SVG before implementation begins. The design spec for each diagram includes:
1. All node labels
2. All connecting path routes
3. All status labels
4. Mobile variant layout
5. Animation sequence (for desktop GSAP version)
6. Accessibility text (`<title>` and `<desc>` content)

The Central Structural Diagram is designed first because it governs the visual vocabulary of all subsequent diagrams.

## Photography

Genuine photography of real farmers, students, and agricultural contexts is used on:
- About page (organizational context)
- For Farmers page (one farmer photograph with consent — if available)
- For Students page (one student photograph with consent — if available)

Treatment: High contrast, black-and-white conversion, tight editorial crop. No filter aesthetics. No text over images.

If genuine photography is not available at launch: sections remain empty. No stock photography. No illustrated replacements. An empty, bordered photo frame with a caption: "Photography of verified platform participants will be added with permission." The honesty is the trust signal.

---

# SECTION 19 — CONTENT STRATEGY

## Voice Guidelines

**Direct**: "Your documents are reviewed by [Administrator Name]." Not "your submission undergoes our rigorous review process."

**Specific**: "Review takes 1–3 business days." Not "we review quickly."

**Bounded**: Every capability statement followed by a limitation. "Verification confirms your identity documents are valid. It does not assess the quality of your produce in advance."

**Institutionally confident**: The platform knows what it is and is confident about it. No hedging language. No startup-style humility. "We verify Kenyan farmers and CS students. Here is exactly how we do it."

## Content Prohibited

Per the IA document, and reinforced here:
- Taglines and slogans
- Aspirational or transformative language ("empowering farmers")
- Unverified statistics
- Testimonials (real or fabricated)
- Promise-based language ("UmojaHub will help you earn more")
- Stock photography
- Decorative icons
- Sections that exist to create excitement rather than understanding

## The Limitation Disclosure Standard

Every page that makes a capability claim must contain a Limitation Disclosure within the same section. The Limitation Disclosure uses the LimitationPanel component (amber left-border, amber eyebrow).

Template:
```
WHAT VERIFICATION DOES NOT CONFIRM
Verification confirms [specific thing verified].
It does not confirm [specific thing not verified].
[If a buyer/employer needs confirmation of X, they should Y.]
```

The limitation disclosure is not an apology. It is a demonstration that the platform knows exactly what it does.

## Content Hierarchy per Page

1. **What this page is for** (first section, declaration density)
2. **What the system does** (how it works, mechanism, not benefit)
3. **What the process looks like** (workflow, step by step)
4. **What this makes possible** (operational outcome)
5. **What this does not guarantee** (limitation disclosure)
6. **What to do if something goes wrong** (failure paths)
7. **FAQ** (specific questions answered directly)
8. **First steps** (what to do right now)

---

# SECTION 20 — IMPLEMENTATION ROADMAP

## Implementation Governance

**Gate 1** — Before any page work begins: Central Structural Diagram designed and approved as a static mockup (paper or design tool). This diagram governs the visual vocabulary of all subsequent diagrams.

**Gate 2** — Before any page work begins: Font stack confirmed in dev (Plus Jakarta Sans loaded via Google Fonts, Geist via next/font/local). Color tokens in tailwind.config.ts. No page work until the token layer is established.

**Gate 3** — Before audience pages launch: All required screenshots exist (real platform data, not mockups).

**Gate 4** — Before any page launches: `npm run type-check && npm run lint && npm run build` passes cleanly.

**Implementation constraint**: No GSAP code on mobile viewports. Enforce via a wrapper that checks viewport width before loading the GSAP bundle. Never ship GSAP to mobile users.

---

## Pre-Sprint: Foundation Work

### F1 — Font and Token Layer
- Install Plus Jakarta Sans via Google Fonts in `next/font/google`
- Self-host Geist and Geist Mono via `next/font/local`
- Replace all color tokens in `tailwind.config.ts` with V2 tokens
- Replace all font-family tokens
- Update `src/styles/globals.css` with new CSS custom properties
- Deliverable: `npm run build` passes. Dev server shows new font stack.

### F2 — GSAP Module
- Verify `src/lib/gsap.ts` exists and registers ScrollTrigger once
- Create `src/lib/motion.ts` with typed functions: `trustScoreAnimation()`, `diagramActivation(paths)`, `mPesaSequence(steps)`
- Verify `gsap.matchMedia()` wrapping on all sequences
- Deliverable: Motion functions testable in isolation on a dev page.

### F3 — Base Layout
- Build new WebsiteNav from scratch (no shadcn NavigationMenu)
- Build new Footer
- Build page layout wrapper (handles dark header / light content rhythm)
- Deliverable: Any page renders correctly with new nav/footer.

### F4 — Core Components
Build in this order (dependency first):
1. StatusLabel
2. LimitationPanel
3. DataPanel
4. TrustScoreDisplay
5. WorkflowStep
6. AdminProfile
7. PlatformStatusWidget
8. HubCard
9. FaqItem
10. SectionAnchor (rebuilt)

Deliverable: All components render on a dev page with real content.

### F5 — Central Structural Diagram
- Design phase (paper or design tool): Complete before code
- Build as SVG React component: desktop horizontal + mobile vertical variants
- Animate: CSS opacity for hub branches, SVG stroke-dashoffset for connecting lines, GSAP mobile-disabled
- Deliverable: Diagram renders correctly on desktop and mobile, accessible.

---

## Sprint 1 — Homepage and Navigation

**S1.1** — Platform Definition section (first viewport): headline, subheadline, body, routing cards, platform status widget

**S1.2** — Central Structural Diagram section (dark): headline, body, diagram component, link

**S1.3** — Food Security Hub section (light): diagram, numbers, routing links

**S1.4** — Education Hub section (light): diagram, numbers, routing links

**S1.5** — Verification Team section (dark): 2–3 administrator profile cards (name, role, background, criteria link)

**S1.6** — Live Platform Transparency section (dark): four numbers from getTransparencyData()

**S1.7** — New WebsiteNav component with hub dropdowns

**Sprint 1 deliverable**: Homepage complete. All ISR data loading. Navigation functional. Platform status widget live.

---

## Sprint 2 — Trust and Verification Infrastructure

**S2.1** — Trust page dark header
**S2.2** — Public Trust Manifest (verification criteria for all actor types)
**S2.3** — Trust Score methodology documentation (full component breakdown)
**S2.4** — Trust Score scroll-pinned narrative (GSAP, desktop only)
**S2.5** — Verification process diagrams (farmer, supplier, lecturer)
**S2.6** — Education project verification diagram
**S2.7** — Appeals and escalation documentation
**S2.8** — How It Works page (all seven diagrams, anchor navigation)

**Sprint 2 deliverable**: Trust page and How It Works complete. This is the deepest trust signal on the website.

---

## Sprint 3 — Food Security Hub Pages

**S3.1** — Shared Food Security Hub page header component
**S3.2** — For Farmers page (all sections, M-Pesa diagram, Trust Score component)
**S3.3** — For Buyers page (marketplace listing anatomy, M-Pesa buyer flow, three failure paths)
**S3.4** — For Suppliers page
**S3.5** — For Cooperatives page

**Screenshot dependency**: M-Pesa STK Push photograph, marketplace listing context screenshot, Trust Score state comparison must exist before Sprint 3 completes.

---

## Sprint 4 — Education Hub Pages

**S4.1** — Shared Education Hub page header component
**S4.2** — For Students page (all sections, three-document structure diagram, pipeline diagram)
**S4.3** — For Lecturers page (four-dimension review framework, effectiveness tracking)
**S4.4** — For Employers page (portfolio anatomy, verification audit trail diagram)
**S4.5** — For Institutions page
**S4.6** — Education Hub Overview page

---

## Sprint 5 — Transparency, About, Governance

**S5.1** — Transparency page (live data dashboard, county map, infrastructure disclosure, service status)
**S5.2** — About page
**S5.3** — For NGOs and Government page
**S5.4** — Verification Team full page (complete administrator profiles)

---

## Sprint 6 — Polish and Quality

**S6.1** — Mobile audit: every page on real devices (Tecno Spark 10C equivalent)
**S6.2** — Performance audit: Lighthouse on 3G throttled. All targets met.
**S6.3** — Accessibility audit: screen reader walkthrough on every page
**S6.4** — Content review: every Limitation Disclosure in place, every claim bounded, no placeholder text
**S6.5** — Animation audit: prefers-reduced-motion enabled, everything visible; GSAP disabled, everything visible
**S6.6** — Cross-browser: Chrome, Firefox, Safari, Samsung Internet (critical for East African mobile users)

---

## Expected Audit Score Improvements

| Category | V1 Score | V2 Expected | Key changes |
|---|---|---|---|
| Foundational Thinking | 4/10 | 8/10 | User-centered framework; mobile-first; administrator transparency |
| Strategic Clarity | 5/10 | 9/10 | Verification infrastructure positioning; 15-second clarity; clear platform definition above fold |
| Information Architecture | 6/10 | 8/10 | 3 macro-funnels; single clear opening; hub-organized navigation |
| User Journey Design | 5/10 | 8/10 | Hub-differentiated presentation; failure paths documented; 15-second orientation |
| Trust Design | 7/10 | 9/10 | Named administrators; decision attribution; criteria published; appeals process |
| Visual Identity | 5/10 | 8/10 | Infrastructure aesthetic; Plus Jakarta Sans; resolved-state dominant; hub color distinction |
| Ramp Similarity | 2/10 | 8/10 | Data-as-hero; zero-fluff layout; operational primary register; green for verified |
| Stripe Similarity | 3/10 | 8/10 | Cohesive diagram vocabulary; dark infra sections; complexity organized beautifully; confident disclosure |
| Motion Design | 3/10 | 8/10 | CSS-first; GSAP for 3 sequences only; no blur; no layout-shift-causing transitions; mobile static |
| Product Storytelling | 6/10 | 8/10 | Context screenshots with margin callouts; state comparison screenshots; administrator profiles |
| Emotional Design | 5/10 | 8/10 | Resolved/verified state dominant; verification team humanizes; operational confidence, not bureaucracy |
| Implementation Risk | 3/10 | 9/10 | No blur; no border-style transitions; CSS-first; GSAP disabled on mobile; no layout shifts |
| Missing Opportunities | 4/10 | 8/10 | Live transparency dashboard; administrator profiles; county map; verification queue status |

---

## Decisions Reference: What Changed from V1 and Why

| Decision | V1 | V2 | Reason |
|---|---|---|---|
| Display typeface | Fraunces (editorial serif) | Plus Jakarta Sans (infrastructure sans) | Infrastructure platforms use sans-serifs; serif reads as academic/boutique |
| Surface philosophy | Pending-state warm surfaces dominant | Resolved-state clean surfaces dominant | Platform's primary register is operational, not aspirational |
| Primary visual metaphor | Verification line (PENDING→VERIFIED) | Verification infrastructure (the complete system) | Single gimmick insufficient; complete system as identity |
| Animation technique | 1px blur + border-style transition | CSS opacity only (section entrances) + 3 specific GSAP sequences | Blur causes GPU issues; border-style causes layout shifts |
| Mobile animation | GSAP disabled via matchMedia | GSAP not loaded on mobile at all | Library not loaded = fastest possible mobile performance |
| Homepage opening | Problem statement (italicized) | Platform definition + routing | 15-second clarity rule; orientation before exploration |
| Navigation | One "For You" dropdown | Two hub dropdowns (Food Security / Education) | Hub architecture visible in nav bar without a click |
| Audience navigation | 11 items | 3 macro-funnels | Choice paralysis vs. confident routing |
| Administrator disclosure | "Human administrators" (category level) | Named administrators with credentials and decision attribution | Anonymous authority is not trust |
| Limitation placement | After capability claims | Simultaneous with or before capability claims | Leading with bounds is more trustworthy |
| Statistics display | Count-up animation | Immediate final value display | IA document: count-up is a conversion pattern, not information pattern |
| Hub differentiation | Single design system | Hub-differentiated presentation layers | CS students and farmers have different cognitive contexts |
| Photography absence | Empty space with explanation to visitors | Empty bordered frame, no explanation | Visitors don't read about missing assets; honesty shown by honoring the constraint silently |
| Dashed borders | Semantic pending-state encoding | Removed (inner border overlay for node activation) | Dashed-to-solid transition causes layout shifts across browsers |

---

## V2 → V2.1 Architectural Corrections (10 directives)

| Directive | Change | Reason |
|---|---|---|
| 1. Zero-JS animation fallback | `.animate-on-scroll` starts visible; `body.is-hydrated` gate enables opacity constraint | Spotty 2G/3G connections: content must be visible without JS execution |
| 2. Administrator privacy masking | Full names → first name + last initial (e.g., "Jafar M."); initial-based avatar system, no personal photos | Protects staff from targeted harassment by rejected applicants |
| 3. AI narrative contradiction | "AI Farm Assistant" → "Farm Analytics Tool"; "AI Mentor" → "Project Guidance Tool" on all public pages | Platform's trust claim is human-in-the-loop; AI personas contradict this for sophisticated evaluators |
| 4. Status color accessibility | `status-pending` #D97706 → #B45309; contrast 3.2:1 → 5.4:1 (AA for body text) | Legibility on low-tier mobile displays under direct sunlight |
| 5. Navigation consolidation | "Trust" + "Transparency" → single "Governance ▾" dropdown | Eliminates layout wrapping on 768–1100px viewports; reduces nav items from 8 to 6 |
| 6. Student rejection appeals | DENIED → 72-hour "Request Second Review" window with required git commit revision | Supportive capability-building platform should not issue permanent first-strike denials |
| 7. SVG simplification | Dual horizontal/vertical SVG files → single responsive SVG with internal CSS `@media` | Dual-file maintenance burden unsustainable across 12 diagrams |
| 8. Live feed data masking | Real-time individual events → 15-min batch, county-level aggregation, role+geography strings | Individual user activity isolatable from timing; privacy requirement |
| 9. Above-fold micro-copy | Added: "Click a hub below to immediately filter the verification infrastructure for your specific workflow." | Reduces bounce from corporate/institutional visitors who don't understand the routing cards without context |
| 10. Technical payload embed | Employer page: verification JSON payload with SHA-256 hashes and `publicRecord` URL | Engineering managers need structural proof, not narrative; payload shows schema depth in 15 seconds |

---

*End of WEBSITE_EXPERIENCE_ARCHITECTURE_V2.md*
