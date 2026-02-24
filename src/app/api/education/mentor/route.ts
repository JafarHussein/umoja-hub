/**
 * POST /api/education/mentor
 * Auth: STUDENT
 * AI Mentor chat via Groq (llama3). Socratic mode — refuses to write code.
 * Auto-logs every exchange to ProjectEngagement.documents.aiUsageLog.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { connectDB } from '@/lib/db';
import ProjectEngagement from '@/lib/models/ProjectEngagement.model';
import MentorSession from '@/lib/models/MentorSession.model';
import { buildMentorSystemPrompt } from '@/lib/educationhub/mentorPrompt';
import { AppError, handleApiError, requireRole, logger } from '@/lib/utils';
import { env } from '@/lib/env';
import { Role, ProjectStatus, MENTOR_SESSION_TTL_DAYS } from '@/types';
import { z } from 'zod';

const mentorMessageSchema = z.object({
  engagementId: z.string().min(1, 'engagementId is required'),
  message: z.string().trim().min(1, 'Message is required').max(2000, 'Message too long'),
  sessionId: z.string().optional(),
});

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama3-8b-8192';
const FALLBACK_RESPONSE =
  "I'm having trouble connecting right now. Please try again in a moment. In the meantime, try breaking the problem into smaller parts and thinking about which piece you can tackle first.";

interface GroqApiResponse {
  choices?: Array<{
    message?: { content?: string };
  }>;
}

interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    requireRole(session, Role.STUDENT);

    const body: unknown = await req.json();
    const parsed = mentorMessageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', code: 'VALIDATION_FAILED', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { engagementId, message, sessionId } = parsed.data;

    await connectDB();

    // Load engagement — must belong to this student and be active
    const engagement = await ProjectEngagement.findOne({
      _id: engagementId,
      studentId: session!.user.id,
    }).lean();

    if (!engagement) {
      throw new AppError('Project engagement not found', 404, 'DB_NOT_FOUND');
    }

    const activeStatuses = [
      ProjectStatus.IN_PROGRESS,
      ProjectStatus.UNDER_PEER_REVIEW,
      ProjectStatus.REVISION_REQUIRED,
    ];

    if (!activeStatuses.includes(engagement.status as ProjectStatus)) {
      throw new AppError('AI Mentor is only available for active projects', 403, 'AUTH_FORBIDDEN');
    }

    // Build or load MentorSession
    const ttlMs = MENTOR_SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;
    let mentorSession = sessionId
      ? await MentorSession.findOne({ _id: sessionId, studentId: session!.user.id })
      : null;

    if (!mentorSession) {
      mentorSession = await MentorSession.create({
        studentId: session!.user.id,
        engagementId,
        messages: [],
        lastActivityAt: new Date(),
        expiresAt: new Date(Date.now() + ttlMs),
      });
    }

    // Build Groq messages
    const briefData = engagement.brief as
      | { projectTitle?: string; problemStatement?: string; kenyanConstraints?: string[]; outOfScope?: string[] }
      | undefined;
    const systemPrompt = buildMentorSystemPrompt({
      studentId: session!.user.id,
      track: engagement.track,
      tier: engagement.tier,
      ...(briefData ? { brief: briefData } : {}),
      ...(engagement.githubRepoName ? { githubRepoName: engagement.githubRepoName } : {}),
    });

    const historyMessages = mentorSession.messages
      .slice(-20)
      .map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    const groqMessages: GroqMessage[] = [
      { role: 'system', content: systemPrompt },
      ...historyMessages,
      { role: 'user', content: message },
    ];

    // Call Groq
    let assistantContent = FALLBACK_RESPONSE;
    try {
      const apiKey = env('GROQ_API_KEY');
      const groqRes = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: groqMessages,
          max_tokens: 300,
          temperature: 0.7,
        }),
      });

      if (groqRes.ok) {
        const groqData = (await groqRes.json()) as GroqApiResponse;
        assistantContent =
          groqData.choices?.[0]?.message?.content ?? FALLBACK_RESPONSE;
      } else {
        const errText = await groqRes.text();
        logger.error('education/mentor', 'Groq API non-200', {
          status: groqRes.status,
          error: errText,
        });
      }
    } catch (groqError) {
      logger.error('education/mentor', 'Groq API call failed', { error: groqError });
    }

    // Persist messages to session
    mentorSession.messages.push({ role: 'user', content: message });
    mentorSession.messages.push({ role: 'assistant', content: assistantContent });
    mentorSession.lastActivityAt = new Date();
    mentorSession.expiresAt = new Date(Date.now() + ttlMs);
    await mentorSession.save();

    // Auto-log to ProjectEngagement.documents.aiUsageLog
    const autoLogEntry = {
      toolUsed: 'AI Mentor (UmojaHub)',
      prompt: message,
      outputReceived: assistantContent,
      studentAction: 'Response received — student action pending',
      loggedAt: new Date(),
      source: 'AI_MENTOR',
    };

    await ProjectEngagement.updateOne(
      { _id: engagementId },
      { $push: { 'documents.aiUsageLog': autoLogEntry } }
    );

    logger.info('education/mentor', 'Mentor exchange complete', {
      engagementId,
      sessionId: String(mentorSession._id),
    });

    return NextResponse.json({
      data: {
        response: assistantContent,
        sessionId: String(mentorSession._id),
        autoLoggedToAIUsage: true,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
