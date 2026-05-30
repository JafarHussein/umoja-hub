import Link from 'next/link';

interface TextLinkProps {
  readonly href: string;
  readonly children: React.ReactNode;
  readonly external?: boolean;
  readonly className?: string;
}

export function TextLink({ href, children, external = false, className = '' }: TextLinkProps) {
  const base = [
    'font-mono text-m2 text-text-secondary',
    'inline-flex items-baseline gap-1.5',
    'group',
    'hover:text-text-primary transition-colors duration-150',
    className,
  ].join(' ');

  const arrow = (
    <span
      className="text-text-disabled group-hover:text-text-secondary inline-block translate-x-0 group-hover:translate-x-0.5 transition-transform duration-150 ease-out"
      aria-hidden="true"
    >
      {'→'}
    </span>
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={base}>
        {children}
        {arrow}
      </a>
    );
  }

  return (
    <Link href={href} className={base}>
      {children}
      {arrow}
    </Link>
  );
}
