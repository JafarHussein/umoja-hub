// Believable text-content generators for the education hub. Hand-authored,
// Kenyan-context, no live AI — engagements are created directly so we supply the
// brief and process documents the OpenAI route would otherwise generate.

import { Rng } from './rng';

export function aiBrief(rng: Rng, title: string, tier: string): Record<string, unknown> {
  return {
    title,
    tier,
    clientPersona: rng.pick([
      'A Nairobi-based agribusiness coordinating smallholder supply',
      'A county health office digitising clinic operations',
      'A SACCO serving boda-boda riders',
      'A rural agrodealer struggling with paper stock records',
    ]),
    problemStatement: `Design and build a working solution for: ${title}. The client needs something usable on low-end Android phones and patchy connectivity.`,
    constraints: [
      'Must work on intermittent 3G connectivity',
      'M-Pesa is the only viable payment rail',
      'Users have low digital literacy',
    ],
    deliverables: [
      'A deployed, working prototype',
      'A short architecture write-up',
      'A reflection on trade-offs made',
    ],
  };
}

export function problemBreakdown(title: string): string {
  return `The core problem behind "${title}" is that the current process is manual, error-prone, and invisible to the people who depend on it. I broke it into three parts: capturing data reliably at the source, storing it so it survives a lost connection, and surfacing it to the right person at the right time. The hardest constraint is connectivity — anything I build has to assume the network will drop mid-task and recover gracefully without losing the user's work.`;
}

export function approachPlan(stack: string[]): string {
  return `My plan is to build the client with ${stack.slice(0, 2).join(' and ')} for an offline-first experience, syncing to a ${stack.includes('PostgreSQL') ? 'PostgreSQL' : 'document'} store when the connection returns. I will start with the data model and the sync queue, because that is the riskiest part, then layer the screens on top. I will validate every assumption with a small end-to-end slice before building breadth, so I always have something working to fall back on.`;
}

export function finalReflection(title: string): string {
  return `Building "${title}" taught me that the real engineering is in the edge cases, not the happy path. My first design assumed a stable connection and fell apart in testing; rebuilding around an offline queue took longer but made the result genuinely usable. If I did it again I would write the sync tests first. The biggest lesson was to keep a working version at every step instead of chasing a perfect one.`;
}

export function blockerEntry(rng: Rng): Record<string, unknown> {
  return {
    stuckOn: rng.pick([
      'M-Pesa STK push callback never arriving in the sandbox',
      'Offline sync producing duplicate records on reconnect',
      'State resetting on every re-render',
      'CORS errors when calling the API from the mobile client',
    ]),
    resolution: rng.pick([
      'Added an idempotency key keyed on a client-generated id',
      'Moved the fetch into a useEffect with a stable dependency',
      'Configured the allowed origins on the server',
      'Polled a status endpoint as a fallback to the callback',
    ]),
    durationHours: rng.int(1, 6),
  };
}

export function aiUsageEntry(rng: Rng): Record<string, unknown> {
  return {
    toolUsed: rng.pick(['ChatGPT', 'GitHub Copilot', 'Claude']),
    prompt: rng.pick([
      'How do I structure an offline-first sync queue?',
      'Explain idempotency for payment callbacks',
      'Review this React state bug',
    ]),
    outputReceived: 'A high-level pattern and example snippet.',
    studentAction: rng.pick([
      'Adapted the pattern but wrote the implementation myself',
      'Used it to understand the concept, then rebuilt from docs',
      'Rejected the snippet — it did not fit my data model',
    ]),
    source: 'self-reported',
  };
}

// Lecturer review comments — substantive per dimension.
export function lecturerComment(rng: Rng, dimension: string, positive: boolean): string {
  const good: Record<string, string> = {
    problemUnderstanding:
      'The student clearly grasped the real constraint — connectivity — and framed the whole solution around it rather than treating it as an afterthought.',
    solutionQuality:
      'The implementation is clean and the offline sync actually works under the failure cases I tried. Sensible data model and good separation of concerns.',
    processQuality:
      'The blocker log shows genuine iteration: stuck, diagnosed, resolved, with honest time costs. This is exactly the engineering process we want to see.',
    aiUsage:
      'AI use was disclosed and critical — the student adapted suggestions rather than pasting them, and rejected one that did not fit. Healthy and honest.',
  };
  const weak: Record<string, string> = {
    problemUnderstanding:
      'The problem framing is a little thin and skips over why the manual process fails today. More grounding in the client context would strengthen it.',
    solutionQuality:
      'The solution works for the happy path but the offline edge cases are not fully handled. A couple of states can still lose data on reconnect.',
    processQuality:
      'The process documentation is sparse — the blocker log has only one entry and the reflection is brief. More evidence of iteration would help.',
    aiUsage:
      'AI usage is disclosed but the student leaned on generated code without much adaptation in places. I would like to see more independent reasoning.',
  };
  return (positive ? good : weak)[dimension] ?? 'Reviewed.';
}

export function peerComment(rng: Rng, positive: boolean): string {
  return positive
    ? rng.pick([
        'Clean code and a clear README — I could follow the structure easily and run it locally without trouble.',
        'Solid work. The commit history tells a story and the documentation explains the trade-offs well.',
      ])
    : rng.pick([
        'The idea is good but the setup steps were unclear and I hit an error following the README.',
        'Functional, but the code could use more comments and the structure is a bit hard to navigate.',
      ]);
}
