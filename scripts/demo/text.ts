// Believable text-content generators for the education hub. Hand-authored,
// Kenyan-context, no live AI — engagements are created directly so we supply the
// brief and process documents the OpenAI route would otherwise generate.

import { Rng } from './rng';
import type { SeedCrop } from './dictionaries';
import { KNOWLEDGE_AREAS, isKnowledgeArea } from '../../src/lib/education/knowledgeAreas';

// ---------------------------------------------------------------------------
// Listing descriptions
//
// The five interpolated templates this replaced produced eight near-identical
// listings each across a full run, and read like a form letter: "Fresh {crop}
// harvested this week from my farm in {county}." Scrolling the feed, the repeat
// was the first thing you noticed.
//
// A description is assembled instead from four independent slots — what was
// harvested and when, how it was prepared and packed, how collection works, and
// who the farmer wants to hear from. The middle slot is built from the crop's
// own `preparation` and `packaging` wording, so a bag crop talks about bags and
// milk talks about the morning milking. Farmers also do not write in tidy
// prose: some sentences are clipped, some mention the school fees, and none of
// them advertise. The combinations run to the thousands, so no two listings in
// a run collide.
// ---------------------------------------------------------------------------

const HARVEST_OPENERS: readonly string[] = [
  'Harvested this week and the crop has done well.',
  'Just finished harvesting and I have more than my usual buyers can take.',
  'This is from the block I planted in good time, so it came out clean.',
  'Fresh off the farm — I only cut what I can move.',
  'The season has been kind and I have a good quantity ready.',
  'I have stock ready now and would rather move it than hold it.',
];

const DAIRY_OPENERS: readonly string[] = [
  'Milk from the morning milking, available every day.',
  'I am producing more than the cooperative is taking at the moment.',
  'Daily supply from my own herd — same quantity every morning.',
  'Looking for a steady buyer rather than selling day to day.',
];

const LOGISTICS: readonly string[] = [
  'Pickup is easiest for me, but I can put it on a lorry going that way if you organise it.',
  'Collection at the farm. The road is passable in the dry and I can meet you at the tarmac if it has rained.',
  'I can arrange transport for a full load. Anything smaller and you will need to collect.',
  'Buyers usually collect. Call the day before so I have it ready and weighed.',
  'I deliver within town myself. Further than that, we agree on transport separately.',
  'Collection from the farm or the nearest market day, whichever suits you.',
];

const CLOSERS: readonly string[] = [
  'Serious buyers only please — I have had people ask and then disappear.',
  'Price is negotiable if you are taking the lot.',
  'I would rather sell to someone who will come back next season.',
  'Ask me anything about it before you commit. I will tell you straight.',
  'First come first served, and it does not usually last long.',
  'Happy to send more photos if you want to see it before travelling.',
  'I have supplied buyers on here before and they can vouch for the quality.',
];

/**
 * A listing description in the farmer's own voice, grounded in the crop's real
 * packaging and the county it was grown in.
 */
export function listingDescription(rng: Rng, crop: SeedCrop, county: string): string {
  const opener = crop.id === 'dairy' ? rng.pick(DAIRY_OPENERS) : rng.pick(HARVEST_OPENERS);

  const detail =
    crop.id === 'dairy'
      ? `${capitalise(crop.preparation)} and held in ${crop.packaging}.`
      : rng.pick([
          `${capitalise(crop.preparation)}, then packed in ${crop.packaging}.`,
          `It is ${crop.preparation} and goes out in ${crop.packaging}.`,
          `Packed in ${crop.packaging} — ${crop.preparation}.`,
        ]);

  const place = rng.pick([
    `Grown here in ${county}.`,
    `This is all from my own farm in ${county}.`,
    `Farm is in ${county}.`,
  ]);

  return [opener, place, detail, rng.pick(LOGISTICS), rng.pick(CLOSERS)].join(' ');
}

/**
 * Pickup wording, varied per listing rather than one repeated sentence.
 *
 * These are rendered after the UI's own "Collect from {county}." lead-in, so
 * none of them may open with the county — an earlier variant began `${county} —`
 * and produced "Collect from Kiambu. Kiambu — I load at the farm...".
 */
export function pickupDescription(rng: Rng, county: string): string {
  return rng.pick([
    `Farm gate collection in ${county}. Call when you are close and I will come to the road to direct you.`,
    `Collection point is off the main road in ${county} town. Ample space for a lorry to turn.`,
    `Pickup at my farm in ${county}. Nearest landmark is the shopping centre — I will send directions once we agree.`,
    `I load at the farm in the morning, or meet buyers at the ${county} market on market day.`,
  ]);
}

function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// Briefs are written to the ONE canonical contract in src/lib/education/brief.ts
// — the same schema the OpenAI service must satisfy and the student workspace
// renders. They disagreed before, and the cost was a workspace that crashed on
// every seeded project: the seeder wrote `clientPersona` as a string and no
// `estimatedComplexity` at all, while the page read `clientPersona.businessType`
// and called `.toLowerCase()` on the complexity. Anything added here must keep
// `aiBriefSchema.safeParse` passing; `npm run demo:validate` now checks it.
const CLIENT_PERSONAS: { businessType: string; county: string; context: string }[] = [
  {
    businessType: 'Agribusiness cooperative',
    county: 'Nakuru',
    context:
      'Coordinates deliveries from about 300 smallholder members and reconciles their payments by hand every week.',
  },
  {
    businessType: 'County health office',
    county: 'Machakos',
    context:
      'Runs eleven clinics whose stock and patient visit records are kept in paper registers at each site.',
  },
  {
    businessType: 'SACCO',
    county: 'Nairobi',
    context:
      'Serves boda-boda riders with daily loan repayments that are currently tracked in a spreadsheet.',
  },
  {
    businessType: 'Secondary school',
    county: 'Kisumu',
    context:
      'Manages fee statements, results and parent communication across 1,200 students with no central system.',
  },
  {
    businessType: 'Matatu sacco',
    county: 'Kiambu',
    context:
      'Operates 40 vehicles and cannot tell which routes are profitable without collating handwritten daily returns.',
  },
  {
    businessType: 'Agrodealer',
    county: 'Eldoret',
    context: 'Two branches whose seed and fertiliser stock is counted manually at the end of each week.',
  },
];

