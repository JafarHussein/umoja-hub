import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import { mentorChatSchema } from '@/lib/validation/educationSchema';
import { AppError, handleApiError, requireRole, logger } from '@/lib/utils';
import { env } from '@/lib/env';
import { Role, ProjectStatus, MENTOR_SESSION_TTL_DAYS } from '@/types';
import type { ProjectEngagementDoc } from '@/lib/models/ProjectEngagement.model';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama3-8b-8192';
const MENTOR_RATE_LIMIT = 10;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const MENTOR_FALLBACK =
  "I'm having trouble connecting right now. Please try again in a moment.";

const ACTIVE_STATUSES: ProjectStatus[] = [
  ProjectStatus.BRIEF_GENERATED,
  ProjectStatus.IN_PROGRESS,
  ProjectStatus.SUBMITTED,
  ProjectStatus.UNDER_PEER_REVIEW,
  ProjectStatus.UNDER_LECTURER_REVIEW,
  ProjectStatus.REVISION_REQUIRED,
];

// ---------------------------------------------------------------------------
// POST /api/mentor/chat — AI mentor backed by Groq, engagement-scoped
// Auth: STUDENT
// Body: { message: string, engagementId: string }
// Rate limit: 10 user messages per 10-minute window per session
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session, Role.STUDENT);

    const body: unknown = await req.json();
    const parsed = mentorChatSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'The submitted data is invalid.',
          code: 'VALIDATION_FAILED',
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { message, engagementId } = parsed.data;

    if (!mongoose.isValidObjectId(engagementId)) {
      return NextResponse.json(
        { error: 'Invalid engagement ID.', code: 'VALIDATION_FAILED' },
        { status: 400 }
      );
    }

    await connectDB();

    const studentId = session!.user.id;
    const { default: ProjectEngagement } = await import('@/lib/models/ProjectEngagement.model');

    const raw = await ProjectEngagement.findOne({
      _id: engagementId,
      studentId,
      status: { $in: ACTIVE_STATUSES },
    } as object).lean();

    if (!raw) {
      throw new AppError('Active engagement not found.', 404, 'DB_NOT_FOUND');
    }

    const engagement = raw as unknown as ProjectEngagementDoc;
    const briefTitle = (engagement.brief as { title?: string } | null)?.title ?? 'your current project';

    const { default: MentorSession } = await import('@/lib/models/MentorSession.model');

    let mentorSession = await MentorSession.findOne({ studentId, engagementId } as object);

    const ttlMs = MENTOR_SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;

    if (!mentorSession) {
      mentorSession = await MentorSession.create({
        studentId,
        engagementId,
        messages: [],
        lastActivityAt: new Date(),
        expiresAt: new Date(Date.now() + ttlMs),
      });
    }

    // Rate limit: count user messages in the current 10-minute window
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
    const recentUserMsgCount = mentorSession.messages.filter(
      (m) => m.role === 'user' && m.timestamp != null && (m.timestamp as Date) > windowStart
    ).length;

    if (recentUserMsgCount >= MENTOR_RATE_LIMIT) {
      throw new AppError(
        'Rate limit reached: maximum 10 messages per 10 minutes.',
        429,
        'RATE_LIMIT_EXCEEDED'
      );
    }

    // Append user message before building Groq context
    mentorSession.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date(),
      autoLogged: true,
    });

    // Build Groq messages: system prompt + last 20 messages from session
    const systemPrompt = `You are an AI mentor for a ${engagement.tier} computer science student in Kenya working on "${briefTitle}".
Your role is to guide without writing code for the student directly.
Ask Socratic questions, explain concepts, and encourage independent problem-solving.
Keep responses concise and grounded in East African tech constraints (mobile-first, M-Pesa, intermittent connectivity).`;

    const groqMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...mentorSession.messages.slice(-20).map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    let assistantContent = MENTOR_FALLBACK;

    try {
      const groqRes = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env('GROQ_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model: GROQ_MODEL, messages: groqMessages, max_tokens: 500, temperature: 0.7 }),
      });

      if (groqRes.ok) {
        const data = (await groqRes.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        assistantContent = data.choices?.[0]?.message?.content ?? MENTOR_FALLBACK;
      } else {
        logger.warn('mentor/chat', 'Groq returned non-200', { status: groqRes.status, studentId });
      }
    } catch (fetchError) {
      logger.warn('mentor/chat', 'Groq fetch failed — returning fallback', { studentId, error: fetchError });
    }

    mentorSession.messages.push({
      role: 'assistant',
      content: assistantContent,
      timestamp: new Date(),
      autoLogged: true,
    });

    mentorSession.lastActivityAt = new Date();
    mentorSession.expiresAt = new Date(Date.now() + ttlMs);
    await mentorSession.save();

    logger.info('mentor/chat', 'Mentor message sent', {
      studentId,
      engagementId,
      sessionId: String(mentorSession._id),
    });

    return NextResponse.json({
      data: {
        response: assistantContent,
        sessionId: String(mentorSession._id),
        messageCount: mentorSession.messages.length,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
