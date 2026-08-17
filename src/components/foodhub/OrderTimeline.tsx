import React from 'react';
import {
  buildOrderJourney,
  type IJourneyStage,
  type JourneyStatus,
  type JourneyViewer,
} from '@/lib/foodhub/orderJourney';

// ---------------------------------------------------------------------------
// Two views of one journey.
//
// Both used to derive the stages themselves, and drifted: the same moment was
// labelled differently in each, only the detailed one named the party being
// waited on, and neither could say where a payment had actually got to. The
// derivation now lives in lib/foodhub/orderJourney and these components only
// draw it — so the row in a table and the spine in a modal cannot disagree
// about an order again.
// ---------------------------------------------------------------------------

export type TimelineViewer = JourneyViewer;

export interface IOrderTimelineProps {
  paymentStatus: string;
  fulfillmentStatus: string;
  createdAt?: Date | string | null | undefined;
  paidAt?: Date | string | null | undefined;
  confirmedByFarmerAt?: Date | string | null | undefined;
  receivedByBuyerAt?: Date | string | null | undefined;
  /**
   * Who is reading. The journey is the same for everyone; only the pronouns
   * change. "Waiting for you to confirm receipt" is a different sentence from
   * "waiting for the buyer to confirm receipt", and only one of them tells the
   * reader they are the one holding things up.
   */
  viewer?: TimelineViewer | undefined;
  /** True while a mediation is OPEN or IN_REVIEW on this order. */
  hasOpenMediation?: boolean | undefined;
}

function formatDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-KE', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// One tone scale for both views, so a stage that reads as blocked in the modal
// does not read as merely pending in the row behind it.
function nodeClass(stage: IJourneyStage): string {
  if (stage.tone === 'danger') return 'bg-app-danger';
  if (stage.tone === 'info') return 'bg-app-info';
  switch (stage.status) {
    case 'DONE':
      return 'bg-app-brand';
    case 'CURRENT':
      return 'bg-app-brand/40 ring-1 ring-app-brand/40';
    case 'BLOCKED':
      return 'bg-app-danger';
    default:
      return 'border border-app-hairline bg-app-sunken';
  }
}

function textClass(stage: IJourneyStage): string {
  if (stage.tone === 'danger' || stage.status === 'BLOCKED') return 'text-app-danger';
  if (stage.tone === 'info') return 'text-app-info';
  return stage.status === 'DONE' ? 'text-app-ink' : 'text-app-faint';
}

// What a screen reader hears. The dots carry the whole meaning of the compact
// view, so the status has to be spoken — a row of unlabelled dots is not a
// timeline to anyone not looking at it.
const STATUS_WORD: Record<JourneyStatus, string> = {
  DONE: 'done',
  CURRENT: 'in progress',
  BLOCKED: 'stopped',
  UPCOMING: 'not yet',
};

/**
 * Horizontal step timeline — compact variant for order cards and table rows.
 */
export function OrderTimeline(props: IOrderTimelineProps): React.ReactElement {
  const stages = buildOrderJourney(props, props.viewer);

  return (
    <ol className="flex items-center gap-0" aria-label="Order progress">
      {stages.map((stage, index) => (
        <li key={stage.key} className="flex items-center">
          <div className="flex flex-col items-center gap-1">
            <div
              className={[
                'h-2.5 w-2.5 flex-shrink-0 rounded-app-pill transition-colors duration-150',
                nodeClass(stage),
              ].join(' ')}
              aria-label={`${stage.label}: ${STATUS_WORD[stage.status]}`}
            />
          </div>

          {index < stages.length - 1 && (
            <div
              className={[
                'mx-1 h-px w-6',
                stages[index + 1]?.status === 'DONE' ? 'bg-app-brand' : 'bg-app-hairline',
              ].join(' ')}
              aria-hidden="true"
            />
          )}
        </li>
      ))}
    </ol>
  );
}

/**
 * Vertical detailed timeline — used on order detail views.
 *
 * Every stage shows the same five things: what it is, when, why it is where it
 * is, who has to act, and how far along the order is.
 */
export function OrderTimelineDetailed(props: IOrderTimelineProps): React.ReactElement {
  const stages = buildOrderJourney(props, props.viewer);

  return (
    <ol className="space-y-0" aria-label="Order progress">
      {stages.map((stage, index) => (
        <li key={stage.key} className="flex gap-3">
          {/* Spine */}
          <div className="flex flex-col items-center">
            <div
              className={[
                'mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-app-pill transition-colors duration-150',
                nodeClass(stage),
              ].join(' ')}
            />
            {index < stages.length - 1 && (
              <div
                className={[
                  'mb-1 mt-1 w-px flex-1',
                  stages[index + 1]?.status === 'DONE' ? 'bg-app-brand/40' : 'bg-app-hairline',
                ].join(' ')}
                aria-hidden="true"
              />
            )}
          </div>

          {/* Stage */}
          <div className="min-w-0 pb-4">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <p className={['app-body', textClass(stage)].join(' ')}>{stage.label}</p>
              {/* Who the order is waiting on — the one thing someone checking a
                  stalled order is actually trying to find out. */}
              <span className="app-meta text-app-faint">· {stage.actor}</span>
            </div>
            {stage.at && <p className="app-meta mt-0.5 text-app-faint">{formatDate(stage.at)}</p>}
            {stage.explanation && (
              <p className="app-meta mt-0.5 text-app-faint">{stage.explanation}</p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
