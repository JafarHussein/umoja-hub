/**
 * Groq AI service for the Farm Assistant.
 * Uses Llama 3 (llama3-8b-8192) via the Groq OpenAI-compatible API.
 * Uses plain fetch — consistent with darajaService.ts pattern.
 * Gracefully degrades on any failure.
 */

import { env } from '@/lib/env';
import { logger } from '@/lib/utils';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User.model';
import ChatSession from '@/lib/models/ChatSession.model';
import { buildAssistantSystemPrompt } from '@/lib/foodhub/assistantPrompt';
import { getCountyForecast } from '@/lib/integrations/weatherService';
import { CHAT_SESSION_TTL_DAYS, Role } from '@/types';
import type { WeatherContext } from '@/lib/foodhub/assistantPrompt';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama3-8b-8192';
const FALLBACK_RESPONSE =
  "I'm having trouble connecting right now. Please try again in a moment. In the meantime, you can visit Wakulima Market or contact your local KEBS office for guidance.";

interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GroqApiResponse {
  choices?: Array<{
    message?: { content?: string };
  }>;
}

export interface FarmAssistantResult {
  response: string;
  sessionId: string;
  weatherContext: WeatherContext | null;
}

export async function farmAssistantChat(
  userMessage: string,
  farmerId: string,
  existingSessionId?: string
): Promise<FarmAssistantResult> {
  await connectDB();

  let sessionId = existingSessionId ?? '';
  let weatherContext: WeatherContext | null = null;

  try {
    // Fetch farmer profile
    const farmer = await User.findById(farmerId).select(
      'firstName lastName county farmerData.cropsGrown farmerData.livestockKept farmerData.primaryLanguage phoneNumber role'
    );

    if (!farmer || farmer.role !== Role.FARMER) {
      logger.warn('groqService', 'Farmer not found for assistant chat', { farmerId });
      return { response: FALLBACK_RESPONSE, sessionId, weatherContext: null };
    }

    // Fetch weather — non-blocking; null on failure
    weatherContext = await getCountyForecast(farmer.county ?? 'Nairobi');

    // Build or load ChatSession
    const ttlMs = CHAT_SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;
    let session = existingSessionId
      ? await ChatSession.findOne({ _id: existingSessionId })
      : null;

    if (!session) {
      session = await ChatSession.create({
        farmerId,
        messages: [],
        weatherContextUsed: weatherContext !== null,
        lastActivityAt: new Date(),
        expiresAt: new Date(Date.now() + ttlMs),
      });
    }

    sessionId = String(session._id);

    // Append farmer's message to session
    session.messages.push({ role: 'user', content: userMessage });

    // Build messages for Groq API
    const systemPrompt = buildAssistantSystemPrompt(
      {
        firstName: farmer.firstName,
        lastName: farmer.lastName,
        county: farmer.county ?? 'Kenya',
        farmerData: {
          cropsGrown: farmer.farmerData?.cropsGrown ?? [],
          livestockKept: farmer.farmerData?.livestockKept ?? [],
          ...(farmer.farmerData?.primaryLanguage !== undefined && {
            primaryLanguage: farmer.farmerData.primaryLanguage,
          }),
        },
      },
      weatherContext
    );

    const groqMessages: GroqMessage[] = [
      { role: 'system', content: systemPrompt },
      ...session.messages
        .slice(-20) // keep last 20 messages for context window
        .map((m: { role: string; content: string }) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
    ];

    // Call Groq API
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
        max_tokens: 400,
        temperature: 0.7,
      }),
    });

    if (!groqRes.ok) {
      const errorBody: unknown = await groqRes.text();
      logger.error('groqService', 'Groq API returned non-200', {
        status: groqRes.status,
        farmerId,
        error: errorBody,
      });
      // Graceful degradation — save the session but return fallback
      await session.save();
      return { response: FALLBACK_RESPONSE, sessionId, weatherContext };
    }

    const groqData = (await groqRes.json()) as GroqApiResponse;
    const assistantContent = groqData.choices?.[0]?.message?.content ?? FALLBACK_RESPONSE;

    // Append assistant response to session
    session.messages.push({ role: 'assistant', content: assistantContent });
    session.lastActivityAt = new Date();
    session.weatherContextUsed = weatherContext !== null;
    session.expiresAt = new Date(Date.now() + ttlMs);
    await session.save();

    return { response: assistantContent, sessionId, weatherContext };
  } catch (error) {
    logger.error('groqService', 'Unexpected error in farmAssistantChat', { farmerId, error });
    return { response: FALLBACK_RESPONSE, sessionId, weatherContext };
  }
}
