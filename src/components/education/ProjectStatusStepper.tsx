import React from 'react';
import { ProjectStatus } from '@/types';

export interface IProjectStatusStepperProps {
  status: ProjectStatus;
}

// ---------------------------------------------------------------------------
// Where the student is, and what happens next.
//
// The spine is linear and short, because the workflow is: build it, write it
// up, have it read, show it running, done. Two states are not steps on that
// spine and are not drawn as though they were — a revision request sends the
// student back to building, and a denial ends the project. Listing them as
// later stages, which this component used to do, told a student that being
// denied came after being complete.
// ---------------------------------------------------------------------------

const SPINE: ProjectStatus[] = [
  ProjectStatus.BRIEF_GENERATED,
  ProjectStatus.IN_PROGRESS,
  ProjectStatus.UNDER_LECTURER_REVIEW,
  ProjectStatus.READY_FOR_DEMONSTRATION,
  ProjectStatus.DEMONSTRATION_SCHEDULED,
  ProjectStatus.VERIFIED,
];

const STEP_LABEL: Record<ProjectStatus, string> = {
  [ProjectStatus.BRIEF_GENERATED]: 'Brief set',
  [ProjectStatus.IN_PROGRESS]: 'Building and writing up',
  [ProjectStatus.SUBMITTED]: 'Submitted',
  [ProjectStatus.UNDER_PEER_REVIEW]: 'With a peer reader',
  [ProjectStatus.UNDER_LECTURER_REVIEW]: 'Report with your lecturer',
  [ProjectStatus.READY_FOR_DEMONSTRATION]: 'Ready to demonstrate',
  [ProjectStatus.DEMONSTRATION_SCHEDULED]: 'Demonstration booked',
  [ProjectStatus.VERIFIED]: 'Complete',
  [ProjectStatus.REVISION_REQUIRED]: 'Changes requested',
  [ProjectStatus.DENIED]: 'Closed',
};

/**
 * Which step on the spine a status sits at.
 *
 * A revision request is drawn at the building step, because that is where the
 * student actually is: they have work to do on the project.
 */
function spineIndexOf(status: ProjectStatus): number {
  if (status === ProjectStatus.REVISION_REQUIRED) {
    return SPINE.indexOf(ProjectStatus.IN_PROGRESS);
  }
  if (status === ProjectStatus.UNDER_PEER_REVIEW || status === ProjectStatus.SUBMITTED) {
    return SPINE.indexOf(ProjectStatus.UNDER_LECTURER_REVIEW);
  }
  const index = SPINE.indexOf(status);
  return index === -1 ? 0 : index;
}

type StepState = 'complete' | 'current' | 'future';

export function ProjectStatusStepper({ status }: IProjectStatusStepperProps): React.ReactElement {
  const currentIdx = spineIndexOf(status);
  const isRevision = status === ProjectStatus.REVISION_REQUIRED;
  const isDenied = status === ProjectStatus.DENIED;

  return (
    <div>
      {SPINE.map((step, idx) => {
        const state: StepState =
          idx < currentIdx ? 'complete' : idx === currentIdx ? 'current' : 'future';
        const isLast = idx === SPINE.length - 1;
        const flagged = state === 'current' && (isRevision || isDenied);

        const dotClass = [
          'w-2.5 h-2.5 rounded-app-pill flex-shrink-0 mt-0.5',
          state === 'complete' ? 'bg-app-brand' : '',
          state === 'current' && !flagged ? 'bg-app-brand animate-pulse' : '',
          state === 'future' ? 'bg-app-sunken border border-app-hairline' : '',
          flagged && isRevision ? 'bg-app-warning' : '',
          flagged && isDenied ? 'bg-app-danger' : '',
        ]
          .filter(Boolean)
          .join(' ');

        const labelClass = [
          state === 'current' ? 'app-body-strong' : 'app-body',
          state === 'complete' ? 'text-app-muted' : '',
          state === 'current' && !flagged ? 'text-app-ink' : '',
          state === 'future' ? 'text-app-faint' : '',
          flagged && isRevision ? 'text-app-warning' : '',
          flagged && isDenied ? 'text-app-danger' : '',
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <div key={step}>
            <div className="flex items-start gap-3">
              <div className={dotClass} aria-hidden="true" />
              <span className={labelClass}>
                {/* At the step they are on, the branch label is the truthful
                    one: "Changes requested" says more than "Building". */}
                {state === 'current' && flagged ? STEP_LABEL[status] : STEP_LABEL[step]}
              </span>
            </div>
            {!isLast && <div className="ml-[4px] h-4 w-px bg-app-hairline" aria-hidden="true" />}
          </div>
        );
      })}
    </div>
  );
}
