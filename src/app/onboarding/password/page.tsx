import React from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import { OnboardingStage } from '@/types';
import { PasswordSetupClient } from './PasswordSetupClient';

// SCR-ONB-V3-001 — credentials setup, the first screen after OAuth.
//
// The identity provider has already told us who this person is, so nothing on
// this page asks for information we hold: the name, email and avatar are shown
// back as confirmation, and the username arrives pre-filled. The only thing the
// user supplies is the password.
//
// Rendered on the server so the pre-filled values are in the first paint —
// a field that arrives empty and then fills in reads as a glitch.
export default async function PasswordSetupPage(): Promise<React.ReactElement> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/auth/login');

  await connectDB();
  const { default: User } = await import('@/lib/models/User.model');
  const user = await User.findById(session.user.id)
    .select('username firstName lastName email profilePhotoUrl onboardingStage oauthProvider')
    .lean();

  if (!user) redirect('/auth/login');
  // Guard the stage here as well as in the API: arriving late (password already
  // set) should continue the funnel, not offer to set it again.
  if (user.onboardingStage !== OnboardingStage.PASSWORD_SETUP) {
    redirect('/onboarding/role-selection');
  }

  return (
    <PasswordSetupClient
      initialUsername={user.username ?? ''}
      fullName={[user.firstName, user.lastName].filter(Boolean).join(' ')}
      email={user.email}
      photoUrl={user.profilePhotoUrl ?? ''}
      provider={user.oauthProvider === 'github' ? 'github' : 'google'}
    />
  );
}
