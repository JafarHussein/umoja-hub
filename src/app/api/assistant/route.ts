import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
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
