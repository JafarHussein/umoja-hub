import React from 'react';
import { ProjectStatus } from '@/types';

export interface IProjectStatusStepperProps {
  status: ProjectStatus;
}

const STEP_ORDER: ProjectStatus[] = [
  ProjectStatus.BRIEF_GENERATED,
  ProjectStatus.IN_PROGRESS,
  ProjectStatus.SUBMITTED,
  ProjectStatus.UNDER_PEER_REVIEW,
  ProjectStatus.UNDER_LECTURER_REVIEW,
  ProjectStatus.VERIFIED,
  ProjectStatus.REVISION_REQUIRED,
  ProjectStatus.DENIED,
];

const STEP_LABEL: Record<ProjectStatus, string> = {
  [ProjectStatus.BRIEF_GENERATED]: 'Brief generated',
  [ProjectStatus.IN_PROGRESS]: 'In progress',
  [ProjectStatus.SUBMITTED]: 'Submitted',
  [ProjectStatus.UNDER_PEER_REVIEW]: 'Peer review',
  [ProjectStatus.UNDER_LECTURER_REVIEW]: 'Lecturer review',
  [ProjectStatus.VERIFIED]: 'Verified',
  [ProjectStatus.REVISION_REQUIRED]: 'Revision required',
  [ProjectStatus.DENIED]: 'Denied',
};

type StepState = 'complete' | 'current' | 'future';

function getStepState(step: ProjectStatus, current: ProjectStatus): StepState {
  const stepIdx = STEP_ORDER.indexOf(step);
  const currentIdx = STEP_ORDER.indexOf(current);
  if (stepIdx < currentIdx) return 'complete';
  if (stepIdx === currentIdx) return 'current';
  return 'future';
}

export function ProjectStatusStepper({
  status,
}: IProjectStatusStepperProps): React.ReactElement {
  return (
    <div>
      {STEP_ORDER.map((step, idx) => {
        const state = getStepState(step, status);
        const isLast = idx === STEP_ORDER.length - 1;
        const isDenied = step === ProjectStatus.DENIED && state === 'current';
        const isRevision = step === ProjectStatus.REVISION_REQUIRED && state === 'current';

        const dotClass = [
          'w-2.5 h-2.5 rounded-full flex-shrink-0 mt-0.5',
          state === 'complete' ? 'bg-brand' : '',
          state === 'current' && !isDenied && !isRevision
            ? 'bg-brand animate-pulse'
            : '',
          state === 'future' ? 'bg-surface-raised border border-zinc-800/50' : '',
          isDenied ? 'bg-red-600' : '',
          isRevision ? 'bg-amber-500' : '',
        ]
          .filter(Boolean)
          .join(' ');

        const labelClass = [
          'text-t5 font-body',
          state === 'complete' ? 'text-fg-muted' : '',
          state === 'current' && !isDenied && !isRevision
            ? 'text-fg font-medium'
            : '',
          state === 'future' ? 'text-fg-disabled' : '',
          isDenied ? 'text-red-400' : '',
          isRevision ? 'text-amber-400' : '',
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <div key={step}>
            <div className="flex items-start gap-3">
              <div className={dotClass} aria-hidden="true" />
              <span className={labelClass}>{STEP_LABEL[step]}</span>
            </div>
            {!isLast && (
              <div className="ml-[4px] w-px h-4 bg-zinc-800/50" aria-hidden="true" />
            )}
          </div>
        );
      })}
    </div>
  );
}
