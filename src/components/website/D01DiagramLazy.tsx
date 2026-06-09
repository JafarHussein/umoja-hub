'use client';

import dynamic from 'next/dynamic';

const D01Diagram = dynamic(
  () => import('@/components/website/D01Diagram').then(mod => ({ default: mod.D01Diagram })),
  {
    ssr: false,
    loading: () => <div className="w-full h-[400px] bg-[#131619] rounded-[2px]" />,
  }
);

export function D01DiagramLazy() {
  return <D01Diagram />;
}
