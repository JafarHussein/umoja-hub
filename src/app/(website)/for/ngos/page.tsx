import React from 'react';
import type { Metadata } from 'next';
import { AudiencePage } from '@/components/website/AudiencePage';
import { FaqAccordion, type FaqItem } from '@/components/website/FaqAccordion';
import type { AnchorSection } from '@/components/website/SectionAnchor';

interface MandateRow {
  area: string;
  status: 'addressed' | 'partial' | 'not-addressed';
  explanation: string;
}

interface ImpactMetric {
  metric: string;
  whatItCounts: string;
  distinction: string | null;
}

interface UntrackedItem {
  heading: string;
  detail: string;
}

interface Limitation {
  heading: string;
  detail: string;
}

export const metadata: Metadata = {
  title: 'For NGOs & Government — UmojaHub',
  description:
    'How UmojaHub relates to food security and youth employment mandates, what impact metrics the platform tracks and how they are calculated, what it does not track, and how NGO field staff can support farmer and student adoption.',
};

const sections: AnchorSection[] = [
  { id: 'what-the-platform-addresses', label: 'What the platform addresses' },
  { id: 'food-security-hub', label: 'Food Security Hub relevance' },
  { id: 'education-hub', label: 'Education Hub relevance' },
  { id: 'supporting-farmer-adoption', label: 'Supporting farmer adoption' },
  { id: 'impact-metrics', label: 'Impact metrics' },
  { id: 'what-is-not-tracked', label: 'What is not tracked' },
  { id: 'limitations', label: 'Limitations' },
  { id: 'faq', label: 'FAQ' },
  { id: 'how-to-engage', label: 'How to engage' },
];

const foodSecurityMandates: MandateRow[] = [
  {
    area: 'Market access for smallholder produce',
    status: 'addressed',
    explanation:
      'The platform creates a publicly searchable directory of produce listings from verified farmers, accessible to buyers outside the farmer\'s existing social or geographic network. A farmer who previously sold only to roadside traders can list produce and receive orders from buyers anywhere in Kenya.',
  },
  {
    area: 'Price transparency and information asymmetry',
    status: 'addressed',
    explanation:
      'The Price Intelligence dashboard shows verified weekly market benchmarks for ten major Kenyan crops. Farmers can see the difference between what traders offer and what comparable listings show. Price Alerts notify farmers when crop prices cross defined thresholds. This directly addresses the information advantage that agricultural intermediaries hold over smallholders.',
  },
  {
    area: 'Farmer digital identity in commercial transactions',
    status: 'addressed',
    explanation:
      'Many Kenyan smallholders operate without formal business registration. The platform accepts National ID cards, cooperative membership cards, and passports as the basis for verification, creating a formal platform identity for farmers who have never had one in a commercial context.',
  },
  {
    area: 'Agricultural input access at reduced cost',
    status: 'partial',
    explanation:
      'The cooperative group feature enables groups of verified farmers to place collective bulk orders from verified suppliers at bulk rates. This partially addresses input cost access. Important limitation: payment coordination for group orders is currently manual and outside the platform\'s M-Pesa payment system. See the For Cooperatives page for the full explanation.',
  },
  {
    area: 'Farmer income improvement',
    status: 'partial',
    explanation:
      'The platform enables farmers to sell at prices closer to market rates by eliminating intermediary information advantage. Whether this translates to sustained income improvement for any specific farmer depends on buyer demand for their crop, their Trust Score tier, and factors outside the platform\'s control (logistics, cold chain, capital timing). The platform does not track income outcomes.',
  },
  {
    area: 'Agronomic advisory access',
    status: 'partial',
    explanation:
      'The AI Farm Assistant provides general agronomic guidance on planting schedules, pest management, and market timing. It is not a replacement for a certified agricultural extension officer and does not provide location-specific soil or climate calibrated advice. It is a general-knowledge starting point, not an advisory service.',
  },
  {
    area: 'Post-harvest handling, storage, and cold chain',
    status: 'not-addressed',
    explanation:
      'The platform addresses market connection and pricing transparency. It does not provide or facilitate post-harvest handling infrastructure. A farmer who lists produce and receives an order still bears the full logistics and spoilage risk independently.',
  },
  {
    area: 'Nutritional access and food distribution',
    status: 'not-addressed',
    explanation:
      'The Food Security Hub is a marketplace for direct produce sales. It does not address food distribution to nutritionally vulnerable populations, subsidized access, or last-mile delivery of food to underserved communities. Organizations with mandates in food security as nutritional access will find limited overlap.',
  },
  {
    area: 'Agricultural credit and financing',
    status: 'not-addressed',
    explanation:
      'The platform does not provide or facilitate credit, financing, or insurance for farmers. Capital timing remains the farmer\'s problem — M-Pesa payment arrives after buyer receipt confirmation, not on farm-gate delivery. The platform does not solve the immediate cash need that drives many farmers to sell through brokers who pay on the spot.',
  },
];

