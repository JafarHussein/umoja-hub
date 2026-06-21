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
      <span className="app-label text-app-muted">{label}</span>
      <span className="app-data-m text-app-brand">{value}</span>
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
    <div className="rounded-app-card border border-app-hairline bg-app-card p-6">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="app-h2 truncate text-app-ink">{businessName}</h4>
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
                stroke="#1E5C45"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <p className="app-meta mt-1 text-app-muted">{county}</p>
        </div>
      </div>

      {/* Input categories */}
      {inputCategories.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {inputCategories.map((cat) => (
            <span
              key={cat}
              className="app-label rounded-app-pill border border-app-hairline bg-app-sunken px-2 py-0.5 capitalize text-app-muted"
            >
              {cat.replace('_', ' ').toLowerCase()}
            </span>
          ))}
        </div>
      )}

      {/* Registration numbers */}
      {hasRegistrations && (
        <div className="mb-4 space-y-1 rounded-app-control border border-app-hairline bg-app-sunken p-3">
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
          <p className="app-body text-app-muted">
            <span className="text-app-faint">Tel: </span>
            <a href={`tel:${contactPhone}`} className="transition-colors duration-150 hover:text-app-ink">
              {contactPhone}
            </a>
          </p>
        )}
        {physicalAddress && (
          <p className="app-body text-app-muted">
            <span className="text-app-faint">Location: </span>
            {physicalAddress}
          </p>
        )}
        {verifiedAt && (
          <p className="app-meta text-app-faint">
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
