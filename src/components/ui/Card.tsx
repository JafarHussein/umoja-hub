import React from 'react';

export type CardVariant = 'standard' | 'elevated' | 'interactive';

export interface ICardProps {
  variant?: CardVariant;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}

const variantClasses: Record<CardVariant, string> = {
  standard: 'bg-surface-elevated border border-white/5',
  elevated: 'bg-surface-secondary border border-white/5',
  interactive:
    'bg-surface-elevated border border-white/5 cursor-pointer hover:border-white/10 transition-all duration-150',
};

export function Card({
  variant = 'standard',
  className = '',
  children,
  onClick,
}: ICardProps): React.ReactElement {
  if (onClick ?? variant === 'interactive') {
    return (
      <div
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onClick={onClick}
        onKeyDown={
          onClick
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') onClick();
              }
            : undefined
        }
        className={['rounded p-4', variantClasses[variant], className].join(' ')}
      >
        {children}
      </div>
    );
  }

  return (
    <div className={['rounded p-4', variantClasses[variant], className].join(' ')}>
      {children}
    </div>
  );
}
