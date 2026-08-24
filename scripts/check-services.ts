// ---------------------------------------------------------------------------
// scripts/check-services.ts — ask every external service whether it still works.
//
//   npm run check:services
//
// Why this exists
// ---------------
// On 2026-08-23 an audit found three dead features that every gate had missed:
// Groq had stopped serving the model both AI features named, and the OpenAI
// account's credit balance had run out, so brief generation returned 503 for
// two of the Education Hub's three project tracks. Type-check, lint, 1,513 unit
// tests, 55 E2E tests, 73 demo checks and a green production build all passed
// throughout, because every one of them mocks the provider. They were testing
// our code, and our code was right — the world had changed underneath it.
//
// This script tests the world. It is deliberately NOT part of CI: CI holds
// placeholder credentials on purpose, so running it there would fail for a
// reason that says nothing about the product. Run it before a presentation,
// after a deploy, and whenever something AI-shaped is answering oddly.
//
// Nothing here has a side effect anyone would see. No SMS is sent, no email is
// sent, no payment is initiated, nothing is written to a database. The two
// language-model checks spend a handful of tokens asking for the word "ok",
// because the only honest way to know a model still answers is to ask it.
// ---------------------------------------------------------------------------

import { loadEnvConfig } from '@next/env';
import { getSimulationConfig, SIMULATION_PROFILES } from '../src/lib/payments/simulationConfig';
import { SimulatedOutcome } from '../src/types';

loadEnvConfig(process.cwd());

type Verdict = 'ok' | 'degraded' | 'failed';

interface Result {
  service: string;
  verdict: Verdict;
  detail: string;
}

/** `degraded` is a real answer: configured, reachable, and not what you want. */
const results: Result[] = [];

function record(service: string, verdict: Verdict, detail: string): void {
  results.push({ service, verdict, detail });
}

function short(text: string, max = 140): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  return flat.length > max ? `${flat.slice(0, max)}…` : flat;
}

async function checkMongo(): Promise<void> {
  const uri = process.env['MONGODB_URI'];
  if (!uri) return record('MongoDB', 'failed', 'MONGODB_URI is not set');
  try {
    const mongoose = (await import('mongoose')).default;
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    const db = mongoose.connection.db;
    const name = db?.databaseName ?? '(unknown)';
    await db?.command({ ping: 1 });
    await mongoose.disconnect();
    // `test` is Mongoose's default when the URI names no database. It works,
    // and it is worth seeing rather than discovering during an incident.
    record(
      'MongoDB',
      name === 'test' ? 'degraded' : 'ok',
      name === 'test' ? 'connected, but the URI names no database (using "test")' : `connected to "${name}"`
    );
  } catch (error) {
    record('MongoDB', 'failed', short(String(error)));
  }
}

