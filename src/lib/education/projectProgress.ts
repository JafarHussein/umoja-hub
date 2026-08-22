import { ProjectStatus, DemonstrationStatus } from '@/types';
import type { DocumentationStage } from './report';

// ---------------------------------------------------------------------------
// What stage is this project at, and what does the student do next.
//
// One function, derived from the three records that actually decide it — the
// engagement, the report and the current demonstration. The alternative is
// every screen working it out from status flags for itself, which is how a
// dashboard ends up telling a student their report is with their lecturer on
// one page and asking them to submit it on another.
//
// The output is deliberately a sentence and an action, not a set of booleans.
// A student should not have to assemble their own status out of five pills.
// ---------------------------------------------------------------------------

export interface ProgressInput {
  projectStatus: string;
  /**
   * Where the report stands, from `documentationStage`.
   *
   * There is no completion percentage to report any more: the report is written
   * outside UmojaHub and arrives finished, so the platform knows whether it has
   * been handed in and what the lecturer said, and does not know — and should
   * not pretend to know — how far along an unsubmitted one is.
   */
  documentationStage?: DocumentationStage;
  demonstration?: {
    status: string;
    scheduledFor?: Date | string;
  } | null;
}

export type ProgressTone = 'neutral' | 'action' | 'waiting' | 'warning' | 'done';

export interface ProjectProgress {
  /** Where they are, in three or four words. */
  stage: string;
  /** What happens next, as a sentence addressed to the student. */
  nextStep: string;
  tone: ProgressTone;
  /** The one thing to click, when there is one. */
  action?: { label: string; kind: 'START' | 'REPORT' | 'SUBMIT' | 'BOOK' | 'RESUME' };
}

function formatWhen(value: Date | string | undefined): string {
  if (!value) return 'the scheduled time';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return 'the scheduled time';
  return date.toLocaleString('en-KE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function projectProgress(input: ProgressInput): ProjectProgress {
  const { projectStatus, documentationStage, demonstration } = input;

  switch (projectStatus) {
    case ProjectStatus.BRIEF_GENERATED:
      return {
        stage: 'Not started',
        nextStep:
          'Your brief is ready. Start the project when you are ready to begin building — you can write your report as you go.',
        tone: 'action',
        action: { label: 'Start this project', kind: 'START' },
      };

    case ProjectStatus.IN_PROGRESS: {
      // A report sent back is a different situation from one never handed in,
      // even though the project is in the same state.
      if (documentationStage === 'CHANGES_REQUESTED') {
        return {
          stage: 'Changes requested',
          nextStep:
            'Your lecturer has asked for changes. Read their feedback, take it back into the system and the report, then upload the new version.',
          tone: 'warning',
          action: { label: 'Upload a new version', kind: 'SUBMIT' },
        };
      }
      return {
        stage: 'Building',
        nextStep:
          'Build the system, and write your report against the standard as you go. Upload it as a PDF when it is finished.',
        tone: 'neutral',
        action: { label: 'Your report', kind: 'REPORT' },
      };
    }

    case ProjectStatus.SUBMITTED:
    case ProjectStatus.UNDER_PEER_REVIEW:
    case ProjectStatus.UNDER_LECTURER_REVIEW:
      return {
        stage: 'With your lecturer',
        nextStep:
          'Your report is with your lecturer. They will either accept it and open your demonstration, or tell you what to change. Nothing is needed from you until then.',
        tone: 'waiting',
      };

    case ProjectStatus.READY_FOR_DEMONSTRATION: {
      if (demonstration?.status === DemonstrationStatus.REQUESTED) {
        return {
          stage: 'Waiting on confirmation',
          nextStep: `You have asked to demonstrate at ${formatWhen(demonstration.scheduledFor)}. Your lecturer will confirm or offer another time.`,
          tone: 'waiting',
        };
      }
      if (demonstration?.status === DemonstrationStatus.DECLINED) {
        return {
          stage: 'Ready to demonstrate',
          nextStep:
            'Your lecturer could not take that time. Book another one — the reason they gave is on your demonstration.',
          tone: 'action',
          action: { label: 'Book a demonstration', kind: 'BOOK' },
        };
      }
      return {
        stage: 'Ready to demonstrate',
        nextStep:
          'Your report has been accepted. Book a time to show your lecturer the system running and answer their questions.',
        tone: 'action',
        action: { label: 'Book a demonstration', kind: 'BOOK' },
      };
    }

    case ProjectStatus.DEMONSTRATION_SCHEDULED: {
      if (demonstration?.status === DemonstrationStatus.COMPLETED) {
        return {
          stage: 'Awaiting your result',
          nextStep:
            'Your demonstration is done. Your lecturer is writing up their assessment and you will be told the outcome.',
          tone: 'waiting',
        };
      }
      return {
        stage: 'Demonstration booked',
        nextStep: `Attend your demonstration on ${formatWhen(demonstration?.scheduledFor)}. Have the system running, and be ready to explain why you built it the way you did.`,
        tone: 'action',
      };
    }

    case ProjectStatus.REVISION_REQUIRED:
      return {
        stage: 'Changes requested',
        nextStep:
          'Your lecturer has asked for more work. Resume the project, take their feedback back into the system, and upload a new version of your report.',
        tone: 'warning',
        action: { label: 'Resume this project', kind: 'RESUME' },
      };

    case ProjectStatus.VERIFIED:
      return {
        stage: 'Complete',
        nextStep:
          'You built it, you wrote it up, and you demonstrated it to your lecturer. This project is complete.',
        tone: 'done',
      };

    case ProjectStatus.DENIED:
      return {
        stage: 'Closed',
        nextStep:
          'This project was closed by your lecturer. Their reasons are in your feedback. You can start a new project.',
        tone: 'warning',
      };

    default:
      return {
        stage: 'In progress',
        nextStep: 'Open your project to see where it stands.',
        tone: 'neutral',
      };
  }
}