// What a seeded brief was written from. Mirrors the academicAnchor the live
// route records off the student's enrolment, so a seeded project and a
// generated one are the same shape and the same claim.
export interface SeedAcademicAnchor {
  programmeName: string;
  year: number;
  semester: number;
  units: string[];
  knowledgeAreas: string[];
  provenance: string;
}

// Complexity follows from where the student is in the degree. It used to follow
// from a difficulty they picked for themselves, which is the one project origin
// the Hub's premise rules out.
function complexityForYear(year: number): 'LOW' | 'MEDIUM' | 'HIGH' {
  if (year <= 1) return 'LOW';
  if (year >= 4) return 'HIGH';
  return 'MEDIUM';
}

function sentenceCase(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function aiBrief(
  rng: Rng,
  title: string,
  anchor: SeedAcademicAnchor,
  stack: string[] = [],
  interest?: string
): Record<string, unknown> {
  const persona = rng.pick(CLIENT_PERSONAS);

  // The outcomes are read out of the knowledge-area profiles rather than
  // written generically, so a seeded brief genuinely says what the student's
  // own units require of it — which is the whole claim the Hub makes.
  const leading = anchor.knowledgeAreas.filter(isKnowledgeArea).slice(0, 3);
  const learningOutcomes =
    leading.length > 0
      ? leading.map((area) => {
          const profile = KNOWLEDGE_AREAS[area];
          const capability = profile.capabilities[0] ?? 'apply the unit in a working system';
          return `${sentenceCase(capability)} — the part of ${profile.label} this project rests on.`;
        })
      : ['Build, deploy and defend one working system end to end.'];

  const primary = leading[0];
  const architecturalChallenge = primary
    ? `${sentenceCase(KNOWLEDGE_AREAS[primary].architecturalPressures[0] ?? 'a constraint the naive design cannot meet')} is what makes ${KNOWLEDGE_AREAS[primary].label} load-bearing here rather than decorative. Design around it early: ${KNOWLEDGE_AREAS[primary].antiPatterns[0] ?? 'a system that avoids the pressure'} will not pass review, however finished it looks.`
    : `The system has to keep working when the connection drops mid-operation, and that constraint has to shape the design rather than be patched on at the end.`;

  return {
    title,
    academicAnchor: anchor,
    learningOutcomes,
    architecturalChallenge,
    clientPersona: persona,
    problemStatement: `${persona.context} They need a working system for: ${title}. It has to be usable on low-end Android phones over an intermittent connection.`,
    coreRequirements: [
      'Record the core entities the client works with, with validation',
      'Authenticate users and separate what each role may see',
      'Produce the weekly summary the client currently compiles by hand',
      'Work correctly when the connection drops mid-operation',
      'Expose the data through an API the client can integrate with later',
    ],
    technicalConstraints: [
      'Must run acceptably on a low-end Android device over 3G',
      'No paid third-party service may be required to operate it',
      ...(interest ? [`Leave room for ${interest} in the part of the design that is free`] : []),
    ],
    kenyanContextConstraints: [
      'M-Pesa is the only payment rail the client and their users have',
      'Users have low digital literacy — the flow must survive being got wrong',
    ],
    deliverables: [
      'A deployed, working system',
      'A short architecture write-up covering the data model and the API',
      'A reflection on the trade-offs made',
    ],
    suggestedTechStack: stack.length > 0 ? stack : ['Node.js', 'MongoDB', 'React'],
    estimatedComplexity: complexityForYear(anchor.year),
  };
}

export function openSourceBrief(
  repoUrl: string,
  repoName: string,
  anchor: SeedAcademicAnchor
): Record<string, unknown> {
  return {
    title: `Contribute to ${repoName}`,
    academicAnchor: anchor,
    repoUrl,
    repoName,
    contributionGoal: `Land a reviewed change in ${repoName} — a bug fix or a small feature that the maintainers accept.`,
    proposedApproach: `Read the contributing guide and reproduce an open issue locally before changing anything. Work on a branch, keep the change small enough to review, and open a pull request that explains the problem and the reasoning behind the fix.`,
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

/**
 * The brief stored on an engagement that started from a lecturer's own project.
 *
 * Mirrors `assignmentToBrief` in the app, deliberately: a seeded lecturer
 * project and a real one must be the same record, or the demonstration is of
 * something that does not exist.
 */
export function assignedBrief(
  assignment: {
    _id: unknown;
    title: string;
    problemStatement: string;
    coreRequirements: string[];
    deliverables?: string[];
    technicalConstraints?: string[];
    knowledgeAreas: string[];
  },
  anchor: SeedAcademicAnchor,
  setBy: string
): Record<string, unknown> {
  const areas = assignment.knowledgeAreas.filter(isKnowledgeArea);
  return {
    title: assignment.title,
    academicAnchor: anchor,
    assignmentId: String(assignment._id),
    setBy,
    problemStatement: assignment.problemStatement,
    coreRequirements: assignment.coreRequirements,
    technicalConstraints: assignment.technicalConstraints ?? [],
    deliverables: assignment.deliverables ?? [],
    exercises:
      areas.length > 0
        ? areas.map((a) => KNOWLEDGE_AREAS[a].label)
        : ['Engineering judgement'],
  };
}