async function checkCloudinary(): Promise<void> {
  const cloud = process.env['CLOUDINARY_CLOUD_NAME'];
  const key = process.env['CLOUDINARY_API_KEY'];
  const secret = process.env['CLOUDINARY_API_SECRET'];
  if (!cloud || !key || !secret) return record('Cloudinary', 'failed', 'CLOUDINARY_* are not fully set');
  try {
    const auth = Buffer.from(`${key}:${secret}`).toString('base64');
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/usage`, {
      headers: { Authorization: `Basic ${auth}` },
    });
    if (!res.ok) return record('Cloudinary', 'failed', `${res.status} ${short(await res.text())}`);
    record('Cloudinary', 'ok', `account "${cloud}" reachable`);
  } catch (error) {
    record('Cloudinary', 'failed', short(String(error)));
  }
}

/**
 * Ask a chat-completions endpoint for one word.
 *
 * This is the check that matters most, and the only one that would have caught
 * the model being retired: a valid key still lists models it is no longer
 * served, so nothing short of a completion tells the truth.
 */
async function checkChatModel(
  label: string,
  url: string,
  model: string,
  apiKey: string | undefined
): Promise<void> {
  if (!apiKey) return record(label, 'failed', 'no API key configured');
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'Reply with the single word: ok' }],
        // Generous for a one-word answer, and deliberately so. A reasoning
        // model spends its internal trace out of this same budget, so a tight
        // cap returns an empty `content` and this check would report a healthy
        // model as answering with nothing. That is the exact mistake that made
        // brief generation look broken after the provider moved.
        max_tokens: 512,
      }),
    });
    const body = await res.text();
    if (!res.ok) return record(label, 'failed', `${model} → ${res.status} ${short(body)}`);
    const parsed = JSON.parse(body) as { choices?: Array<{ message?: { content?: string } }> };
    const content = parsed.choices?.[0]?.message?.content ?? '';
    if (!content.trim()) return record(label, 'degraded', `${model} answered with nothing`);
    record(label, 'ok', `${model} answered "${short(content, 40)}"`);
  } catch (error) {
    record(label, 'failed', short(String(error)));
  }
}

async function checkOpenAIModeration(): Promise<void> {
  const key = process.env['OPENAI_API_KEY'];
  if (!key) return record('OpenAI moderation', 'failed', 'OPENAI_API_KEY is not set');
  try {
    const res = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: 'A note about drying maize before storage.' }),
    });
    const body = await res.text();
    if (!res.ok) {
      // Moderation failing is not fatal — the knowledge route logs and proceeds
      // — so this is degraded rather than failed. Saying "ok" would be a lie and
      // saying "failed" would send someone hunting a blocked workflow.
      return record('OpenAI moderation', 'degraded', `${res.status} ${short(body)} (articles publish unmoderated)`);
    }
    record('OpenAI moderation', 'ok', 'moderation endpoint answered');
  } catch (error) {
    record('OpenAI moderation', 'degraded', short(String(error)));
  }
}

async function checkSmtp(): Promise<void> {
  const host = process.env['SMTP_HOST'];
  if (!host) return record('SMTP', 'degraded', 'SMTP_HOST unset — lifecycle email is a silent no-op');
  try {
    const nodemailer = (await import('nodemailer')).default;
    const transport = nodemailer.createTransport({
      host,
      port: Number(process.env['SMTP_PORT'] ?? 587),
      secure: process.env['SMTP_PORT'] === '465',
      auth: { user: process.env['SMTP_USER'], pass: process.env['SMTP_PASS'] },
    });
    await transport.verify();
    record('SMTP', 'ok', `${host} accepted the credentials`);
  } catch (error) {
    record('SMTP', 'failed', short(String(error)));
  }
}

async function checkRedis(): Promise<void> {
  const url = process.env['UPSTASH_REDIS_REST_URL'];
  const token = process.env['UPSTASH_REDIS_REST_TOKEN'];
  if (!url || !token) {
    // The rate limiter falls back to an in-process counter, which is per
    // instance and lost on restart. Working, but not the guarantee it looks like.
    return record('Upstash Redis', 'degraded', 'not configured — rate limits fall back to in-process counters');
  }
  try {
    const res = await fetch(`${url}/ping`, { headers: { Authorization: `Bearer ${token}` } });
    const body = await res.text();
    record(res.ok ? 'Upstash Redis' : 'Upstash Redis', res.ok ? 'ok' : 'failed', short(body));
  } catch (error) {
    record('Upstash Redis', 'failed', short(String(error)));
  }
}

async function checkWeather(): Promise<void> {
  const key = process.env['OPEN_WEATHER_MAP_API_KEY'];
  if (!key) return record('OpenWeatherMap', 'failed', 'OPEN_WEATHER_MAP_API_KEY is not set');
  try {
    const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=Nairobi&appid=${key}`);
    record('OpenWeatherMap', res.ok ? 'ok' : 'failed', res.ok ? 'Nairobi forecast returned' : `${res.status} ${short(await res.text())}`);
  } catch (error) {
    record('OpenWeatherMap', 'failed', short(String(error)));
  }
}

async function checkSms(): Promise<void> {
  const username = process.env['AFRICASTALKING_USERNAME'];
  const key = process.env['AFRICASTALKING_API_KEY'];
  if (!username || !key) return record("Africa's Talking", 'failed', 'AFRICASTALKING_* are not set');
  // smsService routes to the sandbox host whenever the username is `sandbox`,
  // in every environment. That is correct, and it also means no message reaches
  // a real handset — which is a thing to know, not a thing to discover.
  const sandbox = username === 'sandbox';
  const base = sandbox ? 'https://api.sandbox.africastalking.com' : 'https://api.africastalking.com';
  try {
    const res = await fetch(`${base}/version1/user?username=${username}`, {
      headers: { apiKey: key, Accept: 'application/json' },
    });
    if (!res.ok) return record("Africa's Talking", 'failed', `${res.status} ${short(await res.text())}`);
    record(
      "Africa's Talking",
      sandbox ? 'degraded' : 'ok',
      sandbox ? 'sandbox account — no SMS reaches a real handset' : 'production account reachable'
    );
  } catch (error) {
    record("Africa's Talking", 'failed', short(String(error)));
  }
}

