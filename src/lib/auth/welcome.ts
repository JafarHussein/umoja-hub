import { Role } from '@/types';

// The first message a new account receives.
//
// Under AUTH_ONBOARDING_FLOW_V3 the account is created by the OAuth callback
// before a role exists, so this cannot fire at creation time — the copy is
// role-specific and there would be nothing to say. It fires when the role is
// chosen instead, which is also the moment the welcome is actually useful,
// because it can name the person's real first task.
//
// Shared between the role-selection route and the admin-allowlist bootstrap in
// authOptions so the two entry points cannot drift.

function welcomeBodyFor(role: Role): string {
  switch (role) {
    case Role.FARMER:
      return 'Your account is ready. Get your farm verified, then create your first listing to reach buyers across the region.';
    case Role.BUYER:
      return 'Your account is ready. Browse verified produce and source directly from trusted farmers — every order is escrow-protected.';
    case Role.STUDENT:
      return 'Your account is ready. Verify your university email so your coursework can shape the engineering work you take on here.';
    case Role.LECTURER:
      return 'Your reviewer account is ready and pending verification. Once approved, student work will arrive in your review queue.';
    case Role.ADMIN:
      return 'Your admin console is ready. Verification requests, disputes and payout approvals will surface here for you to action.';
    default:
      return 'Your account is ready. Open your dashboard to take your first step.';
  }
}

// Awaited rather than fire-and-forget so the welcome reliably dispatches before
// a serverless invocation ends; notify() never throws.
export async function sendWelcome(userId: string, role: Role): Promise<void> {
  const { notify } = await import('@/lib/notifications/notify');
  const { NotificationType } = await import('@/types');
  await notify({
    userId,
    type: NotificationType.WELCOME,
    title: 'Welcome to UmojaHub',
    body: welcomeBodyFor(role),
  });
}
