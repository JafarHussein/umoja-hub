'use client';

interface ISupplierRegistrations {
  kebsNumber?: string;
  pcpbNumber?: string;
  kephisNumber?: string;
}

interface ISupplierCardProps {
  businessName: string;
  county: string;
  inputCategories: string[];
  registrations: ISupplierRegistrations;
  contactPhone?: string;
  physicalAddress?: string;
  verifiedAt?: string;
}

function RegistrationBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-t6 text-text-disabled uppercase">{label}</span>
      <span className="font-mono text-t6 text-accent-green">{value}</span>
    </div>
  );
}

export default function SupplierCard({
  businessName,
  county,
  inputCategories,
  registrations,
  contactPhone,
  physicalAddress,
  verifiedAt,
}: ISupplierCardProps) {
  const hasRegistrations =
    registrations.kebsNumber || registrations.pcpbNumber || registrations.kephisNumber;

  return (
    <div className="bg-surface-elevated border border-white/5 rounded p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-heading text-t3 text-text-primary truncate">{businessName}</h4>
            {/* Verified badge */}
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-label="Verified supplier"
              className="flex-shrink-0"
            >
              <path
                d="M3 8L6.5 11.5L13 4.5"
                stroke="#007F4E"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <p className="font-body text-t5 text-text-secondary mt-1">{county}</p>
        </div>
      </div>

      {/* Input categories */}
      {inputCategories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {inputCategories.map((cat) => (
            <span
              key={cat}
              className="font-body text-t6 text-text-secondary bg-surface-secondary border border-white/5 px-2 py-1 rounded-[2px]"
            >
              {cat.replace('_', ' ')}
            </span>
          ))}
        </div>
      )}

      {/* Registration numbers */}
      {hasRegistrations && (
        <div className="mb-4 p-3 bg-surface-secondary border border-white/5 rounded space-y-1">
          {registrations.kebsNumber && (
            <RegistrationBadge label="KEBS" value={registrations.kebsNumber} />
          )}
          {registrations.pcpbNumber && (
            <RegistrationBadge label="PCPB" value={registrations.pcpbNumber} />
          )}
          {registrations.kephisNumber && (
            <RegistrationBadge label="KEPHIS" value={registrations.kephisNumber} />
          )}
        </div>
      )}

      {/* Contact details */}
      <div className="space-y-1">
        {contactPhone && (
          <p className="font-body text-t5 text-text-secondary">
            <span className="text-text-disabled">Tel: </span>
            <a
              href={`tel:${contactPhone}`}
              className="hover:text-text-primary transition-all duration-150"
            >
              {contactPhone}
            </a>
          </p>
        )}
        {physicalAddress && (
          <p className="font-body text-t5 text-text-secondary">
            <span className="text-text-disabled">Location: </span>
            {physicalAddress}
          </p>
        )}
        {verifiedAt && (
          <p className="font-body text-t6 text-text-disabled">
            Verified{' '}
            {new Date(verifiedAt).toLocaleDateString('en-KE', {
              month: 'short',
              year: 'numeric',
            })}
          </p>
        )}
      </div>
    </div>
  );
}