async function checkDaraja(): Promise<void> {
  const provider = process.env['PAYMENT_PROVIDER'] ?? 'simulation';
  const key = process.env['MPESA_CONSUMER_KEY'];
  const secret = process.env['MPESA_CONSUMER_SECRET'];
  if (!key || !secret) {
    return record('Daraja (M-Pesa)', provider === 'simulation' ? 'ok' : 'failed',
      provider === 'simulation'
        ? 'no credentials, and none needed — PAYMENT_PROVIDER is simulation'
        : `PAYMENT_PROVIDER=${provider} but MPESA_* are not set`);
  }
  const host = provider === 'daraja-production' ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke';
  try {
    const auth = Buffer.from(`${key}:${secret}`).toString('base64');
    const res = await fetch(`${host}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: { Authorization: `Basic ${auth}` },
    });
    if (!res.ok) return record('Daraja (M-Pesa)', 'failed', `${res.status} ${short(await res.text())}`);
    record(
      'Daraja (M-Pesa)',
      provider === 'simulation' ? 'degraded' : 'ok',
      provider === 'simulation'
        ? 'credentials valid, but PAYMENT_PROVIDER is simulation — the custody leg is simulated by design'
        : `credentials valid against ${host}`
    );
  } catch (error) {
    record('Daraja (M-Pesa)', 'failed', short(String(error)));
  }
}

/**
 * Not a service — the setting that decides whether a live payment works.
 *
 * This is reported here because this script is the documented thing to run
 * before a demonstration, and because the alternative is what actually
 * happened: the profile governing every interactive payment was undocumented,
 * defaulted to a ~30% failure rate, and was found only after two payments
 * failed in a row during a readiness audit. A setting that can embarrass you
 * in front of an audience should be visible in the check you already run.
 */
function checkSimulationProfile(): void {
  const provider = (process.env['PAYMENT_PROVIDER'] ?? 'simulation').toLowerCase();
  if (provider !== 'simulation') {
    return record('Payment simulation', 'ok', `not in use — PAYMENT_PROVIDER is ${provider}`);
  }

  const config = getSimulationConfig();
  const raw = process.env['SIMULATION_PROFILE']?.trim();
  const source = raw && raw in SIMULATION_PROFILES ? 'set explicitly' : 'default';
  const succeedsAlways = config.outcomeWeights[SimulatedOutcome.SUCCESS] > 0 &&
    Object.entries(config.outcomeWeights)
      .filter(([outcome]) => outcome !== SimulatedOutcome.SUCCESS)
      .every(([, weight]) => weight === 0);
  const instant = config.delayBuckets.every((b) => b.seconds === 0);

  if (succeedsAlways && instant) {
    return record('Payment simulation', 'ok', `profile ${config.profile} (${source}) — every payment succeeds at once`);
  }

  const failureWeight = Object.entries(config.outcomeWeights)
    .filter(([outcome]) => outcome !== SimulatedOutcome.SUCCESS)
    .reduce((sum, [, weight]) => sum + weight, 0);
  const total = failureWeight + config.outcomeWeights[SimulatedOutcome.SUCCESS];
  const failPct = total > 0 ? Math.round((failureWeight / total) * 100) : 0;
  const slowest = Math.max(...config.delayBuckets.map((b) => b.seconds));

  record(
    'Payment simulation',
    'degraded',
    `profile ${config.profile} (${source}) — about ${failPct}% of payments fail` +
      (slowest > 0 ? `, and some take up to ${slowest}s` : '') +
      '. Set SIMULATION_PROFILE=HAPPY_PATH before demonstrating.'
  );
}

async function main(): Promise<void> {
  const groqKey = process.env['GROQ_API_KEY'];
  const groqModel = process.env['GROQ_MODEL']?.trim() || 'openai/gpt-oss-120b';
  const groqUrl = 'https://api.groq.com/openai/v1/chat/completions';
  const briefUrl = process.env['BRIEF_API_URL']?.trim() || groqUrl;
  const briefModel = process.env['BRIEF_MODEL']?.trim() || groqModel;
  const briefKeyVar = process.env['BRIEF_API_KEY_VAR']?.trim() || 'GROQ_API_KEY';

  await Promise.all([
    checkMongo(),
    checkCloudinary(),
    checkChatModel('Groq (assistant + mentor)', groqUrl, groqModel, groqKey),
    checkChatModel('Brief generation', briefUrl, briefModel, process.env[briefKeyVar]),
    checkOpenAIModeration(),
    checkSmtp(),
    checkRedis(),
    checkWeather(),
    checkSms(),
    checkDaraja(),
  ]);

  checkSimulationProfile();

  const glyph: Record<Verdict, string> = { ok: 'OK  ', degraded: 'WARN', failed: 'FAIL' };
  const width = Math.max(...results.map((r) => r.service.length));

  // eslint-disable-next-line no-console
  console.log('\nExternal services\n');
  for (const r of results.sort((a, b) => a.service.localeCompare(b.service))) {
    // eslint-disable-next-line no-console
    console.log(`  ${glyph[r.verdict]}  ${r.service.padEnd(width)}  ${r.detail}`);
  }

  const failed = results.filter((r) => r.verdict === 'failed');
  const degraded = results.filter((r) => r.verdict === 'degraded');
  // eslint-disable-next-line no-console
  console.log(
    `\n${results.length - failed.length - degraded.length} healthy · ${degraded.length} degraded · ${failed.length} failed\n`
  );

  // Only a failure is worth an exit code. A degraded service is usually a
  // deliberate posture (the payment simulator, the SMS sandbox) and failing on
  // it would train everyone to ignore the script.
  process.exit(failed.length > 0 ? 1 : 0);
}

void main();
