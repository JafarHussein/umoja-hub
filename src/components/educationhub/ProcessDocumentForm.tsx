'use client';

import { useState } from 'react';

type DocumentType = 'problemBreakdown' | 'approachPlan' | 'finalReflection';

interface IProcessDocument {
  content?: string;
  hash?: string;
  submittedAt?: string;
}

interface IBlockerLogEntry {
  stuckOn: string;
  resolution: string;
  durationHours: number;
}

interface IAIUsageLogEntry {
  toolUsed: string;
  prompt: string;
  outputReceived: string;
  studentAction: string;
}

interface IDocuments {
  problemBreakdown?: IProcessDocument;
  approachPlan?: IProcessDocument;
  finalReflection?: IProcessDocument;
  blockerLog?: IBlockerLogEntry[];
  aiUsageLog?: IAIUsageLogEntry[];
}

interface IProcessDocumentFormProps {
  engagementId: string;
  documents: IDocuments;
  onUpdate?: (docs: IDocuments) => void;
}

const DOCUMENT_STEPS: {
  key: DocumentType;
  label: string;
  description: string;
  placeholder: string;
  minChars: number;
}[] = [
  {
    key: 'problemBreakdown',
    label: 'Problem Breakdown',
    description:
      'Break down the problem you were given into smaller sub-problems. Describe each sub-problem and how it connects to the whole.',
    placeholder:
      'The main problem is...\n\nI identified the following sub-problems:\n1. ...\n2. ...\n\nThese connect to the overall goal because...',
    minChars: 200,
  },
  {
    key: 'approachPlan',
    label: 'Approach Plan',
    description:
      'Describe the approach you planned to take. Include your technical decisions, why you chose them, and how you structured your work.',
    placeholder:
      'My approach was to...\n\nI chose this approach because...\n\nThe main technical decisions were:\n1. ...',
    minChars: 200,
  },
  {
    key: 'finalReflection',
    label: 'Final Reflection',
    description:
      'Reflect on the project. What did you build? What worked? What would you do differently? What did you learn?',
    placeholder:
      'What I built:\n...\n\nWhat worked well:\n...\n\nChallenges I faced:\n...\n\nWhat I learned:\n...',
    minChars: 200,
  },
];

function SubmittedStamp({ submittedAt }: { submittedAt: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-accent-green/10 border border-accent-green/20 rounded-sm">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <path
          d="M2 6L5 9L10 3"
          stroke="#007F4E"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="font-mono text-t6 text-accent-green">
        Submitted {new Date(submittedAt).toLocaleString('en-KE')}
      </span>
    </div>
  );
}

