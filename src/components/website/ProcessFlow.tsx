import React from 'react';

interface Step {
  actor: string;
  action: string;
  detail: string;
}

interface ProcessFlowProps {
  steps: Step[];
}

export function ProcessFlow({ steps }: ProcessFlowProps): React.ReactElement {
  return (
    <div className="relative">
      {/* Desktop: horizontal */}
      <div className="hidden md:flex items-start gap-0">
        {steps.map((step, i) => (
          <React.Fragment key={step.action}>
            <div className="flex-1 min-w-0">
              <div className="flex flex-col gap-2 pr-4">
                <span className="font-mono text-t6 text-accent-green tabular-nums">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="font-mono text-t6 text-text-disabled uppercase tracking-widest">
                  {step.actor}
                </span>
                <p className="font-heading text-t5 font-medium text-text-primary leading-snug">
                  {step.action}
                </p>
                <p className="font-body text-t6 text-text-secondary">
                  {step.detail}
                </p>
              </div>
            </div>
            {i < steps.length - 1 && (
              <div className="flex-shrink-0 flex items-start pt-3 px-1">
                <svg
                  width="20"
                  height="16"
                  viewBox="0 0 20 16"
                  fill="none"
                  aria-hidden="true"
                  className="text-text-disabled mt-[2px]"
                >
                  <path
                    d="M1 8h16M13 2l6 6-6 6"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Mobile: vertical */}
      <div className="md:hidden flex flex-col gap-0">
        {steps.map((step, i) => (
          <div key={step.action} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-sm border border-zinc-800/50">
                <span className="font-mono text-t6 text-accent-green tabular-nums">
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className="w-px flex-1 bg-zinc-800/50 my-1" />
              )}
            </div>
            <div className="flex flex-col gap-1 pb-6 min-w-0">
              <span className="font-mono text-t6 text-text-disabled uppercase tracking-widest">
                {step.actor}
              </span>
              <p className="font-heading text-t4 font-medium text-text-primary">
                {step.action}
              </p>
              <p className="font-body text-t5 text-text-secondary">
                {step.detail}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
