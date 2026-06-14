'use client';

import { useRef, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { useStoryworldStore } from '@/lib/storyworld/store';
import { AnimateIn } from '@/components/website/AnimateIn';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const StoryWorldScene = dynamic(
  () => import('./StoryWorldScene').then(m => ({ default: m.StoryWorldScene })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-[#0d1014] flex items-center justify-center">
        <p className="font-ibm-mono text-[0.6875rem] text-[#39414a] tracking-[0.08em] uppercase">
          Loading
        </p>
      </div>
    ),
  }
);

export function StoryWorldSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const { setScrollProgress, setReducedMotion } = useStoryworldStore();

  // Reduced motion detection
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [setReducedMotion]);

  // GSAP ScrollTrigger — drives scroll progress into the store
  useGSAP(
    () => {
      if (!sectionRef.current || !canvasRef.current) return;

      const trigger = ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1.5,
        pin: canvasRef.current,
        pinSpacing: false,
        onUpdate: self => setScrollProgress(self.progress),
      });

      return () => trigger.kill();
    },
    { scope: sectionRef }
  );

  return (
    <>
      {/* Screen reader content */}
      <div className="sr-only">
        <h2>Witness — The People Behind The Platform</h2>
        <p>
          Six participants — a farmer, a buyer, a student, a lecturer, an employer,
          and a cooperative leader — each arrive at UmojaHub with real concerns.
          Each has a question. Each speaks with the Guide, who demonstrates how the
          platform works. Each decides to trust the process. This section presents
          their stories.
        </p>
      </div>

      {/* Section header */}
      <div className="bg-[#0d1014] px-[120px] pt-[96px] pb-0">
        <AnimateIn>
          <p className="font-ibm-mono text-[0.6875rem] font-600 text-[#56A8A2] tracking-[0.08em] uppercase">
            Six Stories
          </p>
        </AnimateIn>
        <AnimateIn delay={0.07}>
          <h2 className="font-jakarta font-600 text-[3rem] text-[#f2f0ec] tracking-[-0.025em] leading-[1.05] mt-3">
            Witness
          </h2>
        </AnimateIn>
        <AnimateIn delay={0.14}>
          <p className="font-jakarta font-400 text-[1rem] text-[#a9a29a] leading-[1.6] mt-4 max-w-[520px]">
            Every participant arrived uncertain. Every one of them had a question.
            Scroll to witness six people discover why UmojaHub exists.
          </p>
        </AnimateIn>
      </div>

      {/* 500vh scroll container */}
      <section
        ref={sectionRef}
        className="relative bg-[#0d1014]"
        style={{ height: '500vh' }}
        aria-hidden="true"
      >
        <div
          ref={canvasRef}
          className="sticky top-0 w-full"
          style={{ height: '100vh' }}
        >
          <Suspense
            fallback={
              <div className="w-full h-full bg-[#0d1014] flex items-center justify-center">
                <p className="font-ibm-mono text-[0.6875rem] text-[#39414a] tracking-[0.08em] uppercase">
                  Loading
                </p>
              </div>
            }
          >
            <StoryWorldScene />
          </Suspense>
        </div>
      </section>
    </>
  );
}
