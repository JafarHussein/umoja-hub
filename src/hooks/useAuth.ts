'use client';

import { useSession } from 'next-auth/react';
import type { Role } from '@/types';

export interface IAuthUser {
  id: string;
  email: string;
  firstName: string;
  role: Role;
}

export interface IUseAuthReturn {
  session: { user: IAuthUser } | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  isLoading: boolean;
  isAuthenticated: boolean;
  user: IAuthUser | null;
}

export function useAuth(): IUseAuthReturn {
  const { data: session, status } = useSession();

  return {
    session: session as IUseAuthReturn['session'],
    status,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    user: (session?.user as IAuthUser) ?? null,
  };
}
