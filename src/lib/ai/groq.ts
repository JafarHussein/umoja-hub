// ---------------------------------------------------------------------------
// Groq endpoint and model — the one definition, and configurable.
//
// `llama-3.3-70b-versatile` was hard-coded here and duplicated verbatim in the
// AI mentor route. Groq stopped serving it to this account and began answering
// `404 model_not_found`, which took out the Farm Assistant *and* the AI Mentor
// at once. Neither failed loudly: both degrade to a fallback sentence, so
// 1,513 unit tests, a full E2E run and a green build all passed while every
// question either feature was asked went unanswered.
//
// Two things follow, and both are why this module exists:
//
//   1. **One definition.** Two copies of a string cannot drift onto different
//      models, and a model change is one edit rather than two.
//   2. **Configuration, not code.** A provider retiring a model is an
//      operational event. `GROQ_MODEL` overrides the default with no deploy. It
//      is deliberately NOT in the required-env list — a missing value is a
//      working default, never a startup failure.
//
// This module holds no dependencies on purpose. `groqService` imports Mongoose
// models at module scope, so a route that only needs these two strings must not
// have to import it and drag model registration into its cold start.
//
// The default is chosen from what the account actually serves, verified against
// `GET /openai/v1/models` rather than assumed.
// ---------------------------------------------------------------------------

export const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export const GROQ_MODEL = process.env['GROQ_MODEL']?.trim() || 'openai/gpt-oss-120b';
