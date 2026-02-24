'use client';

import { useState, useRef, useEffect } from 'react';

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
            className="h-12 rounded bg-surface-secondary border border-white/5 animate-shimmer"
            style={{
              width: `${40 + i * 15}%`,
              backgroundImage: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.03) 50%, transparent 100%)',
              backgroundSize: '200% 100%',
            }}
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
    return (
      <div className="bg-surface-elevated border border-white/5 rounded">
        <ChatSkeleton />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-surface-elevated border-b border-white/5 rounded-t">
        <div>
          <h2 className="font-heading text-t3 text-text-primary">Farm Assistant</h2>
          <p className="font-body text-t6 text-text-secondary mt-1">
            Powered by UmojaHub AI · Groq Llama 3
          </p>
        </div>
        {weatherContext && (
          <button
            onClick={() => setWeatherPanelOpen((o) => !o)}
            className="flex items-center gap-2 px-3 py-2 bg-surface-secondary border border-white/5 rounded-sm text-t6 font-body text-text-secondary hover:text-text-primary transition-all duration-150 min-h-[44px] min-w-[44px]"
            aria-expanded={weatherPanelOpen}
          >
            <span className="text-t6">Weather</span>
            <span className="text-t6">{weatherPanelOpen ? '▲' : '▼'}</span>
          </button>
        )}
      </div>

      {/* Weather context panel */}
      {weatherContext && weatherPanelOpen && (
        <div className="px-6 py-4 bg-surface-secondary border-b border-white/5">
          <p className="font-body text-t6 text-text-secondary mb-2">
            7-day forecast for <span className="text-text-primary">{weatherContext.county}</span>
          </p>
          <pre className="font-mono text-t6 text-text-secondary whitespace-pre-wrap">
            {weatherContext.forecast}
          </pre>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-surface-elevated min-h-[400px]">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[75%] px-4 py-3 rounded font-body text-t5 ${
                msg.role === 'user'
                  ? 'bg-accent-green text-white'
                  : 'bg-surface-secondary border border-white/5 text-text-primary'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="px-4 py-3 bg-surface-secondary border border-white/5 rounded">
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
      <div className="px-6 py-4 bg-surface-elevated border-t border-white/5 rounded-b">
        <div className="flex gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your crops, soil, pests, or market prices..."
            maxLength={1000}
            rows={2}
            className="flex-1 bg-surface-secondary border border-white/5 rounded-sm px-4 py-3 font-body text-t5 text-text-primary placeholder-text-disabled resize-none focus:outline-none focus:border-accent-green/50 transition-all duration-150 min-h-[44px]"
          />
          <button
            onClick={() => void sendMessage()}
            disabled={isLoading || !input.trim()}
            className="px-4 py-3 bg-accent-green text-white rounded-sm font-body text-t5 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-all duration-150 min-h-[44px] min-w-[44px]"
          >
            Send
          </button>
        </div>
        <p className="font-body text-t6 text-text-disabled mt-2">
          {input.length}/1000 · Press Enter to send
        </p>
      </div>
    </div>
  );
}
