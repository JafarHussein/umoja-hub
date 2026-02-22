import React from 'react';

/**
 * VerifiedBadge — the most important micro-element in UmojaHub.
 *
 * Rules (non-negotiable):
 * - Plain green SVG checkmark. No background. No circle. No border. No shadow.
 * - Always the same size. Never decorative.
 * - Appears only on genuinely verified entities.
 * - Placed directly adjacent to the entity name with a 6px gap.
 */
export interface IVerifiedBadgeProps {
  /** Accessible label — describe what is verified */
  label?: string;
}

export function VerifiedBadge({
  label = 'Verified',
}: IVerifiedBadgeProps): React.ReactElement {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label={label}
      role="img"
      className="inline-block shrink-0 translate-y-[1px]"
    >
      <path
        d="M2.5 7L5.5 10L11.5 4"
        stroke="#007F4E"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
