import React from 'react';
import Link from 'next/link';

export default function LandingPage(): React.ReactElement {
  return (
    <div className="min-h-screen bg-surface-primary">
      {/* Nav */}
      <header className="border-b border-zinc-800/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-sm bg-accent-green shrink-0" />
            <span className="font-heading text-t4 font-semibold">
              <span className="text-text-primary">Umoja</span>
              <span className="text-accent-green">Hub</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="font-body text-t5 text-text-secondary hover:text-text-primary transition-colors duration-150"
            >
              Sign in
            </Link>
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center min-h-[36px] px-4 rounded-sm bg-accent-green text-text-primary font-body text-t5 font-medium transition-all duration-150 hover:opacity-90"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-3xl">
          <p className="font-mono text-t6 text-accent-green uppercase tracking-widest mb-4">
            Built for Kenya · Verified by design
          </p>
          <h1 className="font-heading text-t1 font-semibold text-text-primary tracking-tight leading-tight mb-6">
            The infrastructure layer for East African food security and technical talent
          </h1>
          <p className="font-body text-t4 text-text-secondary max-w-2xl mb-8">
            UmojaHub connects verified farmers with buyers via M-Pesa — and gives CS students a
            real-world platform to build, review, and certify Kenyan industry solutions.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/marketplace"
              className="inline-flex items-center justify-center min-h-[44px] px-6 rounded-sm bg-accent-green text-text-primary font-body text-t5 font-medium transition-all duration-150 hover:opacity-90"
            >
              Browse marketplace
            </Link>
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center min-h-[44px] px-6 rounded-sm border border-zinc-800/50 text-text-secondary font-body text-t5 transition-all duration-150 hover:border-white/20 hover:text-text-primary"
            >
              Create account
            </Link>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-y border-zinc-800/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 divide-x divide-zinc-800/50">
            {[
              { label: 'Verified Farmers', value: '5', unit: 'counties' },
              { label: 'Active Listings', value: '10', unit: 'crops' },
              { label: 'M-Pesa Orders', value: 'KES 22K+', unit: 'facilitated' },
              { label: 'Student Projects', value: '3', unit: 'verified / in-review' },
            ].map((stat) => (
              <div key={stat.label} className="px-4 sm:px-6 first:pl-0 last:pr-0 py-2">
                <p className="font-mono text-t2 font-semibold text-text-primary tabular-nums">
                  {stat.value}
                </p>
                <p className="font-body text-t6 text-text-secondary mt-0.5">{stat.label}</p>
                <p className="font-mono text-t6 text-text-disabled">{stat.unit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Role sections */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 space-y-12">

        {/* For Farmers */}
        <div className="grid sm:grid-cols-2 gap-6 items-start">
          <div>
            <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-2">
              For Farmers
            </p>
            <h2 className="font-heading text-t2 font-semibold text-text-primary tracking-tight mb-4">
              Sell direct. Get paid instantly.
            </h2>
            <p className="font-body text-t4 text-text-secondary mb-6">
              Post your produce directly to buyers across Kenya. Buyers pay via M-Pesa STK Push — funds
              confirm without you chasing anyone. Your trust tier rises automatically with every
              completed order.
            </p>
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center min-h-[44px] px-5 rounded-sm border border-zinc-800/50 text-text-secondary font-body text-t5 transition-all duration-150 hover:border-accent-green/50 hover:text-text-primary"
            >
              Register as farmer
            </Link>
          </div>
          <div className="bg-surface-elevated border border-zinc-800/50 rounded-sm overflow-hidden">
            {[
              ['Verified farmer badge', 'Document verification by admin team'],
              ['Crop listings', 'Price per unit, pickup county, contact preference'],
              ['M-Pesa STK Push', 'Buyer pays directly — no cash handling'],
              ['Trust score', 'Rises with every completed + rated order'],
              ['Price intelligence', 'See what your crop is trading at in Nairobi'],
              ['AI Farm Assistant', 'Groq-powered agronomic advice and weather context'],
            ].map(([feature, detail]) => (
              <div key={feature} className="flex items-start gap-3 px-4 py-3 border-b border-zinc-800/50 last:border-0">
                <div className="mt-1 h-1.5 w-1.5 rounded-full bg-accent-green shrink-0" />
                <div>
                  <p className="font-body text-t5 text-text-primary">{feature}</p>
                  <p className="font-body text-t6 text-text-secondary">{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-zinc-800/50" />

        {/* For Buyers */}
        <div className="grid sm:grid-cols-2 gap-6 items-start">
          <div className="sm:order-2">
            <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-2">
              For Buyers
            </p>
            <h2 className="font-heading text-t2 font-semibold text-text-primary tracking-tight mb-4">
              Verified produce. Transparent pricing.
            </h2>
            <p className="font-body text-t4 text-text-secondary mb-6">
              Browse listings from verified farmers across Kenya. Every listing shows the
              farmer&apos;s trust tier, transaction history, and location. Pay with M-Pesa — no
              broker, no cash risk.
            </p>
            <div className="flex gap-3">
              <Link
                href="/marketplace"
                className="inline-flex items-center justify-center min-h-[44px] px-5 rounded-sm bg-accent-green text-text-primary font-body text-t5 font-medium transition-all duration-150 hover:opacity-90"
              >
                Browse marketplace
              </Link>
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center min-h-[44px] px-5 rounded-sm border border-zinc-800/50 text-text-secondary font-body text-t5 transition-all duration-150 hover:border-white/20 hover:text-text-primary"
              >
                Register as buyer
              </Link>
            </div>
          </div>
          <div className="sm:order-1 bg-surface-elevated border border-zinc-800/50 rounded-sm overflow-hidden">
            {[
              ['Farmer trust tier', 'BRONZE → ESTABLISHED → TRUSTED → PREMIUM'],
              ['Verified listings only', 'Admin-verified farmers only appear in search'],
              ['M-Pesa checkout', 'STK Push — buyer pays from their phone'],
              ['Order tracking', 'Pending → Paid → Dispatched → Received'],
              ['Knowledge Hub', 'KALRO, KEBS, and KVB-sourced agronomic articles'],
            ].map(([feature, detail]) => (
              <div key={feature} className="flex items-start gap-3 px-4 py-3 border-b border-zinc-800/50 last:border-0">
                <div className="mt-1 h-1.5 w-1.5 rounded-full bg-accent-green shrink-0" />
                <div>
                  <p className="font-body text-t5 text-text-primary">{feature}</p>
                  <p className="font-body text-t6 text-text-secondary">{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-zinc-800/50" />

        {/* For Students */}
        <div className="grid sm:grid-cols-2 gap-6 items-start">
          <div>
            <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-2">
              For CS Students
            </p>
            <h2 className="font-heading text-t2 font-semibold text-text-primary tracking-tight mb-4">
              Build real. Get verified.
            </h2>
            <p className="font-body text-t4 text-text-secondary mb-6">
              The Education Hub is a structured project pipeline. Generate an AI brief for a Kenyan
              industry challenge or bring your own open-source repo. Submit your process documents,
              pass peer and lecturer review, and earn a verifiable portfolio credential.
            </p>
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center min-h-[44px] px-5 rounded-sm border border-zinc-800/50 text-text-secondary font-body text-t5 transition-all duration-150 hover:border-accent-green/50 hover:text-text-primary"
            >
              Register as student
            </Link>
          </div>
          <div className="bg-surface-elevated border border-zinc-800/50 rounded-sm overflow-hidden">
            {[
              ['AI-generated brief', 'GPT-4o brief scoped to Kenyan industry context'],
              ['Open-source track', 'Bring your own GitHub repo'],
              ['Structured process docs', 'Problem breakdown, approach plan, final reflection'],
              ['Peer review', 'Scored by another student before lecturer sees it'],
              ['Lecturer verification', 'University-affiliated lecturer issues VERIFIED decision'],
              ['Portfolio credential', 'Verifiable URL — shareable with employers'],
            ].map(([feature, detail]) => (
              <div key={feature} className="flex items-start gap-3 px-4 py-3 border-b border-zinc-800/50 last:border-0">
                <div className="mt-1 h-1.5 w-1.5 rounded-full bg-accent-green shrink-0" />
                <div>
                  <p className="font-body text-t5 text-text-primary">{feature}</p>
                  <p className="font-body text-t6 text-text-secondary">{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-sm bg-accent-green shrink-0" />
            <span className="font-heading text-t6 font-semibold text-text-secondary">
              UmojaHub
            </span>
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="/marketplace"
              className="font-body text-t6 text-text-disabled hover:text-text-secondary transition-colors duration-150"
            >
              Marketplace
            </Link>
            <Link
              href="/knowledge"
              className="font-body text-t6 text-text-disabled hover:text-text-secondary transition-colors duration-150"
            >
              Knowledge Hub
            </Link>
            <Link
              href="/auth/login"
              className="font-body text-t6 text-text-disabled hover:text-text-secondary transition-colors duration-150"
            >
              Sign in
            </Link>
          </div>
          <p className="font-mono text-t6 text-text-disabled">
            © 2026 UmojaHub
          </p>
        </div>
      </footer>
    </div>
  );
}
