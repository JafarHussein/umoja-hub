import { gsap, ScrollTrigger } from './gsap';

const DESKTOP_MIN = 768;

// GSAP is never loaded on mobile per V2 architecture — performance constraint
// for Kenyan users on 2G/mid-range devices. All three functions return null
// below 768px; calling components fall back to static fully-resolved state.
function isDesktop(): boolean {
  return typeof window !== 'undefined' && window.innerWidth >= DESKTOP_MIN;
}

export interface TrustScoreBar {
  barEl: HTMLElement;
  labelEl: HTMLElement;
  targetWidth: number;
}

export interface DiagramPath {
  el: SVGPathElement;
  pathLength?: number;
}

export interface PaymentStep {
  el: HTMLElement;
}

export function trustScoreAnimation(
  containerEl: HTMLElement,
  bars: TrustScoreBar[]
): (() => void) | null {
  if (!isDesktop()) return null;

  const mm = gsap.matchMedia();

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerEl,
        start: 'top 60%',
        end: `+=${bars.length * 300}`,
        scrub: 0.6,
        pin: true,
      },
    });

    bars.forEach((bar, i) => {
      tl.to(
        bar.barEl,
        { width: `${bar.targetWidth}%`, duration: 0.8, ease: 'power2.out' },
        i * 0.8
      );
      tl.add(() => bar.labelEl.classList.add('is-active'), i * 0.8 + 0.5);
    });

    return () => tl.kill();
  });

  return () => mm.revert();
}

export function diagramActivation(
  containerEl: HTMLElement,
  paths: DiagramPath[]
): (() => void) | null {
  if (!isDesktop()) return null;

  const resolved = paths.map(({ el, pathLength }) => ({
    el,
    len: pathLength ?? el.getTotalLength(),
  }));

  const mm = gsap.matchMedia();

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    resolved.forEach(({ el, len }) => {
      gsap.set(el, { strokeDasharray: len, strokeDashoffset: len });
    });

    const st = ScrollTrigger.create({
      trigger: containerEl,
      start: 'top 70%',
      once: true,
      onEnter: () => {
        resolved.forEach(({ el }, i) => {
          gsap.to(el, {
            strokeDashoffset: 0,
            duration: 0.6,
            ease: 'none',
            delay: i * 0.3,
          });
        });
      },
    });

    return () => {
      st.kill();
      resolved.forEach(({ el }) =>
        gsap.set(el, { clearProps: 'strokeDasharray,strokeDashoffset' })
      );
    };
  });

  return () => mm.revert();
}

export function mPesaSequence(
  containerEl: HTMLElement,
  steps: PaymentStep[],
  onStepChange: (activeIndex: number) => void
): (() => void) | null {
  if (!isDesktop()) return null;

  const mm = gsap.matchMedia();

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    let currentStep = -1;
    const segmentSize = 1 / steps.length;

    const st = ScrollTrigger.create({
      trigger: containerEl,
      start: 'top 60%',
      end: `+=${steps.length * 300}`,
      pin: true,
      scrub: 0.6,
      onUpdate: (self) => {
        const next = Math.min(Math.floor(self.progress / segmentSize), steps.length - 1);
        if (next !== currentStep) {
          currentStep = next;
          onStepChange(currentStep);
        }
      },
    });

    return () => st.kill();
  });

  return () => mm.revert();
}
