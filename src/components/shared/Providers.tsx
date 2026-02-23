'use client';

import React from 'react';
import { SessionProvider } from 'next-auth/react';

export interface IProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: IProvidersProps): React.ReactElement {
  return <SessionProvider>{children}</SessionProvider>;
}
