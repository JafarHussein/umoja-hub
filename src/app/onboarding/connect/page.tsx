import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { ONBOARDING_DRAFT_COOKIE, verifyDraftValue } from '@/lib/auth/onboardingDraftCookie';
import { Role } from '@/types';
import { ConnectClient } from './ConnectClient';

// SCR-ONB-V2-003 — connect step (AUTH_ONBOARDING_FLOW_V2). Server component so
// the draft-cookie guard runs in the Node runtime (HMAC verification) rather
// than edge middleware. A missing/forged/expired draft bounces to welcome; the
// provider offered is derived from the draft role (Student → GitHub, else
// Google) and enforced again in the signIn reconcile callback.
export default async function ConnectPage(): Promise<React.ReactElement> {
  const store = await cookies();
  const draftId = verifyDraftValue(store.get(ONBOARDING_DRAFT_COOKIE)?.value);
  if (!draftId) redirect('/onboarding/welcome');

  await connectDB();
  const { default: OnboardingDraft } = await import('@/lib/models/OnboardingDraft.model');
  const draft = await OnboardingDraft.findById(draftId).select('username role').lean();
  if (!draft) redirect('/onboarding/welcome');

  return <ConnectClient role={draft.role as Role} username={draft.username} />;
}
