'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/app';
import { cn } from '@/lib/cn';

interface IChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface IWeatherContext {
  county: string;
  forecast: string;
}

interface IFarmAssistantChatProps {
  farmerName: string;
  farmerCounty: string;
}

function ChatSkeleton() {
  return (
    <div className="space-y-4 p-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
          <div
            className="skeleton h-12 rounded-app-control border border-app-hairline"
            style={{ width: `${40 + i * 15}%` }}
          />
        </div>
      ))}
    </div>
  );
}

export default function FarmAssistantChat({ farmerName, farmerCounty }: IFarmAssistantChatProps) {
  const [messages, setMessages] = useState<IChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [weatherContext, setWeatherContext] = useState<IWeatherContext | null>(null);
  const [weatherPanelOpen, setWeatherPanelOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsInitializing(false);
    setMessages([
      {
        role: 'assistant',
        content: `Habari ${farmerName}! I am your UmojaHub Farm Assistant. I can help you with crop farming, input verification, animal health, price trends, and post-harvest handling for your farm in ${farmerCounty}. What would you like to know?`,
      },
    ]);
  }, [farmerName, farmerCounty]);

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
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, sessionId }),
      });

      const data = await res.json() as {
        data?: { response: string; sessionId: string; weatherContext: IWeatherContext | null };
        error?: string;
      };

      if (!res.ok || !data.data) {
        setError(data.error ?? 'Something went wrong. Please try again.');
        return;
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: data.data!.response }]);
      setSessionId(data.data.sessionId);

      if (data.data.weatherContext && !weatherContext) {
        setWeatherContext(data.data.weatherContext);
        setWeatherPanelOpen(true);
      }
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
    return <ChatSkeleton />;
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-app-hairline bg-app-card px-6 py-4">
        <div>
          <h2 className="app-h2 text-app-ink">Farm Assistant</h2>
          <p className="app-meta mt-1 text-app-muted">Powered by UmojaHub AI · Groq Llama 3</p>
        </div>
        {weatherContext && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setWeatherPanelOpen((o) => !o)}
            aria-expanded={weatherPanelOpen}
          >
            Weather <span aria-hidden>{weatherPanelOpen ? '▲' : '▼'}</span>
          </Button>
        )}
      </div>

      {/* Weather context panel */}
      {weatherContext && weatherPanelOpen && (
        <div className="border-b border-app-hairline bg-app-sunken px-6 py-4">
          <p className="app-meta mb-2 text-app-muted">
            7-day forecast for <span className="text-app-ink">{weatherContext.county}</span>
          </p>
          <pre className="app-meta whitespace-pre-wrap font-app-mono text-app-muted">
            {weatherContext.forecast}
          </pre>
        </div>
      )}

      {/* Messages */}
      <div className="min-h-[400px] flex-1 space-y-4 overflow-y-auto bg-app-card p-6">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={cn(
                'app-body max-w-[75%] rounded-app-card px-4 py-3',
                msg.role === 'user'
                  ? 'bg-app-brand text-app-on-brand'
                  : 'border border-app-hairline bg-app-sunken text-app-body'
              )}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="rounded-app-card border border-app-hairline bg-app-sunken px-4 py-3">
              <div className="flex items-center gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-1.5 w-1.5 rounded-app-pill bg-app-muted"
                    style={{ animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-center">
            <p className="app-body rounded-app-control border border-app-danger/30 bg-app-danger-surface px-4 py-2 text-app-danger">
              {error}
            </p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-app-hairline bg-app-card px-6 py-4">
        <div className="flex gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your crops, soil, pests, or market prices..."
            maxLength={1000}
            rows={2}
            className="app-body min-h-[44px] flex-1 resize-none rounded-app-control border border-app-border-strong bg-app-card px-4 py-3 text-app-ink placeholder:text-app-faint transition-colors duration-150 focus:border-app-brand focus:outline-none focus:ring-2 focus:ring-app-brand/30"
          />
          <Button
            onClick={() => void sendMessage()}
            disabled={isLoading || !input.trim()}
            aria-label="Send message"
          >
            Send
          </Button>
        </div>
        <p className="app-meta mt-2 text-app-faint">{input.length}/1000 · Press Enter to send</p>
      </div>
    </div>
  );
}