export default function ProcessDocumentForm({
  engagementId,
  documents,
  onUpdate,
}: IProcessDocumentFormProps) {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Blockers
  const [blockerForm, setBlockerForm] = useState<IBlockerLogEntry>({
    stuckOn: '',
    resolution: '',
    durationHours: 0,
  });
  const [blockers, setBlockers] = useState<IBlockerLogEntry[]>(documents.blockerLog ?? []);
  const [isAddingBlocker, setIsAddingBlocker] = useState(false);

  // AI Usage
  const [aiForm, setAiForm] = useState<IAIUsageLogEntry>({
    toolUsed: '',
    prompt: '',
    outputReceived: '',
    studentAction: '',
  });
  const [aiLogs, setAiLogs] = useState<IAIUsageLogEntry[]>(documents.aiUsageLog ?? []);
  const [isAddingAI, setIsAddingAI] = useState(false);

  async function submitDocument(docType: DocumentType) {
    if (content.trim().length < 50) {
      setError('Please write at least 50 characters for this document.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/education/projects/${engagementId}/documents`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentType: docType, content: content.trim() }),
      });

      const data = (await res.json()) as {
        error?: string;
        data?: { submittedAt: string; allDocumentsComplete: boolean };
      };

      if (!res.ok) {
        setError(data.error ?? 'Submission failed. Please try again.');
        return;
      }

      setSuccess('Document saved with server timestamp.');
      onUpdate?.({
        ...documents,
        [docType]: { content: content.trim(), submittedAt: data.data?.submittedAt },
      });
      setContent('');
    } catch {
      setError('Connection failed. Please check your internet and try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const step = DOCUMENT_STEPS[activeStep];

  const isDocSubmitted = (key: DocumentType): boolean =>
    Boolean(documents[key]?.hash);

  const completedCount =
    DOCUMENT_STEPS.filter((s) => isDocSubmitted(s.key)).length +
    (blockers.length > 0 ? 1 : 0) +
    (aiLogs.length > 0 ? 1 : 0);

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="bg-surface-elevated border border-white/5 rounded p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="font-body text-t5 text-text-secondary">
            Process Documents
          </p>
          <span className="font-mono text-t6 text-text-secondary">
            {completedCount}/5 complete
          </span>
        </div>
        <div className="flex gap-1.5">
          {[...DOCUMENT_STEPS.map((s) => s.key), 'blockerLog', 'aiUsageLog'].map((key, i) => {
            const done =
              i < 3
                ? isDocSubmitted(key as DocumentType)
                : i === 3
                  ? blockers.length > 0
                  : aiLogs.length > 0;
            return (
              <div
                key={key}
                className={`flex-1 h-1.5 rounded-full transition-all duration-150 ${done ? 'bg-accent-green' : 'bg-surface-secondary'}`}
              />
            );
          })}
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 overflow-x-auto">
        {[...DOCUMENT_STEPS.map((s, i) => ({ label: s.label, i })), { label: 'Blocker Log', i: 3 }, { label: 'AI Usage', i: 4 }].map(
          ({ label, i }) => (
            <button
              key={i}
              type="button"
              onClick={() => { setActiveStep(i); setError(null); setSuccess(null); }}
              className={`px-3 py-2 rounded-sm font-body text-t6 whitespace-nowrap transition-all duration-150 min-h-[44px] ${
                activeStep === i
                  ? 'bg-surface-secondary text-text-primary border border-white/10'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {label}
            </button>
          )
        )}
      </div>

      {/* Step content — 3 text documents */}
      {activeStep < 3 && step && (
        <div className="bg-surface-elevated border border-white/5 rounded p-6">
          <h3 className="font-heading text-t3 text-text-primary mb-1">{step.label}</h3>
          <p className="font-body text-t5 text-text-secondary mb-4">{step.description}</p>

          {isDocSubmitted(step.key) && documents[step.key]?.submittedAt ? (
            <div className="space-y-4">
              <SubmittedStamp submittedAt={documents[step.key]!.submittedAt!} />
              <div className="bg-surface-secondary border border-white/5 rounded-sm p-4">
                <p className="font-body text-t5 text-text-secondary whitespace-pre-wrap leading-relaxed">
                  {documents[step.key]?.content ?? ''}
                </p>
              </div>
              <p className="font-body text-t6 text-text-disabled">
                Submitted documents cannot be edited.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={step.placeholder}
                rows={10}
                minLength={step.minChars}
                className="w-full bg-surface-secondary border border-white/5 rounded-sm px-4 py-3 font-body text-t5 text-text-primary placeholder-text-disabled resize-none focus:outline-none focus:border-accent-green/50 transition-all duration-150"
              />
              <div className="flex items-center justify-between">
                <span className="font-mono text-t6 text-text-disabled">
                  {content.length} chars
                </span>
                <button
                  type="button"
                  onClick={() => void submitDocument(step.key)}
                  disabled={isSubmitting || content.trim().length < step.minChars}
                  className="px-6 py-2 bg-accent-green text-white rounded-sm font-body text-t5 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-all duration-150 min-h-[44px]"
                >
                  {isSubmitting ? 'Saving...' : 'Save Document'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Blocker Log */}
      {activeStep === 3 && (
        <div className="bg-surface-elevated border border-white/5 rounded p-6 space-y-4">
          <h3 className="font-heading text-t3 text-text-primary mb-1">Blocker Log</h3>
          <p className="font-body text-t5 text-text-secondary">
            Record problems you got stuck on and how you resolved them.
          </p>

          {blockers.map((b, i) => (
            <div key={i} className="bg-surface-secondary border border-white/5 rounded-sm p-4 space-y-1">
              <p className="font-body text-t5 text-text-primary">
                <span className="text-text-disabled">Stuck on:</span> {b.stuckOn}
              </p>
              <p className="font-body text-t5 text-text-secondary">
                <span className="text-text-disabled">Resolution:</span> {b.resolution}
              </p>
              <p className="font-mono text-t6 text-text-disabled">{b.durationHours}h</p>
            </div>
          ))}

          {isAddingBlocker ? (
            <div className="space-y-3">
              <textarea
                placeholder="What were you stuck on?"
                rows={2}
                value={blockerForm.stuckOn}
                onChange={(e) => setBlockerForm((f) => ({ ...f, stuckOn: e.target.value }))}
                className="w-full bg-surface-secondary border border-white/5 rounded-sm px-4 py-3 font-body text-t5 text-text-primary placeholder-text-disabled resize-none focus:outline-none focus:border-accent-green/50 transition-all duration-150"
              />
              <textarea
                placeholder="How did you resolve it?"
                rows={2}
                value={blockerForm.resolution}
                onChange={(e) => setBlockerForm((f) => ({ ...f, resolution: e.target.value }))}
                className="w-full bg-surface-secondary border border-white/5 rounded-sm px-4 py-3 font-body text-t5 text-text-primary placeholder-text-disabled resize-none focus:outline-none focus:border-accent-green/50 transition-all duration-150"
              />
              <input
                type="number"
                placeholder="Hours spent on this blocker"
                min={0.5}
                step={0.5}
                value={blockerForm.durationHours || ''}
                onChange={(e) =>
                  setBlockerForm((f) => ({ ...f, durationHours: parseFloat(e.target.value) || 0 }))
                }
                className="w-full bg-surface-secondary border border-white/5 rounded-sm px-4 py-3 font-body text-t5 text-text-primary placeholder-text-disabled focus:outline-none focus:border-accent-green/50 transition-all duration-150 min-h-[44px]"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (blockerForm.stuckOn.trim() && blockerForm.resolution.trim()) {
                      setBlockers((prev) => [...prev, blockerForm]);
                      setBlockerForm({ stuckOn: '', resolution: '', durationHours: 0 });
                      setIsAddingBlocker(false);
                    }
                  }}
                  className="px-4 py-2 bg-accent-green text-white rounded-sm font-body text-t5 hover:opacity-90 transition-all duration-150 min-h-[44px]"
                >
                  Add Entry
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingBlocker(false)}
                  className="px-4 py-2 bg-surface-secondary border border-white/5 text-text-secondary rounded-sm font-body text-t5 hover:text-text-primary transition-all duration-150 min-h-[44px]"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsAddingBlocker(true)}
              className="px-4 py-2 bg-surface-secondary border border-white/10 text-text-secondary rounded-sm font-body text-t5 hover:text-text-primary transition-all duration-150 min-h-[44px]"
            >
              + Add Blocker Entry
            </button>
          )}
        </div>
      )}

      {/* AI Usage Log */}
      {activeStep === 4 && (
        <div className="bg-surface-elevated border border-white/5 rounded p-6 space-y-4">
          <h3 className="font-heading text-t3 text-text-primary mb-1">AI Usage Log</h3>
          <p className="font-body text-t5 text-text-secondary">
            Record every time you used an AI tool. Be transparent — the lecturer will see this.
          </p>
          <p className="font-body text-t6 text-text-disabled">
            AI Mentor messages are logged automatically.
          </p>

          {aiLogs.map((log, i) => (
            <div key={i} className="bg-surface-secondary border border-white/5 rounded-sm p-4 space-y-1">
              <p className="font-mono text-t6 text-accent-green">{log.toolUsed}</p>
              <p className="font-body text-t6 text-text-secondary">{log.prompt}</p>
              <p className="font-body text-t6 text-text-disabled">Action: {log.studentAction}</p>
            </div>
          ))}

          {isAddingAI ? (
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Tool used (e.g. ChatGPT, GitHub Copilot, AI Mentor)"
                value={aiForm.toolUsed}
                onChange={(e) => setAiForm((f) => ({ ...f, toolUsed: e.target.value }))}
                className="w-full bg-surface-secondary border border-white/5 rounded-sm px-4 py-3 font-body text-t5 text-text-primary placeholder-text-disabled focus:outline-none focus:border-accent-green/50 transition-all duration-150 min-h-[44px]"
              />
              <textarea
                placeholder="What prompt did you give the AI?"
                rows={3}
                value={aiForm.prompt}
                onChange={(e) => setAiForm((f) => ({ ...f, prompt: e.target.value }))}
                className="w-full bg-surface-secondary border border-white/5 rounded-sm px-4 py-3 font-body text-t5 text-text-primary placeholder-text-disabled resize-none focus:outline-none focus:border-accent-green/50 transition-all duration-150"
              />
              <textarea
                placeholder="What did the AI output?"
                rows={3}
                value={aiForm.outputReceived}
                onChange={(e) => setAiForm((f) => ({ ...f, outputReceived: e.target.value }))}
                className="w-full bg-surface-secondary border border-white/5 rounded-sm px-4 py-3 font-body text-t5 text-text-primary placeholder-text-disabled resize-none focus:outline-none focus:border-accent-green/50 transition-all duration-150"
              />
              <textarea
                placeholder="What did you do with the output?"
                rows={2}
                value={aiForm.studentAction}
                onChange={(e) => setAiForm((f) => ({ ...f, studentAction: e.target.value }))}
                className="w-full bg-surface-secondary border border-white/5 rounded-sm px-4 py-3 font-body text-t5 text-text-primary placeholder-text-disabled resize-none focus:outline-none focus:border-accent-green/50 transition-all duration-150"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (
                      aiForm.toolUsed.trim() &&
                      aiForm.prompt.trim() &&
                      aiForm.outputReceived.trim() &&
                      aiForm.studentAction.trim()
                    ) {
                      setAiLogs((prev) => [...prev, aiForm]);
                      setAiForm({ toolUsed: '', prompt: '', outputReceived: '', studentAction: '' });
                      setIsAddingAI(false);
                    }
                  }}
                  className="px-4 py-2 bg-accent-green text-white rounded-sm font-body text-t5 hover:opacity-90 transition-all duration-150 min-h-[44px]"
                >
                  Add Entry
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingAI(false)}
                  className="px-4 py-2 bg-surface-secondary border border-white/5 text-text-secondary rounded-sm font-body text-t5 hover:text-text-primary transition-all duration-150 min-h-[44px]"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsAddingAI(true)}
              className="px-4 py-2 bg-surface-secondary border border-white/10 text-text-secondary rounded-sm font-body text-t5 hover:text-text-primary transition-all duration-150 min-h-[44px]"
            >
              + Add AI Usage Entry
            </button>
          )}
        </div>
      )}

      {/* Status messages */}
      {error && (
        <p className="font-body text-t5 text-red-400 bg-red-950/20 border border-red-900/30 rounded px-4 py-3">
          {error}
        </p>
      )}
      {success && (
        <p className="font-body text-t5 text-accent-green bg-accent-green/5 border border-accent-green/20 rounded px-4 py-3">
          {success}
        </p>
      )}
    </div>
  );
}