const youthMandates: MandateRow[] = [
  {
    area: 'Structured skills development framework',
    status: 'addressed',
    explanation:
      'The Education Hub\'s three-document structure — Problem Breakdown, Approach Plan, and Final Reflection — provides a framework for developing and documenting problem decomposition, planning discipline, and professional self-assessment. These are not skills typically developed explicitly in CS curricula.',
  },
  {
    area: 'Independently verified employability evidence',
    status: 'addressed',
    explanation:
      'Every portfolio entry has been reviewed by a named, credentials-confirmed lecturer against a defined rubric. The credential is institution-independent and portable — a VERIFIED decision from a reviewer at one institution carries the same weight regardless of which institution the student attends. This is the specific gap that other youth skills programs do not close: the self-assertion problem in portfolio evidence.',
  },
  {
    area: 'Agricultural domain knowledge for CS graduates',
    status: 'addressed',
    explanation:
      'The AI_BRIEF track generates project briefs drawn from Kenyan agricultural industry contexts. CS students who complete projects on this track develop domain knowledge relevant to agritech, food systems, and rural development technology — the same domain the Food Security Hub operates in. This is a deliberate design choice, not incidental.',
  },
  {
    area: 'Career placement and employment matching',
    status: 'not-addressed',
    explanation:
      'The Education Hub is a project verification platform, not a job board. It produces a verified credential. It does not connect students to employers, maintain an employer network, or facilitate applications. The verified portfolio is evidence that employers can use — the platform does not facilitate the introduction.',
  },
  {
    area: 'Post-graduation employment outcome tracking',
    status: 'not-addressed',
    explanation:
      'The platform does not track whether students who receive VERIFIED decisions are subsequently hired, the roles they are hired for, or the salaries they achieve. Any program evaluation that wants to assess employment outcomes will need to follow up with students independently. The platform cannot provide this data.',
  },
  {
    area: 'Stipends, bursaries, or financial support for participation',
    status: 'not-addressed',
    explanation:
      'Participation in the Education Hub is free for students. The platform does not provide financial support for participation and does not have mechanisms for external organizations to provide stipends to students through the platform. Organizations that want to financially support student participation must do so outside the platform.',
  },
];

const impactMetrics: ImpactMetric[] = [
  {
    metric: 'Verified farmer count',
    whatItCounts:
      'The number of farmers who currently have APPROVED verification status and an active account on the platform.',
    distinction:
      'This is not the all-time count of farmers who have ever registered, nor does it include farmers currently in PENDING status or those whose verification was rejected. A farmer who registered and was approved but has since had their account suspended is excluded.',
  },
  {
    metric: 'Completed transaction count',
    whatItCounts:
      'The number of marketplace orders that have reached RECEIVED status — meaning the buyer confirmed receipt and payment was released to the farmer.',
    distinction:
      'This excludes orders that were placed and cancelled before payment, orders in PENDING or PAID status that have not completed, and orders where payment was confirmed but fulfilment failed. Completed transactions represent successfully closed commercial exchanges.',
  },
  {
    metric: 'Transaction value',
    whatItCounts:
      'The aggregate M-Pesa payment value of all completed marketplace transactions. Denominated in KES.',
    distinction:
      'This is the amount paid by buyers and received by farmers — it does not reflect what buyers would have paid through alternative channels, and therefore cannot be used to calculate price savings or income uplift attributable to the platform.',
  },
  {
    metric: 'Counties represented',
    whatItCounts:
      'The number of distinct Kenyan counties that have at least one verified active farmer with at least one active marketplace listing.',
    distinction:
      'A county with one verified farmer and one active listing counts. A county with twenty registered but unverified farmers does not count. County representation is a measure of geographic spread, not depth.',
  },
  {
    metric: 'Student portfolio verifications',
    whatItCounts:
      'The number of project entries across all student portfolios that have received a VERIFIED decision from a verified lecturer.',
    distinction:
      'Each verified project counts once. A student with three verified projects contributes three to this count. Submissions in PENDING, REVISION_REQUIRED, or DENIED status are excluded. This count does not correspond to the number of individual students with verified portfolios.',
  },
  {
    metric: 'Verified lecturer count',
    whatItCounts:
      'The number of lecturers who currently have VERIFIED reviewer status and have completed at least one review in the past twelve months.',
    distinction:
      'Lecturers who registered and were verified but have not completed a recent review are not included in the active count. Inactive registrations are not the same as active reviewer capacity.',
  },
];

