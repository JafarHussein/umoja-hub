'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { gsap } from '@/lib/gsap';

export interface TransparencyStats {
  verifiedFarmers: number;
  counties: number;
  completedOrders: number;
  verifiedProjects: number;
  articles: number;
  lastUpdated: string;
}

interface LivePlatformStatsProps {
  stats: TransparencyStats;
}

interface StatItem {
  label: string;
  value: number;
  unit?: string;
}

export function LivePlatformStats({ stats }: LivePlatformStatsProps): React.ReactElement {
  const statItems = useMemo<StatItem[]>(
    () => [
      { label: 'Verified Farmers', value: stats.verifiedFarmers },
      { label: 'Counties Represented', value: stats.counties },
      { label: 'Completed Orders', value: stats.completedOrders },
      { label: 'Verified Projects', value: stats.verifiedProjects },
    ],
    [stats]
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const countRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    const mm = gsap.matchMedia();

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const targets = countRefs.current.filter(Boolean);

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 80%',
          once: true,
        },
      });

      targets.forEach((el, i) => {
        const finalValue = statItems[i]?.value ?? 0;
        const proxy = { val: 0 };

        tl.to(
          proxy,
          {
            val: finalValue,
            duration: 0.8,
            ease: 'power2.out',
            onUpdate() {
              if (el) el.textContent = Math.round(proxy.val).toLocaleString();
            },
          },
          i * 0.1
        );
      });

      return () => tl.kill();
    });

    return () => mm.revert();
  }, [statItems]);

  const lastUpdated = new Date(stats.lastUpdated);
  const formatted = lastUpdated.toLocaleDateString('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <section aria-label="Live platform statistics" ref={containerRef}>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 divide-x divide-zinc-800/50">
        {statItems.map((stat, i) => (
          <div key={stat.label} className="px-4 sm:px-6 first:pl-0 last:pr-0 py-4">
            <p className="font-mono text-t2 font-semibold text-text-primary tabular-nums">
              <span
                ref={(el) => {
                  countRefs.current[i] = el;
                }}
              >
                {stat.value.toLocaleString()}
              </span>
            </p>
            <p className="font-mono text-t6 text-text-disabled uppercase tracking-widest mt-1">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
      <p className="font-mono text-t6 text-text-disabled mt-3">
        Updated {formatted}
      </p>
    </section>
  );
}
