'use client';

import * as React from 'react';
import { Button } from './Button';
import { GoogleIcon, GitHubIcon } from './BrandIcons';

// The identity-provider sign-in button. One component so Google and GitHub are
// identical in height, icon size and label wording everywhere they appear — a
// provider button that shifts between screens reads as a different button, and
// recognition is the entire point of using the official marks.
//
// Sizing follows the convention users already know from Google, GitHub, Linear,
// Vercel, Notion and Figma: an 18px mark paired with the button's body text,
// grouped and centred, on a neutral outlined surface rather than a coloured one.
// The mark is slightly larger than the button's default 16px icon slot because
// these are read as logos, not as UI glyphs.

export type OAuthProvider = 'google' | 'github';

const PROVIDER_LABEL: Record<OAuthProvider, string> = {
  google: 'Google',
  github: 'GitHub',
};

export interface IProviderButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  provider: OAuthProvider;
  isLoading?: boolean;
  /** Defaults to "Continue with {Provider}". */
  label?: string;
}

export function ProviderButton({
  provider,
  isLoading = false,
  label,
  className,
  ...props
}: IProviderButtonProps): React.ReactElement {
  const Icon = provider === 'google' ? GoogleIcon : GitHubIcon;

  return (
    <Button
      type="button"
      variant="secondary"
      size="lg"
      isLoading={isLoading}
      className={className}
      {...props}
    >
      {/* While loading the Button renders its own spinner; showing the mark too
          would put two glyphs in the row. */}
      {!isLoading && <Icon className="size-[18px]" />}
      {label ?? `Continue with ${PROVIDER_LABEL[provider]}`}
    </Button>
  );
}
