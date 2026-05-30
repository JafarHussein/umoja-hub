import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import { handleApiError, requireRole } from '@/lib/utils';
import { farmAssistantChat } from '@/lib/integrations/groqService';
import { Role, MAX_ASSISTANT_MESSAGE_CHARS } from '@/types';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// POST /api/assistant — Farm Assistant (Groq Llama 3)
// Auth: FARMER only
// Body: { message: string (max 1000 chars), sessionId?: string }
// Returns: { response, sessionId, weatherContext }
// ---------------------------------------------------------------------------

const assistantRequestSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, 'Message cannot be empty')
    .max(MAX_ASSISTANT_MESSAGE_CHARS, `Message must be under ${MAX_ASSISTANT_MESSAGE_CHARS} characters`),
  sessionId: z.string().optional(),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    requireRole(session, Role.FARMER);

    const body: unknown = await req.json();
    const parsed = assistantRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', code: 'VALIDATION_FAILED', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { message, sessionId } = parsed.data;
    const farmerId = session!.user.id;

    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const { default: ChatSession } = await import('@/lib/models/ChatSession.model');
    let messageCount = 0;
    if (mongoose.isValidObjectId(farmerId)) {
      const rateResult = await ChatSession.aggregate<{ total: number }>([
        {
          $match: {
            farmerId: new mongoose.Types.ObjectId(farmerId),
            lastActivityAt: { $gte: tenMinutesAgo },
          },
        },
        { $unwind: '$messages' },
        { $match: { 'messages.timestamp': { $gte: tenMinutesAgo }, 'messages.role': 'user' } },
        { $count: 'total' },
      ]);
      messageCount = rateResult[0]?.total ?? 0;
    }
    if (messageCount >= 10) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait before sending more messages.', code: 'RATE_LIMITED' },
        { status: 429 }
      );
    }

    // farmAssistantChat handles all DB and external calls; never throws to caller
    const result = await farmAssistantChat(message, farmerId, sessionId);

    return NextResponse.json({
      data: {
        response: result.response,
        sessionId: result.sessionId,
        weatherContext: result.weatherContext,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
