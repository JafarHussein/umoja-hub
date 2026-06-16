'use client';

import { useState, useRef, useEffect } from 'react';

interface IChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface IMentorChatProps {
  engagementId: string;
  briefTitle: string;
}

function ChatSkeleton(): React.ReactElement {
  return (
    <div className="space-y-4 p-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
          <div
            className="h-12 rounded-sm bg-surface-raised border border-zinc-800/50 animate-pulse"
            style={{ width: `${40 + i * 15}%` }}
          />
        </div>
      ))}
    </div>
  );
}

export function MentorChat({ engagementId, briefTitle }: IMentorChatProps): React.ReactElement {
  const [messages, setMessages] = useState<IChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsInitializing(false);
    setMessages([
      {
        role: 'assistant',
        content: `Hello! I'm your AI mentor for "${briefTitle}". I'm here to guide your thinking — I'll ask questions and help you reason through problems rather than give you direct answers. What are you working on or stuck on right now?`,
      },
    ]);
  }, [briefTitle]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(): Promise<void> {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    setInput('');
    setError(null);
    setMessages((prev) => [...prev, { role: 'user', content: trimmed }]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/mentor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, engagementId }),
      });

      const data = (await res.json()) as {
        data?: { response: string; sessionId: string; messageCount: number };
        error?: string;
      };

      if (!res.ok || !data.data) {
        setError(data.error ?? 'Something went wrong. Please try again.');
        return;
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: data.data!.response }]);
    } catch {
      setError('Connection failed. Please check your internet and try again.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>): void {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  }

  if (isInitializing) {
    return (
      <div className="bg-surface border border-zinc-800/50 rounded-[4px]">
        <ChatSkeleton />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 bg-surface border-b border-zinc-800/50 rounded-t-[4px]">
        <h2 className="font-heading text-t3 text-fg">AI Mentor</h2>
        <p className="font-body text-t6 text-fg-muted mt-1">
          Powered by UmojaHub AI · Groq Llama 3 · Socratic guidance
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-surface min-h-[400px]">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={[
                'max-w-[75%] px-4 py-3 rounded-sm font-body text-t5',
                msg.role === 'user'
                  ? 'bg-brand text-white'
                  : 'bg-surface-raised border border-zinc-800/50 text-fg',
              ].join(' ')}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="px-4 py-3 bg-surface-raised border border-zinc-800/50 rounded-sm">
              <div className="flex gap-1 items-center">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-fg-muted"
                    style={{ animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-center">
            <p className="font-body text-t5 text-red-400 bg-red-950/20 border border-red-900/30 rounded-sm px-4 py-2">
              {error}
            </p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-6 py-4 bg-surface border-t border-zinc-800/50 rounded-b-[4px]">
        <div className="flex gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your approach, a concept, or where you're stuck..."
            maxLength={1000}
            rows={2}
            className="flex-1 bg-surface-raised border border-zinc-800/50 rounded-sm px-4 py-3 font-body text-t5 text-fg placeholder-fg-disabled resize-none focus:outline-none focus:border-brand/50 transition-colors duration-150 min-h-[44px]"
          />
          <button
            onClick={() => void sendMessage()}
            disabled={isLoading || !input.trim()}
            className="px-4 py-3 bg-brand text-white rounded-sm font-body text-t5 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-all duration-150 min-h-[44px] min-w-[44px]"
          >
            Send
          </button>
        </div>
        <p className="font-body text-t6 text-fg-disabled mt-2">
          {input.length}/1000 · Press Enter to send
        </p>
      </div>
    </div>
  );
}
