'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/cn';

interface FaqItemProps {
  question: string;
  answer: string;
  defaultOpen?: boolean;
}

export function FaqItem({
  question,
  answer,
  defaultOpen = false,
}: FaqItemProps): React.ReactElement {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-ws-border-light last:border-b-0">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center justify-between w-full gap-4 py-4 text-left"
      >
        <span className="font-geist text-[16px] leading-[24px] font-medium text-ws-text-primary">
          {question}
        </span>
        <span
          className={cn(
            'font-geist-mono text-ws-caption text-ws-text-tertiary shrink-0 transition-transform duration-200',
            open && 'rotate-180'
          )}
          aria-hidden
        >
          ▾
        </span>
      </button>

      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-200 ease-out',
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        )}
      >
        <div className="overflow-hidden">
          <p className="font-geist text-[15px] leading-[22px] text-ws-text-secondary pb-4">
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
}
