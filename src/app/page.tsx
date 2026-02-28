import React from 'react';
import Link from 'next/link';
import { connectDB } from '@/lib/db';
import PlatformImpactSummary from '@/lib/models/PlatformImpactSummary.model';

// ISR: revalidate every hour
export const revalidate = 3600;

interface IFoodMetrics {
  verifiedFarmerCount: number;
  activeBuyerCount: number;
  completedOrderCount: number;
  totalTransactionVolumeKES: number;
  countiesRepresented: number;
}

interface IEducationMetrics {
  registeredStudentCount: number;
  verifiedProjectCount: number;
  skillsIssuedCount: number;
  universitiesRepresented: number;
}

async function getImpactMetrics(): Promise<{ food: IFoodMetrics; education: IEducationMetrics } | null> {
  try {
    await connectDB();
    const summary = await PlatformImpactSummary.findOne({}).sort({ computedAt: -1 }).lean();
    if (!summary) return null;
    return {
      food: summary.food as IFoodMetrics,
      education: summary.education as IEducationMetrics,
    };
  } catch {
    return null;
  }
}

function formatKES(amount: number): string {
  if (amount >= 1_000_000) return `KES ${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `KES ${(amount / 1_000).toFixed(0)}K`;
  return `KES ${amount.toLocaleString('en-KE')}`;
}

function CheckIcon(): React.ReactElement {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-0.5 shrink-0" aria-hidden="true">
      <path d="M2 8L6 12L14 4" stroke="#007F4E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SmallCheck(): React.ReactElement {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M1.5 6L4.5 9L10.5 3" stroke="#007F4E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface IFeatureCardProps {
  tag: string;
  title: string;
  body: string;
  points: string[];
  cta: string;
  href: string;
  preview: React.ReactNode;
  flip?: boolean;
}

function FeatureSection({ tag, title, body, points, cta, href, preview, flip = false }: IFeatureCardProps): React.ReactElement {
  return (
    <div className={`grid sm:grid-cols-2 gap-10 items-center ${flip ? '' : ''}`}>
      <div className={flip ? 'order-1 sm:order-2' : ''}>
        <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-3">{tag}</p>
        <h3 className="font-heading text-t2 font-semibold text-text-primary mb-4 leading-snug">{title}</h3>
        <p className="font-body text-t4 text-text-secondary mb-6">{body}</p>
        <ul className="space-y-3 mb-8">
          {points.map((p) => (
            <li key={p} className="flex items-start gap-3">
              <CheckIcon />
              <span className="font-body text-t5 text-text-secondary">{p}</span>
            </li>
          ))}
        </ul>
        <Link
          href={href}
          className="inline-flex items-center justify-center min-h-[44px] px-6 rounded-sm bg-accent-green text-text-primary font-body text-t5 font-medium transition-all duration-150 hover:opacity-90"
        >
          {cta}
        </Link>
      </div>
      <div className={flip ? 'order-2 sm:order-1' : ''}>{preview}</div>
    </div>
  );
}

export default async function LandingPage(): Promise<React.ReactElement> {
  const metrics = await getImpactMetrics();

  return (
    <main className="min-h-screen bg-surface-primary">

      {/* ── Navigation ──────────────────────────────────────────────────── */}
      <nav className="flex items-center justify-between px-6 h-14 border-b border-white/5 bg-surface-elevated sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded-sm bg-accent-green shrink-0" />
          <span className="font-heading text-t4 font-semibold">
            <span className="text-text-primary">Umoja</span>
            <span className="text-accent-green">Hub</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/marketplace" className="text-t5 font-body text-text-secondary hover:text-text-primary transition-colors duration-150 hidden sm:block">
            Marketplace
          </Link>
          <Link href="/knowledge" className="text-t5 font-body text-text-secondary hover:text-text-primary transition-colors duration-150 hidden sm:block">
            Knowledge
          </Link>
          <Link href="/auth/login" className="text-t5 font-body text-text-secondary hover:text-text-primary transition-colors duration-150">
            Sign in
          </Link>
          <Link
            href="/auth/register"
            className="inline-flex items-center justify-center min-h-[36px] px-4 rounded-sm bg-accent-green text-text-primary font-body text-t5 font-medium transition-all duration-150 hover:opacity-90"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 bg-surface-elevated border border-white/5 rounded-[2px]">
          <div className="h-1.5 w-1.5 rounded-full bg-accent-green" />
          <span className="font-mono text-t6 text-text-secondary uppercase tracking-widest">Built for Kenya</span>
        </div>
        <h1 className="font-heading text-t1 font-semibold text-text-primary max-w-3xl mx-auto leading-tight">
          For the farmer selling directly to buyers.<br />
          For the student proving they can build.
        </h1>
        <p className="font-body text-t4 text-text-secondary max-w-2xl mx-auto mt-5">
          UmojaHub gives smallholder farmers a verified marketplace with M-Pesa checkout,
          and gives CS students a structured path from zero experience to a portfolio
          that employers trust.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-10">
          <Link
            href="/marketplace"
            className="inline-flex items-center justify-center min-h-[44px] px-6 rounded-sm bg-accent-green text-text-primary font-body text-t5 font-medium transition-all duration-150 hover:opacity-90"
          >
            Browse marketplace
          </Link>
          <Link
            href="/auth/register"
            className="inline-flex items-center justify-center min-h-[44px] px-6 rounded-sm border border-white/10 text-text-secondary font-body text-t5 transition-all duration-150 hover:border-white/20 hover:text-text-primary"
          >
            Create account
          </Link>
        </div>
      </section>

      {/* ── Live impact metrics ──────────────────────────────────────────── */}
      {metrics && (
        <section className="border-t border-white/5 bg-surface-elevated">
          <div className="max-w-5xl mx-auto px-6 py-10">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {[
                { label: 'Verified farmers', value: metrics.food.verifiedFarmerCount.toLocaleString('en-KE') },
                { label: 'Orders completed', value: metrics.food.completedOrderCount.toLocaleString('en-KE') },
                { label: 'Volume traded', value: formatKES(metrics.food.totalTransactionVolumeKES) },
                { label: 'Counties active', value: String(metrics.food.countiesRepresented) },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col items-center gap-1 px-4 py-3 bg-surface-primary border border-white/5 rounded">
                  <span className="font-mono text-t3 font-semibold text-text-primary">{value}</span>
                  <span className="font-body text-t6 text-text-disabled uppercase tracking-widest text-center">{label}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Students enrolled', value: metrics.education.registeredStudentCount.toLocaleString('en-KE') },
                { label: 'Projects verified', value: metrics.education.verifiedProjectCount.toLocaleString('en-KE') },
                { label: 'Skills issued', value: metrics.education.skillsIssuedCount.toLocaleString('en-KE') },
                { label: 'Universities', value: String(metrics.education.universitiesRepresented) },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col items-center gap-1 px-4 py-3 bg-surface-primary border border-white/5 rounded">
                  <span className="font-mono text-t3 font-semibold text-text-primary">{value}</span>
                  <span className="font-body text-t6 text-text-disabled uppercase tracking-widest text-center">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          FOOD SECURITY HUB
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="max-w-5xl mx-auto px-6 pt-24 pb-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-px flex-1 bg-white/5" />
          <p className="font-mono text-t6 text-accent-green uppercase tracking-widest">Food Security Hub</p>
          <div className="h-px flex-1 bg-white/5" />
        </div>
        <p className="font-body text-t4 text-text-secondary text-center max-w-xl mx-auto mt-2">
          For farmers who are tired of being shortchanged. Sell your produce directly,
          know the real price, and protect your inputs from fakes.
        </p>
      </section>

      {/* ── Marketplace ─────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-16 border-b border-white/5">
        <FeatureSection
          tag="Marketplace"
          title="Sell your produce directly to buyers. No middleman. M-Pesa payment."
          body="List your tomatoes, maize, potatoes — whatever you have. Buyers across Kenya search by county and crop. When they order, the money lands in your M-Pesa. No broker, no waiting, no guessing what the buyer actually paid."
          points={[
            'List your produce in under 5 minutes',
            'Buyers pay directly through M-Pesa STK Push',
            'Your trust score is shown to every buyer — 87 · TRUSTED means more sales',
            'Order confirmations sent to you by SMS',
            'Buyers from Nairobi, Mombasa, Kisumu — not just your local area',
          ]}
          cta="See the marketplace"
          href="/marketplace"
          preview={
            <div className="bg-surface-elevated border border-white/5 rounded p-5 space-y-4">
              <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest">Live listing</p>
              <div>
                <p className="font-body text-t4 font-semibold text-text-primary">Grade A Tomatoes — Kirinyaga</p>
                <p className="font-body text-t5 text-text-secondary mt-1">
                  200 KG available · KES 55/KG · Kerugoya Market
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div>
                  <p className="font-body text-t6 text-text-disabled">Farmer</p>
                  <p className="font-body text-t5 text-text-primary font-medium flex items-center gap-1.5">
                    Wanjiku Kamau
                    <SmallCheck />
                  </p>
                </div>
                <div className="ml-auto text-right">
                  <p className="font-body text-t6 text-text-disabled">Trust score</p>
                  <p className="font-mono text-t4 font-semibold text-text-primary">87 <span className="text-t6 text-text-secondary font-normal">· TRUSTED</span></p>
                </div>
              </div>
              <div className="space-y-1.5 pt-2 border-t border-white/5">
                {[
                  { label: 'Verification', score: 40, max: 40 },
                  { label: 'Transactions', score: 22, max: 25 },
                  { label: 'Ratings', score: 17, max: 20 },
                  { label: 'Reliability', score: 8, max: 15 },
                ].map(({ label, score, max }) => (
                  <div key={label} className="flex items-center gap-3">
                    <span className="font-body text-t6 text-text-disabled w-24 shrink-0">{label}</span>
                    <div className="flex-1 h-1 bg-surface-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-accent-green rounded-full" style={{ width: `${(score / max) * 100}%` }} />
                    </div>
                    <span className="font-mono text-t6 text-text-secondary w-10 text-right">{score}/{max}</span>
                  </div>
                ))}
              </div>
              <Link
                href="/marketplace"
                className="block w-full text-center min-h-[40px] leading-[40px] rounded-sm bg-accent-green text-text-primary font-body text-t5 font-medium transition-all duration-150 hover:opacity-90"
              >
                Buy now — M-Pesa
              </Link>
            </div>
          }
        />
      </section>

      {/* ── Knowledge Hub ───────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-16 border-b border-white/5">
        <FeatureSection
          tag="Knowledge Hub"
          title="Spot fake fertilizer before you buy it. Protect your livestock. Know when to sell."
          body="Counterfeit CAN fertilizer, fake veterinary drugs, wrong planting timing — these cost Kenyan farmers millions every season. Our articles are sourced from KALRO, KEBS, and FAO Kenya. Not guesswork. Not WhatsApp forwards. Verified information."
          points={[
            'How to test CAN fertilizer for authenticity before purchase',
            'KALRO planting calendars by county — long rains and short rains',
            'Kenya Veterinary Board guide to spotting fake livestock drugs',
            'FAO post-harvest guide — reduce tomato losses by up to 40%',
            'When to hold your maize and when to sell — 5 years of market data',
          ]}
          cta="Read the articles"
          href="/knowledge"
          flip
          preview={
            <div className="bg-surface-elevated border border-white/5 rounded p-5 space-y-3">
              <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest">From the Knowledge Hub</p>
              {[
                { title: 'How to Identify Genuine CAN Fertilizer Before You Buy', source: 'KEBS', tag: 'Fertilizer' },
                { title: 'Long Rains Planting Calendar 2024: By County', source: 'KALRO', tag: 'Seasonal' },
                { title: 'Reducing Post-Harvest Tomato Losses', source: 'FAO Kenya', tag: 'Post-Harvest' },
              ].map(({ title, source, tag: articleTag }) => (
                <div key={title} className="bg-surface-primary border border-white/5 rounded p-3 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-t6 text-accent-green border border-accent-green/20 rounded-[2px] px-1.5 py-0.5 leading-none">{articleTag}</span>
                    <span className="font-body text-t6 text-text-disabled">{source}</span>
                  </div>
                  <p className="font-body text-t5 text-text-primary leading-snug">{title}</p>
                </div>
              ))}
              <Link href="/knowledge" className="block text-center font-body text-t6 text-accent-green hover:underline pt-1">
                View all articles →
              </Link>
            </div>
          }
        />
      </section>

      {/* ── Farm Assistant ──────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-16 border-b border-white/5">
        <FeatureSection
          tag="Farm Assistant"
          title="Ask any farming question. Get an answer in seconds. In your language."
          body="Your Farm Assistant knows your county, your crops, and this week's weather. Ask about disease on your tomatoes. Ask when to plant beans in Nakuru. Ask what's fair price today. It answers based on your situation — not a generic answer."
          points={[
            'Knows your county, crops, and 7-day weather forecast',
            'Crop disease identification and treatment guidance',
            'Input verification — is this fertilizer genuine?',
            'Harvest timing and post-harvest handling advice',
            'Powered by Llama 3 — fast responses even on slow connections',
          ]}
          cta="Try the Farm Assistant"
          href="/auth/register"
          preview={
            <div className="bg-surface-elevated border border-white/5 rounded p-5 space-y-3">
              <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest">Farm Assistant</p>
              <div className="space-y-3">
                <div className="bg-surface-secondary rounded p-3">
                  <p className="font-body text-t6 text-text-disabled mb-1">You asked</p>
                  <p className="font-body text-t5 text-text-primary">
                    My tomato leaves are turning yellow from the bottom. What is happening and what should I do?
                  </p>
                </div>
                <div className="bg-surface-primary border border-accent-green/20 rounded p-3">
                  <p className="font-body text-t6 text-accent-green mb-1">Farm Assistant</p>
                  <p className="font-body text-t5 text-text-secondary leading-relaxed">
                    This looks like early blight or a nitrogen deficiency — both common in Kirinyaga during heavy rains.
                    Check the underside of leaves for brown spots with yellow rings. If present, apply copper-based
                    fungicide approved by PCPB. Remove affected leaves now to slow spread.
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                  <div className="h-1.5 w-1.5 rounded-full bg-accent-green" />
                  <p className="font-body text-t6 text-text-disabled">Kirinyaga · Tomatoes · Sunny, 24°C this week</p>
                </div>
              </div>
            </div>
          }
        />
      </section>

      {/* ── Price Intelligence ──────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-16 border-b border-white/5">
        <FeatureSection
          tag="Price Intelligence"
          title="Know today's market price before you sell. Set an alert for when your price is reached."
          body="You should not have to guess what tomatoes are going for in Nairobi today. UmojaHub shows you live benchmarks from Wakulima Market, Kongowea, and City Market — and tells you exactly what premium direct selling earns you compared to going through a broker."
          points={[
            'Live price benchmarks for Nairobi, Mombasa, and Kisumu markets',
            'Platform premium: how much extra you earn selling directly vs broker price',
            'Price history charts — see the trend before you decide to sell or wait',
            'Set a price alert — get an SMS when maize hits your target price in Nairobi',
            'Compare your listing price to current market average',
          ]}
          cta="See price trends"
          href="/auth/register"
          flip
          preview={
            <div className="bg-surface-elevated border border-white/5 rounded p-5 space-y-4">
              <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest">Price intelligence</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { crop: 'Tomatoes', platform: 'KES 62', broker: 'KES 48', premium: '+29%' },
                  { crop: 'Maize', platform: 'KES 4,100', broker: 'KES 3,400', premium: '+21%' },
                  { crop: 'Potatoes', platform: 'KES 3,100', broker: 'KES 2,500', premium: '+24%' },
                  { crop: 'Kale', platform: 'KES 22', broker: 'KES 15', premium: '+47%' },
                ].map(({ crop, platform, broker, premium }) => (
                  <div key={crop} className="bg-surface-primary border border-white/5 rounded p-3">
                    <p className="font-body text-t5 font-semibold text-text-primary">{crop}</p>
                    <p className="font-mono text-t5 text-text-primary mt-1">{platform}</p>
                    <p className="font-body text-t6 text-text-disabled">vs {broker} broker</p>
                    <p className="font-mono text-t6 text-accent-green mt-1">{premium} platform premium</p>
                  </div>
                ))}
              </div>
              <p className="font-body text-t6 text-text-disabled border-t border-white/5 pt-3">
                Wakulima Market · Nairobi benchmark · Updated weekly
              </p>
            </div>
          }
        />
      </section>

      {/* ── Verified Suppliers + Group Buying ───────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <FeatureSection
          tag="Verified Suppliers & Group Buying"
          title="Buy your seeds and fertilizer from suppliers who have been checked. Buy together, pay less."
          body="Before you buy CAN fertilizer or certified seed, check if the supplier is on the UmojaHub verified list. KEBS number, PCPB registration, KEPHIS certification — we verify it before they appear. And when you buy together with other farmers in your group, you access supplier prices instead of retail prices."
          points={[
            'Every supplier verified against KEBS, PCPB, and KEPHIS registers',
            'Contact details and input categories clearly listed',
            'Form a farmer group and coordinate input purchases together',
            'Each member pays their share through M-Pesa individually',
            'Amiran Kenya, MEA Fertilizers, Kenya Seed Company already listed',
          ]}
          cta="View verified suppliers"
          href="/auth/register"
          preview={
            <div className="bg-surface-elevated border border-white/5 rounded p-5 space-y-3">
              <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest">Verified suppliers</p>
              {[
                { name: 'Amiran Kenya Limited', inputs: 'Fertilizer · Seed · Pesticide', kebs: 'KEBS/F/2019/001234' },
                { name: 'MEA Fertilizers Limited', inputs: 'Fertilizer', kebs: 'KEBS/F/2018/000891' },
                { name: 'Kenya Seed Company', inputs: 'Certified Seed', kebs: 'KSC/2020/CERT/001' },
              ].map(({ name, inputs, kebs }) => (
                <div key={name} className="bg-surface-primary border border-white/5 rounded p-3 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <p className="font-body text-t5 font-semibold text-text-primary">{name}</p>
                      <SmallCheck />
                    </div>
                    <p className="font-body text-t6 text-text-disabled">{inputs}</p>
                    <p className="font-mono text-t6 text-text-disabled mt-0.5">{kebs}</p>
                  </div>
                </div>
              ))}
            </div>
          }
        />
      </section>


      {/* ═══════════════════════════════════════════════════════════════════
          EDUCATION HUB
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="border-t border-white/5 bg-surface-elevated">
        <div className="max-w-5xl mx-auto px-6 pt-24 pb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-px flex-1 bg-white/5" />
            <p className="font-mono text-t6 text-accent-green uppercase tracking-widest">Education Hub</p>
            <div className="h-px flex-1 bg-white/5" />
          </div>
          <p className="font-body text-t4 text-text-secondary text-center max-w-xl mx-auto mt-2">
            For CS students who want to graduate with a portfolio that actually proves something.
            For lecturers who want student work to reflect real professional standards.
          </p>
        </div>
      </section>

      {/* ── AI Brief Generator ──────────────────────────────────────────── */}
      <section className="border-t border-white/5 bg-surface-elevated">
        <div className="max-w-5xl mx-auto px-6 py-16 border-b border-white/5">
          <FeatureSection
            tag="AI Brief Generator"
            title="Your project brief comes from a real Kenyan industry problem. Not a tutorial. Not a toy app."
            body="When you start a project on UmojaHub, you get a brief that reads like one from a real client — a farmer cooperative, a county health department, an M-Pesa fintech. The constraints are real: 2G networks, KES currency, low digital literacy. Building against real constraints is what makes your portfolio different from everyone else's."
            points={[
              '8 Kenyan industry contexts — agriculture, health, fintech, logistics, and more',
              'Every brief includes a real client persona, problem statement, and technical scope',
              'Constraints match the Kenyan market: M-Pesa, USSD, offline-first, KES',
              'Brief generated fresh for each student — not the same project twice',
              'Admin-updated context library keeps briefs current with market needs',
            ]}
            cta="Start your first project"
            href="/auth/register"
            preview={
              <div className="bg-surface-primary border border-white/5 rounded p-5 space-y-4">
                <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest">Sample brief</p>
                <div>
                  <p className="font-body text-t6 text-accent-green mb-1 uppercase tracking-widest font-mono">Client persona</p>
                  <p className="font-body text-t5 text-text-primary">A farmer cooperative in Nyandarua with 240 members needs a digital produce listing and order system.</p>
                </div>
                <div>
                  <p className="font-body text-t6 text-accent-green mb-1 uppercase tracking-widest font-mono">Problem</p>
                  <p className="font-body text-t5 text-text-secondary">Members lose 30–35% of income to middlemen due to no direct access to Nairobi buyers.</p>
                </div>
                <div>
                  <p className="font-body text-t6 text-accent-green mb-1 uppercase tracking-widest font-mono">Constraints</p>
                  <ul className="space-y-1">
                    {['Must work on 2G/3G networks', 'KES only — M-Pesa payment rail', 'Some members have basic phones only'].map(c => (
                      <li key={c} className="flex items-start gap-2">
                        <span className="text-text-disabled text-t5 mt-0.5">—</span>
                        <span className="font-body text-t5 text-text-secondary">{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="pt-2 border-t border-white/5 flex items-center gap-2">
                  <SmallCheck />
                  <span className="font-body text-t6 text-text-disabled">Agricultural Supply Chain · INTERMEDIATE tier</span>
                </div>
              </div>
            }
          />
        </div>
      </section>

      {/* ── AI Mentor ───────────────────────────────────────────────────── */}
      <section className="bg-surface-elevated">
        <div className="max-w-5xl mx-auto px-6 py-16 border-b border-white/5">
          <FeatureSection
            tag="AI Mentor"
            title="An AI that asks you questions instead of giving you the answer."
            body="Every student gets access to an AI Mentor that knows your brief, your constraints, and the process documents you have submitted. It will push back on vague answers. It will ask what you have tried. It will never write your code — because your portfolio only means something if the work is yours."
            points={[
              'Knows your current brief, tech stack, and progress',
              'Socratic approach — guides through questions, not answers',
              'Never writes code or architecture for you',
              'Every conversation is logged to your AI Usage document',
              'Ask about your database schema, API design, error handling — anything',
            ]}
            cta="See how the Mentor works"
            href="/auth/register"
            flip
            preview={
              <div className="bg-surface-primary border border-white/5 rounded p-5 space-y-3">
                <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest">AI Mentor session</p>
                <div className="space-y-3">
                  <div className="bg-surface-secondary rounded p-3">
                    <p className="font-body text-t6 text-text-disabled mb-1">You</p>
                    <p className="font-body text-t5 text-text-primary">I want to store all the farmer data in one big collection. Is that okay?</p>
                  </div>
                  <div className="bg-surface-elevated border border-accent-green/20 rounded p-3">
                    <p className="font-body text-t6 text-accent-green mb-1">Mentor</p>
                    <p className="font-body text-t5 text-text-secondary leading-relaxed">
                      That depends on what you mean by &quot;one big collection.&quot; What kinds of queries do you expect to run most often — and how do you think MongoDB handles queries on large, flat documents versus normalised collections?
                    </p>
                  </div>
                  <div className="bg-surface-secondary rounded p-3">
                    <p className="font-body text-t6 text-text-disabled mb-1">You</p>
                    <p className="font-body text-t5 text-text-primary">I think querying by farmerId and county will be common...</p>
                  </div>
                  <div className="bg-surface-elevated border border-accent-green/20 rounded p-3">
                    <p className="font-body text-t6 text-accent-green mb-1">Mentor</p>
                    <p className="font-body text-t5 text-text-secondary">
                      Good. Now — what index strategy would you add to a collection that gets queried by those two fields together? What does a compound index give you that two separate indexes don&apos;t?
                    </p>
                  </div>
                </div>
              </div>
            }
          />
        </div>
      </section>

      {/* ── Peer Review ─────────────────────────────────────────────────── */}
      <section className="bg-surface-elevated">
        <div className="max-w-5xl mx-auto px-6 py-16 border-b border-white/5">
          <FeatureSection
            tag="Peer Review"
            title="Before a lecturer sees your work, a peer at your level reviews it. This is how real engineering teams operate."
            body="From your second project onward, another student reviews your code quality and documentation. They cannot be someone you worked with, and they must be at equal or higher tier to you. This is not a checkbox — their review becomes part of your project record."
            points={[
              'Two-dimension review: Code Quality and Documentation Clarity',
              'Routed automatically — no conflict of interest, no self-selection',
              'Reviewers must be at equal or higher tier (BEGINNER reviews BEGINNER, etc.)',
              'Minimum comment length enforced — no empty rubber-stamping',
              'Peer review quality is tracked over time — reviewers are accountable too',
            ]}
            cta="Join the platform"
            href="/auth/register"
            preview={
              <div className="bg-surface-primary border border-white/5 rounded p-5 space-y-4">
                <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest">Peer review</p>
                {[
                  { dim: 'Code Quality', score: 4, comment: 'Good separation of concerns in the route handlers. The Zod validation schema is thorough. One note: the error codes should match the platform error enum rather than custom strings.' },
                  { dim: 'Documentation Clarity', score: 3, comment: 'The README covers setup well. The architectural decision record for the database schema choice was missing — please add rationale for the collection structure chosen.' },
                ].map(({ dim, score, comment }) => (
                  <div key={dim} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <p className="font-body text-t5 font-semibold text-text-primary">{dim}</p>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(n => (
                          <div key={n} className={`h-2 w-2 rounded-full ${n <= score ? 'bg-accent-green' : 'bg-surface-secondary'}`} />
                        ))}
                      </div>
                    </div>
                    <p className="font-body text-t6 text-text-secondary leading-relaxed">{comment}</p>
                  </div>
                ))}
              </div>
            }
          />
        </div>
      </section>

      {/* ── Lecturer Review ─────────────────────────────────────────────── */}
      <section className="bg-surface-elevated">
        <div className="max-w-5xl mx-auto px-6 py-16 border-b border-white/5">
          <FeatureSection
            tag="Lecturer Review"
            title="A university lecturer reads your work and decides if it meets professional standard."
            body="The final gate is a human. Your assigned lecturer reviews your project across four dimensions with a structured rubric. They must write a minimum of 50 words per dimension — no box-ticking. A verified project carries a lecturer's name. That is what makes the badge worth something."
            points={[
              'Four-dimension rubric: Problem Definition, Technical Approach, Process Documentation, Client Focus',
              'Minimum 50 words per dimension — enforced at submission',
              'Verdicts: VERIFIED · REVISE · REJECTED',
              'REVISE sends the project back to you with specific feedback',
              'Lecturers from University of Nairobi, Strathmore, JKUAT already onboarded',
            ]}
            cta="See lecturer workflow"
            href="/auth/register"
            flip
            preview={
              <div className="bg-surface-primary border border-white/5 rounded p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest">Rubric review</p>
                  <span className="font-mono text-t6 text-accent-green border border-accent-green/30 rounded-[2px] px-2 py-0.5">VERIFIED</span>
                </div>
                {[
                  { dim: 'Problem Definition', score: 4 },
                  { dim: 'Technical Approach', score: 4 },
                  { dim: 'Process Documentation', score: 3 },
                  { dim: 'Client Focus', score: 5 },
                ].map(({ dim, score }) => (
                  <div key={dim} className="flex items-center gap-3">
                    <span className="font-body text-t6 text-text-disabled w-36 shrink-0">{dim}</span>
                    <div className="flex-1 h-1.5 bg-surface-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-accent-green rounded-full" style={{ width: `${(score / 5) * 100}%` }} />
                    </div>
                    <span className="font-mono text-t6 text-text-secondary w-6 text-right">{score}/5</span>
                  </div>
                ))}
                <div className="pt-2 border-t border-white/5 flex items-center gap-2">
                  <SmallCheck />
                  <span className="font-body text-t6 text-text-secondary">Dr. Grace Ndung&apos;u · University of Nairobi</span>
                </div>
              </div>
            }
          />
        </div>
      </section>

      {/* ── Skills Passport + Portfolio ─────────────────────────────────── */}
      <section className="bg-surface-elevated">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <FeatureSection
            tag="Skills Passport & Portfolio"
            title="One URL. Your code, your process, your verification. Show it to any employer."
            body="Every verified project adds to your Skills Passport — a public profile that shows what you built, how you built it, and who verified it. No login required to view it. An employer in Nairobi or London can open your portfolio URL and see the full evidence record, including the lecturer who signed off."
            points={[
              'Public portfolio URL — accessible without login',
              'Every skill shows the project it came from and who verified it',
              'GitHub repository link with full commit history',
              'Lecturer name and institution on every verified entry',
              'Tier progression shown — BEGINNER to ADVANCED as your work grows',
            ]}
            cta="Build your portfolio"
            href="/auth/register"
            preview={
              <div className="bg-surface-primary border border-white/5 rounded p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-body text-t4 font-semibold text-text-primary">Amina Waweru</p>
                    <p className="font-body text-t6 text-text-disabled">Strathmore University · INTERMEDIATE</p>
                  </div>
                  <span className="font-mono text-t6 text-accent-green border border-accent-green/30 rounded-[2px] px-2 py-0.5">Public</span>
                </div>
                <div className="space-y-2">
                  {[
                    { skill: 'API Integration', tier: 'INTERMEDIATE', project: 'M-Pesa SDK', lecturer: 'Prof. Mwangi' },
                    { skill: 'Database Design', tier: 'INTERMEDIATE', project: 'MongoDB Schema', lecturer: 'Dr. Ndung\'u' },
                    { skill: 'Process Documentation', tier: 'BEGINNER', project: 'Food Hub', lecturer: 'Dr. Ndung\'u' },
                  ].map(({ skill, tier, project, lecturer }) => (
                    <div key={skill} className="flex items-center justify-between bg-surface-secondary border border-white/5 rounded p-3">
                      <div>
                        <p className="font-body text-t5 font-medium text-text-primary">{skill}</p>
                        <p className="font-body text-t6 text-text-disabled">{project} · {lecturer}</p>
                      </div>
                      <span className="font-mono text-t6 text-text-secondary border border-white/10 rounded-[2px] px-2 py-0.5 shrink-0">{tier}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t border-white/5 flex items-center gap-2">
                  <SmallCheck />
                  <span className="font-body text-t6 text-text-secondary">umojahub.co.ke/experience/portfolio/aminawaweru</span>
                </div>
              </div>
            }
          />
        </div>
      </section>


      {/* ── Final CTA ───────────────────────────────────────────────────── */}
      <section className="border-t border-white/5 bg-surface-primary">
        <div className="max-w-5xl mx-auto px-6 py-20 text-center">
          <h2 className="font-heading text-t2 font-semibold text-text-primary mb-4">
            Ready to start?
          </h2>
          <p className="font-body text-t4 text-text-secondary max-w-lg mx-auto mb-10">
            Farmers — list your first crop in under 5 minutes.
            Students — get your first project brief today.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center min-h-[44px] px-8 rounded-sm bg-accent-green text-text-primary font-body text-t5 font-medium transition-all duration-150 hover:opacity-90"
            >
              Create your account
            </Link>
            <Link
              href="/marketplace"
              className="inline-flex items-center justify-center min-h-[44px] px-8 rounded-sm border border-white/10 text-text-secondary font-body text-t5 transition-all duration-150 hover:border-white/20 hover:text-text-primary"
            >
              Browse marketplace first
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 bg-surface-elevated">
        <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-sm bg-accent-green shrink-0" />
            <span className="font-heading text-t5 font-semibold">
              <span className="text-text-primary">Umoja</span>
              <span className="text-accent-green">Hub</span>
            </span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/marketplace" className="font-body text-t6 text-text-disabled hover:text-text-secondary transition-colors duration-150">Marketplace</Link>
            <Link href="/knowledge" className="font-body text-t6 text-text-disabled hover:text-text-secondary transition-colors duration-150">Knowledge</Link>
            <Link href="/experience/portfolio/aminawaweru" className="font-body text-t6 text-text-disabled hover:text-text-secondary transition-colors duration-150">Portfolio example</Link>
            <Link href="/auth/login" className="font-body text-t6 text-text-disabled hover:text-text-secondary transition-colors duration-150">Sign in</Link>
          </div>
          <p className="font-mono text-t6 text-text-disabled">Kenya · KES · +254</p>
        </div>
      </footer>

    </main>
  );
}
