'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Track = 'AI_BRIEF' | 'OPEN_SOURCE';

export default function NewProjectClient() {
  const router = useRouter();
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [githubRepoUrl, setGithubRepoUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStart() {
    if (!selectedTrack) return;
    if (selectedTrack === 'OPEN_SOURCE' && !githubRepoUrl.trim()) {
      setError('Please enter your GitHub repository URL.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (selectedTrack === 'AI_BRIEF') {
        // POST to briefs endpoint which generates the brief and creates the engagement
        const res = await fetch('/api/education/briefs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ track: 'AI_BRIEF', tier: 'BEGINNER' }),
        });

        const data = (await res.json()) as { data?: { engagementId: string }; error?: string };

        if (!res.ok || !data.data) {
          setError(data.error ?? 'Failed to generate brief. Please try again.');
          return;
        }

        router.push(`/dashboard/student/projects/${data.data.engagementId}`);
      } else {
        // OPEN_SOURCE — create engagement directly
        const res = await fetch('/api/education/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ track: 'OPEN_SOURCE', tier: 'BEGINNER', githubRepoUrl }),
        });

        const data = (await res.json()) as { data?: { engagementId: string }; error?: string };

        if (!res.ok || !data.data) {
          setError(data.error ?? 'Failed to create project. Please try again.');
          return;
        }

        router.push(`/dashboard/student/projects/${data.data.engagementId}`);
      }
    } catch {
      setError('Connection failed. Please check your internet and try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Track selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* AI Brief */}
        <button
          type="button"
          onClick={() => setSelectedTrack('AI_BRIEF')}
          className={`p-6 text-left rounded border transition-all duration-150 ${
            selectedTrack === 'AI_BRIEF'
              ? 'bg-surface-elevated border-accent-green/50'
              : 'bg-surface-elevated border-white/5 hover:border-white/15'
          }`}
        >
          <p className="font-heading text-t3 text-text-primary mb-2">AI Brief</p>
          <p className="font-body text-t5 text-text-secondary">
            Receive a GPT-generated project brief based on a real Kenyan industry context.
            The brief defines a client persona, problem statement, and Kenyan constraints.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {['Client persona', 'Structured brief', 'Kenya-specific'].map((tag) => (
              <span
                key={tag}
                className="font-mono text-t6 text-text-disabled bg-surface-secondary border border-white/5 rounded-[2px] px-2 py-0.5"
              >
                {tag}
              </span>
            ))}
          </div>
        </button>

        {/* Open Source */}
        <button
          type="button"
          onClick={() => setSelectedTrack('OPEN_SOURCE')}
          className={`p-6 text-left rounded border transition-all duration-150 ${
            selectedTrack === 'OPEN_SOURCE'
              ? 'bg-surface-elevated border-accent-green/50'
              : 'bg-surface-elevated border-white/5 hover:border-white/15'
          }`}
        >
          <p className="font-heading text-t3 text-text-primary mb-2">Open Source</p>
          <p className="font-body text-t5 text-text-secondary">
            Contribute to a real open-source project on GitHub. Your commits are verified
            and become part of your permanent portfolio record.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {['GitHub verified', 'Real codebase', 'Commit history'].map((tag) => (
              <span
                key={tag}
                className="font-mono text-t6 text-text-disabled bg-surface-secondary border border-white/5 rounded-[2px] px-2 py-0.5"
              >
                {tag}
              </span>
            ))}
          </div>
        </button>
      </div>

      {/* GitHub URL input for OPEN_SOURCE */}
      {selectedTrack === 'OPEN_SOURCE' && (
        <div className="bg-surface-elevated border border-white/5 rounded p-4">
          <label className="font-body text-t5 text-text-secondary block mb-2">
            GitHub Repository URL
          </label>
          <input
            type="url"
            value={githubRepoUrl}
            onChange={(e) => setGithubRepoUrl(e.target.value)}
            placeholder="https://github.com/org/repo"
            className="w-full bg-surface-secondary border border-white/5 rounded-sm px-4 py-3 font-mono text-t5 text-text-primary placeholder-text-disabled focus:outline-none focus:border-accent-green/50 transition-all duration-150 min-h-[44px]"
          />
          <p className="font-body text-t6 text-text-disabled mt-2">
            Must be a public repository with open issues and recent activity.
          </p>
        </div>
      )}

      {/* How it works */}
      {selectedTrack && (
        <div className="bg-surface-secondary border border-white/5 rounded p-4">
          <p className="font-mono text-t6 text-text-disabled uppercase tracking-wider mb-3">
            What happens next
          </p>
          <ol className="space-y-2">
            {(selectedTrack === 'AI_BRIEF'
              ? [
                  'A project brief is generated for your tier and interests',
                  'You work on the project and submit 5 process documents',
                  'A peer reviewer evaluates your work',
                  'A lecturer verifies and scores your project',
                  'Verified project appears on your public portfolio',
                ]
              : [
                  'Your GitHub repository is registered against your engagement',
                  'You work on the project and submit 5 process documents',
                  'Your commits are verified on submission',
                  'A peer reviewer and lecturer evaluate your work',
                  'Verified contribution appears on your public portfolio',
                ]
            ).map((step, i) => (
                <li key={i} className="flex gap-3 font-body text-t5 text-text-secondary">
                  <span className="font-mono text-t6 text-accent-green flex-shrink-0">
                    {i + 1}.
                  </span>
                  <span>{step}</span>
                </li>
              ))}
          </ol>
        </div>
      )}

      {error && (
        <p className="font-body text-t5 text-red-400 bg-red-950/20 border border-red-900/30 rounded px-4 py-3">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={() => void handleStart()}
        disabled={!selectedTrack || isLoading}
        className="w-full py-3 bg-accent-green text-white font-body text-t4 rounded-sm disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-all duration-150 min-h-[44px]"
      >
        {isLoading
          ? selectedTrack === 'AI_BRIEF'
            ? 'Generating brief...'
            : 'Creating project...'
          : 'Start Project'}
      </button>
    </div>
  );
}
