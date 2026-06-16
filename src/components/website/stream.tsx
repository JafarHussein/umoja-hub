/**
 * Documentation Stream primitives (foundation §13). Server components — no
 * client JS, so the page is readable on 2G with scripting off. Each Topic and
 * Sub has a stable id for deep-linking; `scroll-mt` offsets the sticky header.
 * Limitation is the structural paired-limitation block (WEBSITE_PURPOSE_V1
 * Principle 7) — it renders in the same reading unit as the capability.
 */
import type { ReactNode } from 'react';
import type { StreamTopic } from './streamTopics';

export function Topic({ topic, children }: { topic: StreamTopic; children: ReactNode }) {
  return (
    <section
      id={topic.id}
      aria-labelledby={`${topic.id}-h`}
      className="scroll-mt-24 mt-16 border-t border-border pt-16 first:mt-0 first:border-t-0 first:pt-0"
    >
      <p className="font-mono text-read-meta text-fg-subtle">{String(topic.n).padStart(2, '0')}</p>
      <h2 id={`${topic.id}-h`} className="mt-1 font-heading text-read-h2 text-fg">
        {topic.title}
      </h2>
      <div className="mt-8 space-y-12">{children}</div>
    </section>
  );
}

export function Sub({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-24">
      <h3 id={`${id}-h`} className="font-heading text-read-h3 text-fg">
        {title}
      </h3>
      <div className="mt-3 max-w-reading space-y-4">{children}</div>
    </section>
  );
}

export function Lead({ children }: { children: ReactNode }) {
  return <p className="max-w-reading font-body text-read-lead text-fg-muted">{children}</p>;
}

export function P({ children }: { children: ReactNode }) {
  return <p className="font-body text-read-body text-fg">{children}</p>;
}

export function Limitation({
  title = 'What this does not do',
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <aside
      role="note"
      className="mt-2 max-w-reading rounded border border-border bg-surface-sunken p-4"
    >
      <p className="font-mono text-read-meta uppercase tracking-wide text-warning">{title}</p>
      <div className="mt-2 space-y-2 font-body text-read-body text-fg-muted">{children}</div>
    </aside>
  );
}

/**
 * Functional flow diagram (WEBSITE_PURPOSE_V1 Principle 8). Inline, token-styled
 * HTML — no image bytes (cheap on 2G), real text (screen-reader friendly), no
 * decorative motion. A vertical ordered sequence of steps with optional
 * meaning-coloured terminal outcomes.
 */
export interface FlowStep {
  label: string;
  note?: string;
}

export interface FlowOutcome {
  label: string;
  tone: 'success' | 'warning' | 'danger';
}

const OUTCOME_TONE: Record<FlowOutcome['tone'], string> = {
  success: 'border-success/40 text-success',
  warning: 'border-warning/40 text-warning',
  danger: 'border-danger/40 text-danger',
};

export function FlowDiagram({
  caption,
  steps,
  outcomes,
}: {
  caption: string;
  steps: FlowStep[];
  outcomes?: FlowOutcome[];
}) {
  return (
    <figure className="my-5 max-w-reading rounded border border-border bg-surface p-4">
      <ol className="space-y-0">
        {steps.map((s, i) => (
          <li key={s.label}>
            <div className="rounded border border-border bg-background p-3">
              <p className="font-body text-read-body font-medium text-fg">
                <span className="font-mono text-fg-subtle">{i + 1}.</span> {s.label}
              </p>
              {s.note ? (
                <p className="mt-1 font-body text-read-meta text-fg-muted">{s.note}</p>
              ) : null}
            </div>
            {i < steps.length - 1 || outcomes ? (
              <div aria-hidden="true" className="flex justify-center py-1 text-fg-subtle">
                ↓
              </div>
            ) : null}
          </li>
        ))}
      </ol>
      {outcomes ? (
        <ul className="flex flex-wrap gap-2">
          {outcomes.map((o) => (
            <li
              key={o.label}
              className={`rounded border px-2 py-1 font-mono text-read-meta uppercase tracking-wide ${OUTCOME_TONE[o.tone]}`}
            >
              {o.label}
            </li>
          ))}
        </ul>
      ) : null}
      <figcaption className="mt-3 font-mono text-read-meta uppercase tracking-wide text-fg-subtle">
        {caption}
      </figcaption>
    </figure>
  );
}
