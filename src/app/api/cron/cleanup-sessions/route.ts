import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import ChatSession from '@/lib/models/ChatSession.model';
import MentorSession from '@/lib/models/MentorSession.model';
import { logger } from '@/lib/utils';

// ---------------------------------------------------------------------------
// POST /api/cron/cleanup-sessions — Nightly session cleanup
// Auth: Bearer CRON_SECRET
// Schedule: nightly midnight UTC (3am EAT)
// Per BUSINESS_LOGIC.md §10.4 — belt-and-suspenders for TTL indexes
// ---------------------------------------------------------------------------

function verifyCronSecret(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return false;
  const token = authHeader.replace('Bearer ', '').trim();
  return token === process.env['CRON_SECRET'];
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized', code: 'AUTH_UNAUTHORIZED' }, { status: 401 });
  }

  await connectDB();

  const now = new Date();

  const [chatResult, mentorResult] = await Promise.all([
    ChatSession.deleteMany({ expiresAt: { $lt: now } }),
    MentorSession.deleteMany({ expiresAt: { $lt: now } }),
  ]);

  const chatDeleted = chatResult.deletedCount;
  const mentorDeleted = mentorResult.deletedCount;

  logger.info('cron/cleanup-sessions', 'Session cleanup complete', {
    chatSessionsDeleted: chatDeleted,
    mentorSessionsDeleted: mentorDeleted,
  });

  return NextResponse.json({
    data: {
      chatSessionsDeleted: chatDeleted,
      mentorSessionsDeleted: mentorDeleted,
    },
  });
}
