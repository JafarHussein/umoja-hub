'use client';

import { cn } from '@/lib/cn';

interface IGroupOrderCardProps {
  groupOrderId: string;
  supplierId: string;
  supplierName: string;
  inputType: string;
  quantityPerMember: number;
  pricePerMember: number;
  joiningDeadline: string;
  minimumMembers: number;
  currentMemberCount: number;
  status: string;
  proposedBy: string;
}

// Status pill tones — app design-system tints (state via text + tint, paired
// with the status label text so colour is never the sole signal).
function getStatusClasses(status: string): string {
  switch (status) {
    case 'OPEN':
      return 'bg-app-success-surface text-app-success';
    case 'MINIMUM_MET':
      return 'bg-app-info-surface text-app-info';
    case 'CANCELLED':
      return 'bg-app-danger-surface text-app-danger';
    case 'CLOSED':
    case 'FULFILLED':
    default:
      return 'bg-app-sunken text-app-muted';
  }
}

function getDeadlineText(deadlineStr: string): string {
  const deadline = new Date(deadlineStr);
  const now = new Date();
  const diffMs = deadline.getTime() - now.getTime();

  if (diffMs < 0) return 'Deadline passed';

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (diffDays > 0) return `${diffDays} day${diffDays !== 1 ? 's' : ''} remaining`;
  if (diffHours > 0) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} remaining`;
  return 'Less than 1 hour remaining';
}

export default function GroupOrderCard({
  supplierName,
  inputType,
  quantityPerMember,
  pricePerMember,
  joiningDeadline,
  minimumMembers,
  currentMemberCount,
  status,
}: IGroupOrderCardProps) {
  const membersNeeded = Math.max(0, minimumMembers - currentMemberCount);
  const progressPercent = Math.min(100, Math.round((currentMemberCount / minimumMembers) * 100));

  return (
    <div className="rounded-app-card border border-app-hairline bg-app-card p-6">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h4 className="app-h2 text-app-ink">{inputType}</h4>
          <p className="app-body mt-1 text-app-muted">{supplierName}</p>
        </div>
        <span
          className={cn(
            'app-label inline-flex items-center rounded-app-pill px-2 py-0.5',
            getStatusClasses(status)
          )}
        >
          {status.replace('_', ' ')}
        </span>
      </div>

      {/* Price and quantity */}
      <div className="mb-4 grid grid-cols-2 gap-4">
        <div className="rounded-app-control border border-app-hairline bg-app-sunken p-3">
          <p className="app-label mb-1 text-app-muted">Per member</p>
          <p className="app-data-l text-app-ink">KSh {pricePerMember.toLocaleString()}</p>
        </div>
        <div className="rounded-app-control border border-app-hairline bg-app-sunken p-3">
          <p className="app-label mb-1 text-app-muted">Quantity</p>
          <p className="app-data-l text-app-ink">{quantityPerMember} units</p>
        </div>
      </div>

      {/* Member progress */}
      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="app-body text-app-muted">
            {currentMemberCount} / {minimumMembers} members
          </span>
          {membersNeeded > 0 && (
            <span className="app-meta text-app-faint">{membersNeeded} more needed</span>
          )}
        </div>
        <div className="h-1.5 overflow-hidden rounded-app-pill bg-app-sunken">
          <div
            className="h-full rounded-app-pill bg-app-brand transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Deadline */}
      <div className="flex items-center justify-between">
        <p className="app-meta text-app-faint">
          Deadline:{' '}
          {new Date(joiningDeadline).toLocaleDateString('en-KE', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </p>
        <p className="app-meta text-app-muted">{getDeadlineText(joiningDeadline)}</p>
      </div>
    </div>
  );
}
