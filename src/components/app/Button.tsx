import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

// App design-system Button — mirror of Figma "Button" (257:27):
// Variant (Primary · Secondary · Ghost · Danger) × State (Default · Hover ·
// Disabled), Label. Renders against the `app` token group; lives under
// .theme-app. Min target 44px (Foundation §4.4); radius = control (8px).
const buttonVariants = cva(
  [
    'app-body-strong inline-flex shrink-0 items-center justify-center gap-2',
    'rounded-app-control px-4 whitespace-nowrap select-none',
    'transition-colors duration-150 ease-standard',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ring',
    'disabled:pointer-events-none disabled:opacity-50',
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ].join(' '),
  {
    variants: {
      variant: {
        primary: 'bg-app-brand text-app-on-brand hover:bg-app-brand-hover',
        secondary:
          'border border-app-border-strong bg-app-card text-app-ink hover:bg-app-sunken',
        ghost: 'text-app-brand hover:bg-app-brand-surface',
        danger: 'bg-app-danger text-app-on-brand hover:opacity-90',
      },
      size: {
        sm: 'h-9',
        md: 'h-11',
        lg: 'h-12',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
);

export interface IButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

export function Button({
  className,
  variant,
  size,
  isLoading = false,
  disabled,
  children,
  ...props
}: IButtonProps): React.ReactElement {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={isLoading || disabled}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {isLoading && (
        <span
          aria-hidden
          className="size-4 animate-spin rounded-app-pill border-2 border-current border-r-transparent"
        />
      )}
      {children}
    </button>
  );
}

export { buttonVariants };
