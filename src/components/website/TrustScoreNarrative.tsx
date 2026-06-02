'use client';

import React, { useRef, useEffect } from 'react';
import { trustScoreAnimation, type TrustScoreBar } from '@/lib/motion';

const COMPONENTS = [
  { label: 'Verification', value: 40, max: 40 },
  { label: 'Transactions', value: 18, max: 25 },
  { label: 'Ratings', value: 12, max: 20 },
  { label: 'Reliability', value: 4, max: 15 },
] as const;

// Example values representing a TRUSTED-tier farmer with 8 completed orders
const EXAMPLE_SCORE = 74;
const EXAMPLE_TIER = 'TRUSTED';

export function TrustScoreNarrative(): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const barRefs = useRef<(HTMLElement | null)[]>([]);
  const labelRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const isDesktopView = typeof window !== 'undefined' && window.innerWidth >= 768;

    if (!isDesktopView) {
      // Mobile: resolve bars immediately without GSAP
      COMPONENTS.forEach((comp, i) => {
        const el = barRefs.current[i];
        if (el) el.style.width = `${Math.round((comp.value / comp.max) * 100)}%`;
        const labelEl = labelRefs.current[i];
        if (labelEl) labelEl.classList.add('is-active');
      });
      return;
    }

    const barsData: TrustScoreBar[] = [];
    COMPONENTS.forEach((comp, i) => {
      const barEl = barRefs.current[i];
      const labelEl = labelRefs.current[i];
      if (!barEl || !labelEl) return;
      barsData.push({ barEl, labelEl, targetWidth: Math.round((comp.value / comp.max) * 100) });
    });

    if (!containerRef.current || barsData.length === 0) return;

    const cleanup = trustScoreAnimation(containerRef.current, barsData);
    return () => {
      cleanup?.();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="bg-ws-surface-dark-2 border border-ws-border-dark p-6"
      aria-label={`Example Trust Score: ${EXAMPLE_SCORE} — ${EXAMPLE_TIER} tier`}
    >
      {/* Score header */}
      <div className="flex items-start justify-between pb-5 mb-5 border-b border-ws-border-dark">
        <div>
          <p className="font-geist-mono text-ws-caption text-ws-text-faint uppercase mb-1">
            Trust Score
          </p>
          <p className="font-geist-mono text-[48px] leading-[52px] font-semibold text-ws-text-bright tabular-nums">
            {EXAMPLE_SCORE}
          </p>
          <p className="font-geist-mono text-ws-caption text-ws-text-faint mt-1">out of 100</p>
        </div>
        <span className="font-geist-mono text-ws-data font-medium text-ws-hub-green mt-1">
          {EXAMPLE_TIER}
        </span>
      </div>

      {/* Component bars */}
      <div className="flex flex-col gap-4">
        {COMPONENTS.map((comp, i) => (
          <div key={comp.label}>
            <div
              ref={(el: HTMLDivElement | null) => {
                labelRefs.current[i] = el;
              }}
              className="flex items-baseline justify-between mb-1.5 [&.is-active]:text-ws-text-dim transition-colors duration-200"
            >
              <span className="font-geist-mono text-ws-caption text-ws-text-faint">
                {comp.label}
              </span>
              <span className="font-geist-mono text-ws-caption text-ws-text-faint tabular-nums">
                {comp.value}/{comp.max}
              </span>
            </div>
            <div className="h-1.5 bg-ws-surface-dark-3 w-full overflow-hidden">
              <div
                ref={(el: HTMLDivElement | null) => {
                  barRefs.current[i] = el;
                }}
                className="h-full bg-ws-hub-green"
                style={{ width: '0%' }}
              />
            </div>
          </div>
        ))}
      </div>

      <p className="font-geist-mono text-ws-caption text-ws-text-faint mt-5 pt-4 border-t border-ws-border-dark">
        Example: a TRUSTED-tier farmer with 8 completed orders and consistent buyer ratings.
        Scroll through the methodology above to see each component activate.
      </p>
    </div>
  );
}
