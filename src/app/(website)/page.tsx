import React from 'react';
import { Metadata } from 'next';
import { RootProblemStatement } from '@/components/website/HeroPlatformStatement';
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
  const stats = await getTransparencyData().catch(() => ({
    verifiedFarmers: 0,
    counties: 0,
    completedOrders: 0,
    verifiedProjects: 0,
    articles: 0,
    lastUpdated: new Date().toISOString(),
  }));

  return (
    <>
      {/* 1. Why UmojaHub exists — three structural failures */}
      <RootProblemStatement />

      {/* 2. Which problem describes yours — audience navigator by hub */}
      <AudienceNavigator />

      {/* 3. Live evidence — is this real and active? */}
      <section className="border-y border-zinc-800/50 bg-surface-primary">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <LivePlatformStats stats={stats} />
        </div>
      </section>

      {/* 4. How the marketplace works — flow + structural reasoning */}
      <MarketplaceFlowSection />

      {/* 5. How the Education Hub works — problem + flow + structural reasoning */}
      <EducationFlowSection />

      {/* 6. What verification means and what it does not */}
      <TrustArchitectureSection />
    </>
  );
}
