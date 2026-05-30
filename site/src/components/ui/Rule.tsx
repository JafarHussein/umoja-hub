interface RuleProps {
  readonly className?: string;
}

export function Rule({ className = '' }: RuleProps) {
  return <hr className={className} aria-hidden="true" />;
}
