'use client';

import React from 'react';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';

export interface FaqItem {
  question: string;
  answer: string;
}

interface FaqAccordionProps {
  items: FaqItem[];
}

export function FaqAccordion({ items }: FaqAccordionProps): React.ReactElement {
  return (
    <Accordion className="w-full divide-y divide-zinc-800/50">
      {items.map((item, i) => (
        <AccordionItem key={i} value={String(i)} className="border-0 py-1">
          <AccordionTrigger className="font-body text-t4 text-text-primary hover:no-underline py-4 px-0 rounded-none border-0 hover:text-text-primary focus-visible:ring-1 focus-visible:ring-accent-green focus-visible:rounded-sm">
            {item.question}
          </AccordionTrigger>
          <AccordionContent className="pb-4 pt-0">
            <div className="font-body text-t4 text-text-secondary leading-relaxed max-w-3xl whitespace-pre-line">
              {item.answer}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
