import React from 'react';
import { Metadata } from 'next';
import { HeroPlatformStatement } from '@/components/website/HeroPlatformStatement';
import { AudienceNavigator } from '@/components/website/AudienceNavigator';
import { LivePlatformStats } from '@/components/website/LivePlatformStats';
import { MarketplaceFlowSection } from '@/components/website/MarketplaceFlowSection';
import { EducationFlowSection } from '@/components/website/EducationFlowSection';
import { TrustArchitectureSection } from '@/components/website/TrustArchitectureSection';
import { getTransparencyData } from '@/lib/transparency';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'UmojaHub — Verified Agricultural Marketplace for East Africa',
  description:
    'A verified farmer marketplace and education platform for CS students. Powered by M-Pesa. Built for East Africa.',
};

export default async function HomePage(): Promise<React.ReactElement> {
  let stats = await getTransparencyData().catch(() => ({
    verifiedFarmers: 0,
    counties: 0,
    completedOrders: 0,
    verifiedProjects: 0,
    articles: 0,
    lastUpdated: new Date().toISOString(),
  }));

  return (
    <>
      {/* 1. Platform truth statement — no tagline */}
      <HeroPlatformStatement />

      {/* 2. Audience navigator — 9-card grid */}
      <AudienceNavigator />

      {/* 3. Live platform statistics */}
      <section className="border-y border-zinc-800/50 bg-surface-primary">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <LivePlatformStats stats={stats} />
        </div>
      </section>

      {/* 4. Marketplace flow */}
      <MarketplaceFlowSection />

      {/* 5. Education flow */}
      <EducationFlowSection />

      {/* 6. Trust architecture */}
      <TrustArchitectureSection />

      {/* 7. Platform coverage */}
      <section className="bg-surface-primary py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div>
              <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-3">
                Coverage · Infrastructure
              </p>
              <h2 className="font-heading text-[32px] lg:text-display-lg font-semibold text-text-primary tracking-tight mb-4">
                Built on Kenya&apos;s existing payment infrastructure
              </h2>
              <div className="max-w-prose space-y-4">
                <p className="font-body text-t4 text-text-secondary">
                  UmojaHub does not require farmers or buyers to open a new account with a new
                  payment provider. Every transaction uses M-Pesa — the payment system already in
                  use across Kenya.
                </p>
                <p className="font-body text-t4 text-text-secondary">
                  When a buyer places an order, a Safaricom STK Push is sent to their registered
                  M-Pesa number. The buyer enters their PIN. Safaricom confirms. The order updates.
                  No bank account required on either side.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-px bg-zinc-800/50">
              {[
                {
                  label: 'Payment method',
                  value: 'M-Pesa STK Push',
                  note: 'Safaricom Daraja API',
                },
                {
                  label: 'Transaction confirmation',
                  value: 'Real-time',
                  note: 'Safaricom confirms before order updates',
                },
                {
                  label: 'Platform coverage',
                  value: 'All Kenya',
                  note: 'Any county with M-Pesa access',
                },
                {
                  label: 'Bank account required',
                  value: 'No',
                  note: 'M-Pesa only on both sides',
                },
              ].map((item) => (
                <div key={item.label} className="bg-surface-primary p-5">
                  <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mb-2">
                    {item.label}
                  </p>
                  <p className="font-mono text-t3 font-semibold text-text-primary tabular-nums">
                    {item.value}
                  </p>
                  <p className="font-body text-t6 text-text-secondary mt-1">{item.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
