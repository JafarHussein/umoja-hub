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

export interface Turn {
  role: 'user' | 'assistant';
  content: string;
}

// Farm Assistant conversations. The live route answers with Groq; these are the
// transcripts of past conversations, so they are authored to sound like the same
// assistant — practical, county-aware, and never promising more than it knows.
const FARM_CONVERSATIONS: Turn[][] = [
  [
    { role: 'user', content: 'My tomato leaves are curling upwards and turning purple underneath. What is wrong?' },
    {
      role: 'assistant',
      content:
        'Upward leaf curl with purpling on the underside most often points to Tomato Yellow Leaf Curl Virus, spread by whiteflies. Check the underside of the leaves for tiny white insects.\n\nWhat to do now:\n1. Remove and burn badly affected plants — the virus has no cure once a plant is infected.\n2. Control the whiteflies on the remaining crop with yellow sticky traps and an approved insecticide from a PCPB-registered agrovet.\n3. For the next season, buy TYLCV-tolerant varieties and avoid planting next to an old tomato field.\n\nIf the curling is downward instead, and the plant is otherwise green, it is more likely heat or water stress and not the virus.',
    },
    { role: 'user', content: 'Where can I get the tolerant seed?' },
    {
      role: 'assistant',
      content:
        'Check the Verified Suppliers directory here on UmojaHub — Kenya Seed Company and Amiran Kenya both stock TYLCV-tolerant tomato varieties and are KEBS-registered. Always ask for the certification label on the packet, and keep the receipt.',
    },
  ],
  [
    { role: 'user', content: 'Is this a good time to plant maize in Uasin Gishu?' },
    {
      role: 'assistant',
      content:
        'For Uasin Gishu the long rains window is the main maize season, and planting is best done as soon as the soil has taken enough rain to be workable to about 10 cm depth — planting into dry soil to "beat the rains" is the most common cause of poor germination.\n\nBefore you plant:\n- Use a certified variety suited to the high-altitude zone (H614D and H628 are common there).\n- Apply DAP or a phosphate blend at planting, then top-dress with CAN when the crop is knee-high.\n- Verify the fertilizer is genuine before you buy — there is a guide on this in the Knowledge Hub.\n\nCheck your local forecast before committing; I do not have live weather for your exact location in this conversation.',
    },
  ],
  [
    { role: 'user', content: 'The price of potatoes has dropped. Should I sell now or wait?' },
    {
      role: 'assistant',
      content:
        'That depends on your storage more than on the price. Potatoes lose weight and quality in store, so holding only pays if the price rise beats your losses.\n\nA practical way to decide:\n- If you have a cool, dark, ventilated store and the crop is well cured, holding a few weeks through the glut is often worth it.\n- If you are storing in the open or in sacks in the sun, sell now — you will lose more to rot and greening than you gain on price.\n\nUse the Price Intelligence page for your county to see whether the drop is a short glut or a longer trend, and set a Price Alert at the figure you would be happy to sell at.',
    },
  ],
  [
    { role: 'user', content: 'My dairy cow has reduced milk suddenly. She is eating normally.' },
    {
      role: 'assistant',
      content:
        'A sudden drop with normal appetite most often means mastitis, heat stress, or a change in water access.\n\nCheck first:\n1. Strip a little milk from each quarter onto a dark surface — clots, flakes or watery milk mean mastitis, and you should call your vet rather than treat blindly.\n2. Feel the udder for heat, swelling or pain.\n3. Confirm she has had constant clean water. A cow that goes even a few hours short will drop noticeably.\n\nIf the milk looks normal and water is fine, look at whether the feed changed — a switch of forage or a lower-quality batch will show up in the bucket within a day or two.',
    },
  ],
];

// AI Mentor conversations. The mentor coaches process; it deliberately does not
// hand over solutions, which is the behaviour the Education Hub is built around.
const MENTOR_CONVERSATIONS: Turn[][] = [
  [
    { role: 'user', content: 'I am stuck on the M-Pesa callback. It never arrives in the sandbox.' },
    {
      role: 'assistant',
      content:
        'Before we look at code — how are you currently confirming that the callback never arrives, as opposed to arriving and failing silently?\n\nThat distinction changes the fix entirely. If you have not yet logged every inbound request at the very edge of your handler, do that first. Many "missing callback" problems turn out to be a callback that arrived and threw before anything was written down.\n\nOnce you know which one it is, come back and tell me what the log shows.',
    },
    { role: 'user', content: 'I added the log. Nothing arrives at all.' },
    {
      role: 'assistant',
      content:
        'Good — that is a real finding, and worth writing into your blocker log with the time it cost you.\n\nNow reason about it from the outside in: the callback is an inbound HTTP request from Safaricom to a URL you gave them. Which of those three things can you actually verify right now — that the URL is reachable from the public internet, that it is the URL you registered, and that it is HTTPS?\n\nCheck them in that order. Do not change your handler code until one of them fails.',
    },
  ],
  [
    { role: 'user', content: 'Can you write the sync queue for me? I am running out of time.' },
    {
      role: 'assistant',
      content:
        'I am not going to write it for you — and not to be difficult. The sync queue is the part of this project your lecturer will look at hardest, and a version you did not reason through will not survive the review questions.\n\nWhat I will do is help you scope it down. You do not need a general-purpose queue. You need the smallest thing that survives one specific failure: the app goes offline mid-write and comes back.\n\nStart there. Write down what a single queued item has to contain for that one case, and show me your list.',
    },
  ],
  [
    { role: 'user', content: 'How do I know if my problem breakdown is good enough to submit?' },
    {
      role: 'assistant',
      content:
        'Read it back and ask one question: could someone who has never met your client rebuild your understanding of the problem from this alone?\n\nA strong breakdown usually names who is hurt by the current process, what it costs them, and which constraint makes the obvious solution fail. A weak one describes the software you want to build.\n\nIf yours is mostly about the software, you are describing a solution, not a problem. Rewrite the first paragraph without naming any technology at all and see what is left.',
    },
  ],
];

export function farmConversation(rng: Rng): Turn[] {
  return rng.pick(FARM_CONVERSATIONS);
}

export function mentorConversation(rng: Rng): Turn[] {
  return rng.pick(MENTOR_CONVERSATIONS);
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
