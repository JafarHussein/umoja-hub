'use client';

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

function getStatusColor(status: string): string {
  switch (status) {
    case 'OPEN': return 'text-accent-green bg-accent-green/10 border-accent-green/20';
    case 'MINIMUM_MET': return 'text-blue-400 bg-blue-900/20 border-blue-800/30';
    case 'CLOSED': return 'text-text-secondary bg-surface-secondary border-white/5';
    case 'FULFILLED': return 'text-text-secondary bg-surface-secondary border-white/5';
    case 'CANCELLED': return 'text-red-400 bg-red-900/20 border-red-800/30';
    default: return 'text-text-secondary bg-surface-secondary border-white/5';
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
  const statusColorClasses = getStatusColor(status);

  return (
    <div className="bg-surface-elevated border border-white/5 rounded p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h4 className="font-heading text-t3 text-text-primary">{inputType}</h4>
          <p className="font-body text-t5 text-text-secondary mt-1">{supplierName}</p>
        </div>
        <span
          className={`font-body text-t6 px-2 py-1 rounded-[2px] border ${statusColorClasses}`}
        >
          {status.replace('_', ' ')}
        </span>
      </div>

      {/* Price and quantity */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-surface-secondary border border-white/5 rounded p-3">
          <p className="font-body text-t6 text-text-secondary mb-1">Per member</p>
          <p className="font-mono text-t3 text-text-primary">KES {pricePerMember.toLocaleString()}</p>
        </div>
        <div className="bg-surface-secondary border border-white/5 rounded p-3">
          <p className="font-body text-t6 text-text-secondary mb-1">Quantity</p>
          <p className="font-mono text-t3 text-text-primary">{quantityPerMember} units</p>
        </div>
      </div>

      {/* Member progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="font-body text-t5 text-text-secondary">
            {currentMemberCount} / {minimumMembers} members
          </span>
          {membersNeeded > 0 && (
            <span className="font-body text-t6 text-text-disabled">
              {membersNeeded} more needed
            </span>
          )}
        </div>
        <div className="h-1.5 bg-surface-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-accent-green rounded-full transition-all duration-250"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Deadline */}
      <div className="flex items-center justify-between">
        <p className="font-body text-t6 text-text-disabled">
          Deadline:{' '}
          {new Date(joiningDeadline).toLocaleDateString('en-KE', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </p>
        <p className="font-body text-t6 text-text-secondary">
          {getDeadlineText(joiningDeadline)}
        </p>
      </div>
    </div>
  );
}
