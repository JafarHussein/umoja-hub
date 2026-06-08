'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import gsap from 'gsap';

gsap.registerPlugin(ScrollTrigger, useGSAP);

interface Props {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
}

export function AnimateIn({ children, delay = 0, className, as: Tag = 'div' }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (prefersReduced) {
        gsap.from(ref.current, {
          opacity: 0,
          duration: 0.15,
          delay,
          scrollTrigger: { trigger: ref.current, start: 'top 90%', once: true },
        });
        return;
      }

      gsap.from(ref.current, {
        opacity: 0,
        y: 24,
        duration: 0.35,
        ease: 'power3.out',
        delay,
        scrollTrigger: {
          trigger: ref.current,
          start: 'top 85%',
          once: true,
        },
      });
    },
    { scope: ref, dependencies: [delay] }
  );

  return (
    // @ts-expect-error — dynamic tag is valid
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}

interface StaggerProps {
  children: React.ReactNode[];
  baseDelay?: number;
  staggerMs?: number;
  className?: string;
}

export function StaggerIn({ children, baseDelay = 0, staggerMs = 80, className }: StaggerProps) {
  return (
    <div className={className}>
      {children.map((child, i) => (
        <AnimateIn key={i} delay={baseDelay + (i * staggerMs) / 1000}>
          {child}
        </AnimateIn>
      ))}
    </div>
  );
}