const untrackedItems: UntrackedItem[] = [
  {
    heading: 'Post-transaction price outcomes',
    detail:
      'The platform records what buyers paid for produce. It does not record what buyers would have paid through their previous supply channel. Calculating the price premium or income uplift attributable to the platform would require a controlled comparison study conducted independently of the platform.',
  },
  {
    heading: 'Farmer income improvement',
    detail:
      'Platform participation enables farmers to list and sell at prices they set. Whether this translates to higher net income depends on factors the platform does not see: logistics costs, transport costs, time investment, alternative sales volumes through other channels, and seasonal fluctuation. The platform cannot generate income impact data.',
  },
  {
    heading: 'Produce quality outcomes',
    detail:
      'The platform records ratings submitted by buyers after order completion. Ratings reflect buyer satisfaction, not objective quality assessments. The platform does not inspect produce, does not track nutritional content, and does not measure post-harvest loss.',
  },
  {
    heading: 'Post-graduation employment outcomes',
    detail:
      'The platform does not track what happens to students after they receive VERIFIED portfolio decisions. Whether they are hired, in what role, at what salary, and whether the verified portfolio influenced the hiring decision are all questions the platform cannot answer. Organizations building youth employment programs around the Education Hub credential will need independent follow-up mechanisms.',
  },
  {
    heading: 'Platform attribution',
    detail:
      'The platform cannot determine what share of a farmer\'s increased income, a buyer\'s reduced procurement cost, or a student\'s hiring outcome is attributable to platform participation versus other interventions. Attribution analysis requires a counterfactual study design that the platform data does not support.',
  },
  {
    heading: 'Farmer retention and dropout',
    detail:
      'The platform does not publicly report the proportion of verified farmers who remain active over time versus those who register and then stop listing. Retention data exists in the platform but is not part of the public impact metrics.',
  },
];

const limitations: Limitation[] = [
  {
    heading: 'Geographic density varies significantly by county',
    detail:
      'The platform may report verified farmers in 30 counties, but the distribution is uneven. A county listed as represented may have one active farmer. Organizations planning programs around platform availability in specific counties should verify actual farmer density before building dependencies on the platform infrastructure.',
  },
  {
    heading: 'Digital access is a prerequisite for farmer participation',
    detail:
      'Farmers need a smartphone capable of taking and uploading photographs, internet access for account management and order monitoring, and an M-Pesa account for payments. Farmers without reliable digital access cannot participate independently. NGO field staff who want to support adoption need to assess digital access as a prerequisite, not an assumption.',
  },
  {
    heading: 'Field staff cannot act on behalf of farmers',
    detail:
      'The platform does not support proxy registration or managed accounts. Field staff cannot create accounts for farmers, submit verification documents, manage listings, or receive payments on behalf of farmers. Every platform action requires the farmer\'s own account.',
  },
  {
    heading: 'Education Hub throughput is bounded by reviewer capacity',
    detail:
      'The review queue for any track depends on the number of active verified lecturers for that track. Organizations that want to support students through the Education Hub should understand that the platform\'s throughput is not unlimited — large cohorts cannot be processed simultaneously if the reviewer pool is thin.',
  },
  {
    heading: 'Platform data access for external organizations requires agreement',
    detail:
      'The platform does not offer a public data API for external impact monitoring. Transaction data relevant to specific farmers or students can be discussed in the context of a formal data governance agreement. There is no self-service data export for NGO or government program evaluation.',
  },
];

