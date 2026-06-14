'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { AnimateIn } from '@/components/website/AnimateIn';
import {
  BRANCH_CAP_MS,
  EPISODE_LENGTH,
  PROLOGUE_END,
  ROLES,
  SECTION_VH,
} from '@/lib/storyworld/v2/config';
import { BRANCHES, EPISODES_V2, FINALE_DIALOGUE } from '@/lib/storyworld/v2/data';
import { useStoryworldV2 } from '@/lib/storyworld/v2/store';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const SceneV2 = dynamic(() => import('./SceneV2').then(m => ({ default: m.SceneV2 })), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#0d1014] flex items-center justify-center">
      <p className="font-ibm-mono text-[0.6875rem] text-[#39414a] tracking-[0.08em] uppercase">
        Loading
      </p>
    </div>
  ),
});

const CHAPTER_NAMES = [
  'Prologue — The Commons',
  'Chapter 1 — The Farmer',
  'Chapter 2 — The Buyer',
  'Chapter 3 — The Student',
  'Chapter 4 — The Lecturer',
  'Chapter 5 — The Employer',
  'Chapter 6 — The Cooperative',
  'Chapter 7 — The NGO',
  'Finale — The Ledger',
];

export function StoryWorldV2Section() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [armed, setArmed] = useState(false);
  const [running, setRunning] = useState(false);
  const [announced, setAnnounced] = useState('');

  // Tier detection (§13.1) + reduced motion.
  useEffect(() => {
    const store = useStoryworldV2.getState();
    const narrow = window.innerWidth < 768;
    const weak = (navigator.hardwareConcurrency ?? 8) <= 4;
    store.setTier(narrow ? 3 : weak ? 2 : 1);

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    store.setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => store.setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Canvas gate — the scene mounts only when the visitor approaches (§13.4).
  useEffect(() => {
    if (!sectionRef.current) return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(e => e.isIntersecting)) {
          setArmed(true);
          observer.disconnect();
        }
      },
      { rootMargin: '600px 0px' }
    );
    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // Visibility: park the render loop off-screen, and reset the world for a fresh
  // replay whenever the visitor fully leaves the section in either direction.
  useEffect(() => {
    if (!sectionRef.current) return;
    let wasVisible = false;
    const observer = new IntersectionObserver(entries => {
      const visible = entries.some(e => e.isIntersecting);
      setRunning(visible);
      if (!visible && wasVisible) {
        useStoryworldV2.getState().resetWorld();
      }
      wasVisible = visible;
    });
    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // Branch pocket: soft scroll-lock with the 10s hard cap (Resolved Decision 5).
  useEffect(() => {
    let capTimer: number | null = null;
    const unsub = useStoryworldV2.subscribe(state => {
      const locked = state.branchActive !== null;
      document.body.style.overflow = locked ? 'hidden' : '';
      if (locked && capTimer === null) {
        capTimer = window.setTimeout(() => {
          useStoryworldV2.getState().endBranch();
        }, BRANCH_CAP_MS);
      }
      if (!locked && capTimer !== null) {
        window.clearTimeout(capTimer);
        capTimer = null;
      }
    });
    return () => {
      unsub();
      if (capTimer !== null) window.clearTimeout(capTimer);
      document.body.style.overflow = '';
    };
  }, []);

  // Chapter announcements for the live region (§10.3).
  useEffect(() => {
    let last = -1;
    return useStoryworldV2.subscribe(state => {
      if (state.chapter !== last) {
        last = state.chapter;
        setAnnounced(CHAPTER_NAMES[state.chapter] ?? '');
      }
    });
  }, []);

  // Scroll driver — the V1 ScrollTrigger pattern, retained (§9.1).
  useGSAP(
    () => {
      if (!sectionRef.current || !canvasRef.current) return;
      const trigger = ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.8,
        pin: canvasRef.current,
        pinSpacing: false,
        onUpdate: self => useStoryworldV2.getState().setScrollProgress(self.progress),
      });
      return () => trigger.kill();
    },
    { scope: sectionRef }
  );

  // Keyboard model (§10.3): arrows step chapters, Esc closes/exits.
  function handleKeyDown(e: React.KeyboardEvent) {
    const store = useStoryworldV2.getState();
    if (e.key === 'Escape') {
      store.setInspecting(null);
      store.endBranch();
      return;
    }
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    if (!sectionRef.current) return;
    e.preventDefault();
    const dir = e.key === 'ArrowRight' ? 1 : -1;
    const next = Math.min(8, Math.max(0, store.chapter + dir));
    const fraction =
      next === 0 ? 0 : next === 8 ? 0.92 : PROLOGUE_END + (next - 1) * EPISODE_LENGTH + 0.02;
    const top =
      sectionRef.current.getBoundingClientRect().top +
      window.scrollY +
      fraction * sectionRef.current.offsetHeight;
    window.scrollTo({ top, behavior: store.reducedMotion ? 'auto' : 'smooth' });
  }

  return (
    <>
      {/* Screen reader narrative — the screenplay, verbatim (§10.2) */}
      <div className="sr-only">
        <h2>The Commons — spend a few minutes inside UmojaHub</h2>
        <p>
          Seven people arrive at a small settlement built around a central record structure
          called the Ledger. Each carries a hard question about trust. The Administrator —
          the platform steward — answers each one, and every answer changes the world
          visibly: verifications, escrowed payments, sealed reviews, group orders. Every
          event writes a permanent record ring onto the Ledger.
        </p>
        {EPISODES_V2.map(ep => (
          <section key={ep.chapter}>
            <h3>{CHAPTER_NAMES[ep.chapter]}</h3>
            {ep.dialogue.map(line => (
              <p key={line.id}>
                {ROLES[line.speaker].label}: {line.text}
              </p>
            ))}
            {BRANCHES.filter(b => b.chapter === ep.chapter).map(b => (
              <p key={b.id}>
                In a follow-up exchange — {b.lines.map(l => `${ROLES[l.speaker].label}: ${l.text}`).join(' ')}
              </p>
            ))}
          </section>
        ))}
        <section>
          <h3>{CHAPTER_NAMES[8]}</h3>
          {FINALE_DIALOGUE.map(line => (
            <p key={line.id}>
              {ROLES[line.speaker].label}: {line.text}
            </p>
          ))}
        </section>
      </div>

      {/* Live region — chapter announcements */}
      <div aria-live="polite" className="sr-only">
        {announced}
      </div>

      {/* Section header — Resolved Decision 4 */}
      <div className="bg-[#0d1014] px-[120px] max-md:px-6 pt-[96px] pb-0">
        <AnimateIn>
          <p className="font-ibm-mono text-[0.6875rem] font-600 text-[#56A8A2] tracking-[0.08em] uppercase">
            The Commons
          </p>
        </AnimateIn>
        <AnimateIn delay={0.07}>
          <h2 className="font-jakarta font-600 text-[3rem] max-md:text-[2rem] text-[#f2f0ec] tracking-[-0.025em] leading-[1.05] mt-3">
            Spend a few minutes inside UmojaHub.
          </h2>
        </AnimateIn>
        <AnimateIn delay={0.14}>
          <p className="font-jakarta font-400 text-[1rem] text-[#a9a29a] leading-[1.6] mt-4 max-w-[560px]">
            Seven people arrive with hard questions. Watch the answers happen — or go find
            them yourself.
          </p>
        </AnimateIn>
      </div>

      {/* Pinned world */}
      <section
        ref={sectionRef}
        className="relative bg-[#0d1014]"
        style={{ height: `${SECTION_VH}vh` }}
        aria-label="The Commons — interactive story world"
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        <div ref={canvasRef} className="sticky top-0 w-full" style={{ height: '100vh' }}>
          {armed ? (
            <Suspense
              fallback={
                <div className="w-full h-full bg-[#0d1014] flex items-center justify-center">
                  <p className="font-ibm-mono text-[0.6875rem] text-[#39414a] tracking-[0.08em] uppercase">
                    Loading
                  </p>
                </div>
              }
            >
              <SceneV2 running={running} />
            </Suspense>
          ) : (
            <div className="w-full h-full bg-[#0d1014]" />
          )}
        </div>
      </section>
    </>
  );
}
