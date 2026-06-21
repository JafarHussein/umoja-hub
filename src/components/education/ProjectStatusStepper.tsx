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
          'w-2.5 h-2.5 rounded-app-pill flex-shrink-0 mt-0.5',
          state === 'complete' ? 'bg-app-brand' : '',
          state === 'current' && !isDenied && !isRevision ? 'bg-app-brand animate-pulse' : '',
          state === 'future' ? 'bg-app-sunken border border-app-hairline' : '',
          isDenied ? 'bg-app-danger' : '',
          isRevision ? 'bg-app-warning' : '',
        ]
          .filter(Boolean)
          .join(' ');

        const labelClass = [
          state === 'current' && !isDenied && !isRevision ? 'app-body-strong' : 'app-body',
          state === 'complete' ? 'text-app-muted' : '',
          state === 'current' && !isDenied && !isRevision ? 'text-app-ink' : '',
          state === 'future' ? 'text-app-faint' : '',
          isDenied ? 'text-app-danger' : '',
          isRevision ? 'text-app-warning' : '',
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <div key={step}>
            <div className="flex items-start gap-3">
              <div className={dotClass} aria-hidden="true" />
              <span className={labelClass}>{STEP_LABEL[step]}</span>
            </div>
            {!isLast && <div className="ml-[4px] h-4 w-px bg-app-hairline" aria-hidden="true" />}
          </div>
        );
      })}
    </div>
  );
}
