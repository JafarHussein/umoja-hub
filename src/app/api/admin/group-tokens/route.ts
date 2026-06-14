import { NextRequest, NextResponse } from 'next/server';
import { randomInt } from 'crypto';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import { groupTokenMintSchema } from '@/lib/validation/groupSchema';
import { sendSMS } from '@/lib/integrations/smsService';
import { AppError, handleApiError, requireRole, logger } from '@/lib/utils';
import { Role } from '@/types';

// ---------------------------------------------------------------------------
// POST /api/admin/group-tokens — Mint a single-use group join token
// Auth: ADMIN. Binds an uppercase alphanumeric code to one ACTIVE group, then
// SMS-dispatches it to the recipient farmer (Africa's Talking, non-blocking).
// The farmer self-redeems via POST /api/groups/redeem-token. (BE-07)
// ---------------------------------------------------------------------------

// Default token lifetime when the admin does not specify one (14 days).
const DEFAULT_EXPIRY_HOURS = 14 * 24;

// Unambiguous charset — no 0/O, 1/I/L — so codes survive being read aloud or
// re-typed from an SMS.
const TOKEN_CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const TOKEN_LENGTH = 8;

function generateToken(): string {
  let out = '';
  for (let i = 0; i < TOKEN_LENGTH; i += 1) {
    out += TOKEN_CHARSET[randomInt(TOKEN_CHARSET.length)];
  }
  return out;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const requestId = crypto.randomUUID();
    const session = await getServerSession(authOptions);
    requireRole(session, Role.ADMIN);

    const body: unknown = await req.json();
    const parsed = groupTokenMintSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', code: 'VALIDATION_FAILED', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { groupId, recipientPhone, expiresInHours } = parsed.data;

    await connectDB();

    const { default: FarmerGroup } = await import('@/lib/models/FarmerGroup.model');
    const group = await FarmerGroup.findById(groupId).select('groupName status').lean();
    if (!group || group.status !== 'ACTIVE') {
      throw new AppError('Group not found or inactive.', 404, 'DB_NOT_FOUND');
    }

    const { default: GroupJoinToken } = await import('@/lib/models/GroupJoinToken.model');
    const expiresAt = new Date(Date.now() + (expiresInHours ?? DEFAULT_EXPIRY_HOURS) * 3_600_000);

    // Mint with a bounded retry — the unique index on `token` rejects the rare
    // collision, and we re-roll rather than surface a 409 to the admin.
    let token: string | null = null;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const candidate = generateToken();
      try {
        await GroupJoinToken.create({
          token: candidate,
          groupId,
          mintedBy: session!.user.id,
          expiresAt,
        });
        token = candidate;
        break;
      } catch (error) {
        if ((error as { code?: number }).code === 11000) continue;
        throw error;
      }
    }

    if (!token) {
      throw new AppError('Could not generate a unique token. Try again.', 500, 'TOKEN_MINT_FAILED');
    }

    logger.info('admin/group-tokens', 'Group join token minted', {
      requestId,
      groupId,
      adminId: session!.user.id,
      expiresAt,
    });

    const { default: AdminAuditLog } = await import('@/lib/models/AdminAuditLog.model');
    AdminAuditLog.create({
      adminId: session!.user.id,
      action: 'GROUP_TOKEN_MINTED',
      targetId: groupId,
      targetType: 'FarmerGroup',
      details: { recipientPhone, expiresAt },
    }).catch(() => {});

    // Non-blocking SMS — sendSMS never throws and logs its own failures.
    const message = `UmojaHub: You've been invited to join "${group.groupName}". Use code ${token} in your settings to join. Expires ${expiresAt.toDateString()}.`;
    sendSMS(recipientPhone, message).catch(() => {});

    return NextResponse.json({ data: { token, groupId, expiresAt } }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
