'use client';

import { useState, useRef, useEffect } from 'react';

interface IChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface IBriefSummary {
  projectTitle?: string;
  problemStatement?: string;
  kenyanConstraints?: string[];
}

interface IAIMentorChatProps {
  engagementId: string;
  studentName: string;
  brief?: IBriefSummary;
  tier: string;
}

function MentorSkeleton() {
  return (
    <div className="space-y-4 p-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
          <div
            className="h-12 rounded bg-surface-secondary border border-white/5"
            style={{ width: `${35 + i * 15}%` }}
          />
        </div>
      ))}
    </div>
  );
}

function BriefContextPanel({ brief }: { brief: IBriefSummary }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-white/5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-6 py-3 font-body text-t5 text-text-secondary hover:text-text-primary transition-all duration-150"
      >
        <span>Project Brief Context</span>
        <span className="font-mono text-t6">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="px-6 pb-4 space-y-3">
          {brief.projectTitle && (
            <div>
              <p className="font-mono text-t6 text-text-disabled mb-1">Title</p>
              <p className="font-body text-t5 text-text-primary">{brief.projectTitle}</p>
            </div>
          )}
          {brief.problemStatement && (
            <div>
              <p className="font-mono text-t6 text-text-disabled mb-1">Problem</p>
              <p className="font-body text-t5 text-text-secondary">{brief.problemStatement}</p>
            </div>
          )}
          {brief.kenyanConstraints && brief.kenyanConstraints.length > 0 && (
            <div>
              <p className="font-mono text-t6 text-text-disabled mb-1">Kenyan Constraints</p>
              <ul className="space-y-1">
                {brief.kenyanConstraints.map((c, i) => (
                  <li key={i} className="font-body text-t6 text-text-secondary flex gap-2">
                    <span className="text-accent-green">—</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AIMentorChat({
  engagementId,
  studentName,
  brief,
  tier,
}: IAIMentorChatProps) {
  const [messages, setMessages] = useState<IChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsInitializing(false);
    setMessages([
      {
        role: 'assistant',
        content: `Welcome, ${studentName}. I am your AI Mentor for this ${tier}-level project. I work in Socratic mode — I will ask you questions rather than give you answers. I will never write code for you.\n\nWhat aspect of your project would you like to think through?`,
      },
    ]);
  }, [studentName, tier]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage() {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    setInput('');
    setError(null);
    setMessages((prev) => [...prev, { role: 'user', content: trimmed }]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/education/mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ engagementId, message: trimmed, sessionId }),
      });

      const data = (await res.json()) as {
        data?: { response: string; sessionId: string; autoLoggedToAIUsage: boolean };
        error?: string;
      };

      if (!res.ok || !data.data) {
        setError(data.error ?? 'Something went wrong. Please try again.');
        return;
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: data.data!.response }]);
      setSessionId(data.data.sessionId);
    } catch {
      setError('Connection failed. Please check your internet and try again.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  }

  if (isInitializing) {
    return (
      <div className="bg-surface-elevated border border-white/5 rounded">
        <MentorSkeleton />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-surface-elevated border border-white/5 rounded">
      {/* Header — visually distinct from FarmAssistantChat */}
      <div className="px-6 py-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-t3 text-text-primary">AI Mentor</h2>
              <span className="font-mono text-t6 text-text-secondary border border-white/10 rounded-[2px] px-1.5 py-0.5">
                SOCRATIC
              </span>
            </div>
            <p className="font-body text-t6 text-text-secondary mt-1">
              Education Hub · Groq Llama 3
            </p>
          </div>
          <span className="font-mono text-t6 text-accent-green border border-accent-green/30 rounded-[2px] px-2 py-0.5">
            {tier}
          </span>
        </div>

        {/* Auto-log notice */}
        <p className="font-body text-t6 text-text-disabled mt-2 bg-surface-secondary border border-white/5 rounded-sm px-3 py-2">
          Your messages are logged to your AI Usage Log automatically.
        </p>
      </div>

      {/* Brief context panel */}
      {brief && <BriefContextPanel brief={brief} />}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-[360px]">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-6 h-6 flex-shrink-0 mt-1 mr-2 bg-surface-secondary border border-white/10 rounded-sm flex items-center justify-center">
                <span className="font-mono text-t6 text-accent-green">M</span>
              </div>
            )}
            <div
              className={`max-w-[78%] px-4 py-3 rounded font-body text-t5 leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-surface-secondary border border-white/10 text-text-primary'
                  : 'bg-surface-elevated border border-white/5 text-text-primary'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="w-6 h-6 flex-shrink-0 mt-1 mr-2 bg-surface-secondary border border-white/10 rounded-sm flex items-center justify-center">
              <span className="font-mono text-t6 text-accent-green">M</span>
            </div>
            <div className="px-4 py-3 bg-surface-elevated border border-white/5 rounded">
              <div className="flex gap-1 items-center">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-text-secondary"
                    style={{ animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-center">
            <p className="font-body text-t5 text-red-400 bg-red-950/20 border border-red-900/30 rounded px-4 py-2">
              {error}
            </p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-white/5">
        <div className="flex gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your approach, a concept you're unsure about, or a decision you're weighing..."
            maxLength={2000}
            rows={2}
            className="flex-1 bg-surface-secondary border border-white/5 rounded-sm px-4 py-3 font-body text-t5 text-text-primary placeholder-text-disabled resize-none focus:outline-none focus:border-accent-green/50 transition-all duration-150 min-h-[44px]"
          />
          <button
            type="button"
            onClick={() => void sendMessage()}
            disabled={isLoading || !input.trim()}
            className="px-4 py-3 bg-surface-secondary border border-white/10 text-text-primary rounded-sm font-body text-t5 disabled:opacity-40 disabled:cursor-not-allowed hover:border-accent-green/30 hover:text-accent-green transition-all duration-150 min-h-[44px] min-w-[44px]"
          >
            Send
          </button>
        </div>
        <p className="font-body text-t6 text-text-disabled mt-2">
          {input.length}/2000 · Enter to send
        </p>
      </div>
    </div>
  );
}
