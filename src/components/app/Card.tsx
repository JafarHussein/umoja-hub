import * as React from 'react';
import { cn } from '@/lib/cn';

// App design-system Card — mirror of Figma "Card" (258:19): a surface container
// defined by border + background first (elevation = restraint). Against the
// `app` token group.
export interface ICardProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: 'div' | 'article' | 'section';
}

export function Card({
  as: Tag = 'div',
  className,
  children,
  ...props
}: ICardProps): React.ReactElement {
  return (
    <Tag
      className={cn(
        'rounded-app-card border border-app-hairline bg-app-card p-4',
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}