const faqItems: FaqItem[] = [
  {
    question:
      'Can our organization register farmers onto the platform on their behalf?',
    answer:
      'No. Each farmer must create their own account, submit their own verification documents, and manage their own listings and orders. The platform does not support proxy accounts or managed profiles for farmers. Field staff can guide farmers through the process, but the farmer must perform each action using their own account.',
  },
  {
    question: 'How do we know which farmers in our program are on the platform?',
    answer:
      'The platform does not share user data with external organizations. You cannot query which of your program farmers are using the platform. To understand adoption within your farmer groups, you would need to ask them directly. Farmers who choose to disclose their platform participation may share their marketplace profile or Trust Score.',
  },
  {
    question: 'Can we access platform data for our impact evaluations?',
    answer:
      'Aggregate public metrics (verified farmer count, transaction volume, counties represented) are publicly available on the platform\'s transparency page. Transaction-level data for specific farmers or cohorts is not publicly accessible. If your evaluation requires specific data sets, contact the platform to discuss what may be available under a formal data governance agreement.',
  },
  {
    question: 'Can government agencies use the price intelligence data for market monitoring?',
    answer:
      'The Price Intelligence data visible on the platform reflects asking prices from active listings on UmojaHub — it does not represent confirmed sale prices or official market benchmarks. It is a useful directional signal but is not suitable as an authoritative source for formal market monitoring or policy reporting without additional validation against official data sources.',
  },
  {
    question: 'Can we formally partner with the platform for a program we are running?',
    answer:
      'The platform does not have a standard partnership program. Partnership arrangements are discussed case by case. Contact the platform with the specific nature of your program and what you need from the platform. Be specific about what data access, integration, or co-branding you are seeking — the platform team can then assess whether and how to engage.',
  },
  {
    question: 'Can our organization sponsor student participation in the Education Hub?',
    answer:
      'Student participation is free. There is nothing to sponsor in terms of platform fees. If you want to provide financial support to students (stipends, hardware, data bundles), that is arranged entirely outside the platform — the platform has no mechanism for processing external payments to students on behalf of a sponsor. If you want to formally promote the Education Hub within your youth program, contact the platform to discuss what that might look like.',
  },
  {
    question: 'Does the platform cover all Kenyan counties?',
    answer:
      'The platform has verified farmers across multiple Kenyan counties, but coverage varies significantly. Not every county has active listings. The platform\'s county coverage reflects where farmers have registered, been verified, and are actively listing — not a deliberate geographic rollout strategy. Coverage expands as more farmers in underrepresented counties discover and join the platform.',
  },
  {
    question: 'Is the platform available in Kiswahili or local languages?',
    answer:
      'The current platform interface is in English. Farmer-facing SMS notifications (order confirmations, verification status updates) are in English. This is a known access barrier for farmers with limited English literacy. If language accessibility is a critical factor for your program, note this as a limitation when assessing platform fit for your specific farmer population.',
  },
  {
    question: 'What is the platform\'s data governance and privacy framework?',
    answer:
      'The platform operates under the Kenya Data Protection Act 2019. Farmer verification documents are stored on Cloudinary and accessible only to administrators. Payment processing is through Safaricom\'s Daraja API — the platform does not store buyer M-Pesa credentials. Student portfolio entries are publicly accessible by design. For a full statement of what data is collected, how it is used, and how to request deletion or access, see the platform\'s Privacy Policy.',
  },
  {
    question:
      'How can field staff introduce the platform to farmer groups they work with?',
    answer:
      'The most effective introduction is the For Farmers page, which covers what the platform does, what verification requires, and what limitations farmers should know before registering. Field staff who have read this page themselves are better positioned to set accurate expectations with farmers — particularly around the verification wait time, the payment model, and the fact that registration does not guarantee immediate orders.',
  },
];

