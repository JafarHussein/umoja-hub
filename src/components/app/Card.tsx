import * as React from 'react';
import { cn } from '@/lib/cn';

// App design-system Card — mirror of Figma "Card" (258:19): a surface container
// defined by border + background first (elevation = restraint). Against the
// `app` token group.
//
// Padding is a named scale rather than a per-caller guess, so every card on
// every screen sits its content the same distance from its edge. `comfortable`
// is the default — a card is a piece of the experience, not a box drawn tight
// around some text.
type CardPad = 'none' | 'tight' | 'comfortable' | 'generous';

const PAD: Record<CardPad, string> = {
  // For cards that own their own internal layout (tables, split panels).
  none: '',
  // Dense repeating cards in a list or grid.
  tight: 'p-5',
  // The default.
  comfortable: 'p-6',
  // Cards that carry a single important decision or figure.
  generous: 'p-6 sm:p-8',
};

export interface ICardProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: 'div' | 'article' | 'section';
  pad?: CardPad;
}

export function Card({
  as: Tag = 'div',
  pad = 'comfortable',
  className,
  children,
  ...props
}: ICardProps): React.ReactElement {
  return (
    <Tag
      className={cn(
        'rounded-app-card border border-app-hairline bg-app-card',
        PAD[pad],
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}