export default function NgosPage(): React.ReactElement {
  return (
    <AudiencePage
      eyebrow="For NGOs & Government"
      heading="Two mandates this platform directly addresses. Several it does not. Here is exactly which ones."
      intro="This page covers how the Food Security Hub and Education Hub relate to agricultural NGO and government mandates in food security, market access, and youth employment. It covers what the platform tracks, how each metric is calculated, and what impact data organizations will need to generate independently."
      sections={sections}
      registerHref="/contact?subject=ngo-partnership"
      registerLabel="Contact us about partnership"
    >
      {/* ── What the platform addresses ── */}
      <section id="what-the-platform-addresses" className="py-12">
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-6">
          What the platform addresses
        </p>
        <h2 className="font-heading text-t2 font-semibold text-text-primary tracking-tight mb-6">
          UmojaHub operates two systems. Neither is a comprehensive food security or youth
          employment program.
        </h2>
        <div className="space-y-5 font-body text-t4 text-text-secondary leading-relaxed max-w-3xl">
          <p>
            The Food Security Hub is a verified agricultural marketplace. It connects verified
            Kenyan farmers with buyers who pay via M-Pesa, and enables cooperative groups to
            place collective input orders from verified suppliers. It addresses specific problems
            within food security and agricultural development mandates — primarily market access,
            price transparency, and farmer digital identity — and does not address others:
            cold chain, post-harvest infrastructure, agricultural credit, or food distribution
            to vulnerable populations.
          </p>
          <p>
            The Education Hub is a project verification platform for Kenyan CS students. It
            produces independently reviewed portfolio entries backed by a cryptographic integrity
            check and a named, credentials-confirmed reviewer. It addresses the evidence gap in
            junior developer hiring — the self-assertion problem that makes CVs and GitHub
            profiles insufficient for employers who cannot verify capability independently. It
            does not address job placement, career counseling, or post-graduation income tracking.
          </p>
          <p>
            The two hubs share a structural connection: the AI_BRIEF track in the Education Hub
            generates project briefs from Kenyan agricultural industry contexts — the same domain
            the Food Security Hub operates in. CS graduates who complete projects on this track
            develop domain knowledge relevant to agritech and rural technology development. This
            connection is deliberate and is the reason these two systems exist on the same platform.
          </p>
        </div>

        <div className="mt-8 space-y-2 max-w-3xl">
          {[
            {
              label: 'Addressed',
              color: 'text-accent-green',
              items: [
                'Market access for smallholder produce',
                'Price transparency and market information asymmetry',
                'Farmer digital identity in commercial transactions',
                'Independently verified CS student portfolio evidence',
              ],
            },
            {
              label: 'Partially addressed',
              color: 'text-amber-400',
              items: [
                'Agricultural input access at reduced cost (group ordering, manual payment)',
                'Farmer income improvement (enabled, not guaranteed, not tracked)',
                'Agronomic advisory (general guidance only, not extension-level advice)',
                'Youth skills development (structured framework, not career placement)',
              ],
            },
            {
              label: 'Not addressed',
              color: 'text-red-400',
              items: [
                'Post-harvest handling, storage, and cold chain',
                'Nutritional access and food distribution',
                'Agricultural credit and financing',
                'Employment matching and job placement',
                'Post-graduation income tracking',
              ],
            },
          ].map((group) => (
            <div key={group.label} className="border border-zinc-800/50 rounded-sm overflow-hidden">
              <div className="bg-surface-elevated px-5 py-2 border-b border-zinc-800/50">
                <span className={`font-mono text-t6 uppercase tracking-widest ${group.color}`}>
                  {group.label}
                </span>
              </div>
              <div className="px-5 py-3 space-y-1">
                {group.items.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <span className="font-mono text-t6 text-text-disabled shrink-0 mt-0.5">—</span>
                    <p className="font-body text-t5 text-text-secondary">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Food Security Hub relevance ── */}
      <section id="food-security-hub" className="py-12">
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-6">
          Food Security Hub relevance
        </p>
        <h2 className="font-heading text-t2 font-semibold text-text-primary tracking-tight mb-2">
          Which agricultural NGO and government mandate areas align with the Food Security Hub
          — and where the alignment is incomplete.
        </h2>
        <p className="font-body text-t4 text-text-secondary mb-8 max-w-2xl">
          Each mandate area below is assessed against what the platform currently delivers.
          Partial alignment means the platform contributes but does not fully address the mandate.
        </p>

        <div className="space-y-3 max-w-3xl">
          {foodSecurityMandates.map((row) => (
            <div key={row.area} className="border border-zinc-800/50 rounded-sm overflow-hidden">
              <div className="bg-surface-elevated px-5 py-3 border-b border-zinc-800/50 flex items-center justify-between gap-4">
                <p className="font-body text-t5 font-semibold text-text-primary">{row.area}</p>
                <span
                  className={`font-mono text-t6 uppercase tracking-widest shrink-0 ${
                    row.status === 'addressed'
                      ? 'text-accent-green'
                      : row.status === 'partial'
                        ? 'text-amber-400'
                        : 'text-text-disabled'
                  }`}
                >
                  {row.status === 'addressed'
                    ? 'Addressed'
                    : row.status === 'partial'
                      ? 'Partial'
                      : 'Not addressed'}
                </span>
              </div>
              <div className="px-5 py-4">
                <p className="font-body text-t5 text-text-secondary leading-relaxed">
                  {row.explanation}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Education Hub relevance ── */}
      <section id="education-hub" className="py-12">
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-6">
          Education Hub relevance
        </p>
        <h2 className="font-heading text-t2 font-semibold text-text-primary tracking-tight mb-2">
          Which youth employment and skills development mandate areas align with the Education
          Hub — and where the evidence chain stops.
        </h2>
        <p className="font-body text-t4 text-text-secondary mb-8 max-w-2xl">
          The Education Hub produces a specific type of evidence: independently reviewed project
          documentation for CS students. Here is what that means for organizations whose mandates
          include youth skills and employability.
        </p>

        <div className="space-y-3 max-w-3xl mb-8">
          {youthMandates.map((row) => (
            <div key={row.area} className="border border-zinc-800/50 rounded-sm overflow-hidden">
              <div className="bg-surface-elevated px-5 py-3 border-b border-zinc-800/50 flex items-center justify-between gap-4">
                <p className="font-body text-t5 font-semibold text-text-primary">{row.area}</p>
                <span
                  className={`font-mono text-t6 uppercase tracking-widest shrink-0 ${
                    row.status === 'addressed'
                      ? 'text-accent-green'
                      : row.status === 'partial'
                        ? 'text-amber-400'
                        : 'text-text-disabled'
                  }`}
                >
                  {row.status === 'addressed'
                    ? 'Addressed'
                    : row.status === 'partial'
                      ? 'Partial'
                      : 'Not addressed'}
                </span>
              </div>
              <div className="px-5 py-4">
                <p className="font-body text-t5 text-text-secondary leading-relaxed">
                  {row.explanation}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="border border-zinc-800/50 rounded-sm p-5 max-w-3xl">
          <p className="font-body text-t5 font-semibold text-text-primary mb-1">
            What the Education Hub produces that other youth skills programs do not
          </p>
          <p className="font-body text-t5 text-text-secondary leading-relaxed">
            Most youth skills programs produce: attendance certificates, completion badges, or
            self-reported portfolio entries. The Education Hub produces a portfolio entry where
            a named, credentials-confirmed reviewer read the student&apos;s three process documents,
            assessed them against a defined rubric, and issued a timestamped decision. That
            decision is permanently public, institution-independent, and cryptographically
            verifiable. An employer cannot verify attendance at a training program. They can
            independently verify a UmojaHub portfolio entry down to confirming that the documents
            they are reading are the same ones the reviewer assessed.
          </p>
        </div>
      </section>

      {/* ── Supporting farmer adoption ── */}
      <section id="supporting-farmer-adoption" className="py-12">
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-6">
          Supporting farmer adoption
        </p>
        <h2 className="font-heading text-t2 font-semibold text-text-primary tracking-tight mb-2">
          What NGO field staff can and cannot do to help farmers participate.
        </h2>
        <p className="font-body text-t4 text-text-secondary mb-8 max-w-2xl">
          The platform requires farmers to act for themselves. Field staff who understand this
          constraint in advance set more accurate expectations with their farmer groups.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-zinc-800/50 mb-8">
          <div className="bg-surface-primary p-6">
            <p className="font-mono text-t6 text-accent-green uppercase tracking-widest mb-4">
              What field staff can do
            </p>
            <div className="space-y-4">
              {[
                {
                  action: 'Share the For Farmers page before farmers register.',
                  detail:
                    'The page covers what verification requires, what the Trust Score means, what limitations exist, and what to expect. Farmers who read it before registering have more accurate expectations.',
                },
                {
                  action: 'Explain the verification requirements in advance.',
                  detail:
                    'Farmers need a clear photograph of a National ID card, cooperative membership card, or passport; a document confirming land use (title deed, lease agreement, or signed tenancy letter); and a photograph of their farm or produce. Farmers who arrive without these documents will face delays.',
                },
                {
                  action: 'Clarify what registration does and does not guarantee.',
                  detail:
                    'Registering and being verified enables listing. It does not guarantee orders. A verified farmer with a NEW tier Trust Score is competing with ESTABLISHED and TRUSTED farmers for the same buyers. First orders may take days or weeks, and depend on demand for that crop in that county.',
                },
                {
                  action: 'Confirm digital access prerequisites.',
                  detail:
                    'A farmer needs a smartphone capable of photographing and uploading documents, mobile internet access, and an M-Pesa account. Farmers who lack reliable internet access or smartphone capability cannot participate independently.',
                },
              ].map((item) => (
                <div key={item.action}>
                  <p className="font-body text-t5 font-semibold text-text-primary mb-1">
                    {item.action}
                  </p>
                  <p className="font-body text-t5 text-text-secondary leading-relaxed">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-surface-primary p-6">
            <p className="font-mono text-t6 text-amber-400 uppercase tracking-widest mb-4">
              What field staff cannot do
            </p>
            <div className="space-y-3">
              {[
                'Register a farmer account on behalf of a farmer — each account must be created by the farmer using their own identity.',
                'Submit verification documents for a farmer — the farmer must upload their own documents through their own account.',
                'Manage a farmer\'s listings or respond to orders on their behalf — every platform action requires the farmer\'s own login.',
                'Receive a farmer\'s M-Pesa payments or intercept order notifications — payment goes to the farmer\'s own M-Pesa account.',
                'Accelerate the administrator verification review — the queue is processed in order; there is no priority lane.',
                'Guarantee that a specific farmer will receive orders after verification — demand depends on crop type, county, buyer activity, and Trust Score tier.',
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <span className="font-mono text-t6 text-text-disabled shrink-0 mt-0.5">—</span>
                  <p className="font-body text-t5 text-text-secondary leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border border-zinc-800/50 rounded-sm p-5 max-w-3xl">
          <p className="font-body text-t5 font-semibold text-text-primary mb-1">
            On setting expectations with farmers
          </p>
          <p className="font-body text-t5 text-text-secondary leading-relaxed">
            The most common failure mode when NGO field staff introduce the platform is
            creating expectations of quick income improvement. A verified farmer with a
            NEW tier Trust Score may wait weeks for a first order. A farmer in a county
            with low buyer demand for their crop may wait longer. Field staff who set
            accurate expectations before farmers register reduce dropout and disappointment.
            The For Farmers page is written specifically to set these expectations — share
            it, and read it yourself first.
          </p>
        </div>
      </section>

      {/* ── Impact metrics ── */}
      <section id="impact-metrics" className="py-12">
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-6">
          Impact metrics
        </p>
        <h2 className="font-heading text-t2 font-semibold text-text-primary tracking-tight mb-2">
          What the platform publicly tracks, how each metric is calculated, and what each
          number includes and excludes.
        </h2>
        <p className="font-body text-t4 text-text-secondary mb-8 max-w-2xl">
          These distinctions matter for organizations using platform data in donor reports,
          program evaluations, or policy briefings. Using the wrong interpretation of a
          metric in a report creates inaccuracies that may be difficult to correct later.
        </p>

        <div className="bg-surface-elevated border border-zinc-800/50 rounded-sm overflow-hidden max-w-3xl">
          {impactMetrics.map((item, i) => (
            <div
              key={i}
              className="px-5 py-5 border-b border-zinc-800/50 last:border-0"
            >
              <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-2">
                {item.metric}
              </p>
              <p className="font-body text-t5 text-text-secondary leading-relaxed mb-2">
                {item.whatItCounts}
              </p>
              {item.distinction !== null && (
                <p className="font-body text-t5 text-text-disabled leading-relaxed pl-3 border-l border-zinc-800/50">
                  <span className="font-mono text-t6 uppercase tracking-widest mr-1">
                    Important:
                  </span>
                  {item.distinction}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── What is not tracked ── */}
      <section id="what-is-not-tracked" className="py-12">
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-6">
          What is not tracked
        </p>
        <h2 className="font-heading text-t2 font-semibold text-text-primary tracking-tight mb-2">
          Impact data the platform does not generate — and what organizations need to produce
          independently.
        </h2>
        <p className="font-body text-t4 text-text-secondary mb-8 max-w-2xl">
          This section must exist. Organizations that build program evaluations assuming the
          platform generates impact data it does not generate will discover the gap when they
          need the data — not now. The platform can provide transaction data for partner farmers
          under a formal data governance agreement, but it does not automatically generate
          impact evaluation evidence.
        </p>

        <div className="space-y-3 max-w-3xl">
          {untrackedItems.map((item) => (
            <div key={item.heading} className="border border-zinc-800/50 rounded-sm p-5">
              <p className="font-body text-t4 font-semibold text-text-primary mb-2">
                {item.heading}
              </p>
              <p className="font-body text-t5 text-text-secondary leading-relaxed">{item.detail}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 border border-zinc-800/50 rounded-sm p-5 max-w-3xl">
          <p className="font-body text-t5 font-semibold text-text-primary mb-1">
            For organizations that need this data
          </p>
          <p className="font-body text-t5 text-text-secondary leading-relaxed">
            Transaction-level data for specific farmers — with appropriate consent and under
            a data governance agreement — can be discussed with the platform. This would
            allow an evaluator to match platform transaction records to a specific cohort of
            farmers in a program, enabling pre-post or comparative analysis if the evaluator
            has independent income or outcome data for those farmers. Contact the platform to
            discuss what data access may be possible.
          </p>
        </div>
      </section>

      {/* ── Limitations ── */}
      <section id="limitations" className="py-12">
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-6">
          Limitations
        </p>
        <h2 className="font-heading text-t2 font-semibold text-text-primary tracking-tight mb-2">
          Platform constraints relevant to organizational programs built around UmojaHub.
        </h2>
        <p className="font-body text-t4 text-text-secondary mb-8 max-w-2xl">
          Organizations that plan programs with the platform as a dependency should know these
          constraints before designing program logic around platform assumptions.
        </p>
        <div className="space-y-3">
          {limitations.map((item) => (
            <div key={item.heading} className="border border-zinc-800/50 rounded-sm p-5">
              <p className="font-body text-t4 font-semibold text-text-primary mb-2">
                {item.heading}
              </p>
              <p className="font-body text-t5 text-text-secondary leading-relaxed">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-12">
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-6">
          FAQ
        </p>
        <h2 className="font-heading text-t2 font-semibold text-text-primary tracking-tight mb-8">
          Questions from NGO program staff and government officers.
        </h2>
        <FaqAccordion items={faqItems} />
      </section>

      {/* ── How to engage ── */}
      <section id="how-to-engage" className="py-12">
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-6">
          How to engage
        </p>
        <h2 className="font-heading text-t2 font-semibold text-text-primary tracking-tight mb-8">
          Practical paths for organizations with different mandates.
        </h2>

        <div className="bg-surface-elevated border border-zinc-800/50 rounded-sm overflow-hidden max-w-2xl mb-6">
          {[
            {
              audience: 'Agricultural NGOs supporting farmers',
              action:
                'Read the For Farmers page yourself first, then share it with the farmers you work with. Assess digital access as a prerequisite before introducing the platform to your farmer groups.',
              link: { label: 'Read the For Farmers page', href: '/for/farmers' },
            },
            {
              audience: 'NGOs running cooperative programs',
              action:
                'Read the For Cooperatives page for the full explanation of how cooperative group ordering works, what payment coordination currently involves, and what the platform does not handle.',
              link: { label: 'Read the For Cooperatives page', href: '/for/cooperatives' },
            },
            {
              audience: 'Youth employment and skills programs',
              action:
                'Read the For Students page to understand the Education Hub before introducing it to students in your program. The page is written for students and sets the expectations that reduce dropout and disappointment.',
              link: { label: 'Read the For Students page', href: '/for/students' },
            },
            {
              audience: 'Government agricultural extension departments',
              action:
                'The Price Intelligence infrastructure and the farmer verification methodology are documented in the Trust & Verification page. For questions about data access relevant to market monitoring mandates, contact the platform directly.',
              link: null,
            },
            {
              audience: 'All organizations seeking formal partnership',
              action:
                'Contact the platform with the specific nature of your program, what you need from the platform, and what you offer in return. Be concrete about data access requirements, integration needs, and co-branding expectations. Generic partnership inquiries are harder to respond to usefully.',
              link: null,
            },
          ].map((item) => (
            <div
              key={item.audience}
              className="px-5 py-5 border-b border-zinc-800/50 last:border-0"
            >
              <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-2">
                {item.audience}
              </p>
              <p className="font-body text-t5 text-text-secondary leading-relaxed mb-2">
                {item.action}
              </p>
              {item.link !== null && (
                <a
                  href={item.link.href}
                  className="font-body text-t5 text-text-disabled hover:text-text-secondary transition-colors duration-150 underline underline-offset-2"
                >
                  {item.link.label} →
                </a>
              )}
            </div>
          ))}
        </div>

        <div className="border border-zinc-800/50 rounded-sm p-5 max-w-2xl">
          <p className="font-body text-t5 text-text-secondary leading-relaxed">
            <span className="font-semibold text-text-primary">On what the platform is not: </span>
            UmojaHub is not a development program. It is a platform. Organizations that are
            looking for a partner to co-design programs, provide field support, or contribute
            to program budgets will not find that here. What the platform offers is
            infrastructure — verification, marketplace, and portfolio systems — that
            organizations can build programming around, with accurate expectations of what
            the infrastructure does and does not do.
          </p>
        </div>
      </section>
    </AudiencePage>
  );
}
