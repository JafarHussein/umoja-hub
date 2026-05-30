interface DataTableRow {
  readonly indicator: string;
  readonly value: string;
}

interface DataTableProps {
  readonly rows: DataTableRow[];
  readonly showHeaders?: boolean;
  readonly indicatorLabel?: string;
  readonly valueLabel?: string;
  readonly auditTimestamp?: string;
  readonly indicatorWidth?: string;
  readonly className?: string;
}

export function DataTable({
  rows,
  showHeaders = true,
  indicatorLabel = 'INDICATOR',
  valueLabel = 'VALUE',
  auditTimestamp,
  indicatorWidth = 'w-48',
  className = '',
}: DataTableProps) {
  return (
    /*
     * font-feature-settings applied inline because Tailwind's arbitrary
     * [font-feature-settings:...] syntax is used here to guarantee tnum
     * is active even when the parent overrides font-family.
     */
    <div
      className={`font-mono text-m2 [font-feature-settings:'tnum'_1,'ss01'_1] ${className}`}
    >
      {showHeaders && (
        <div className={`flex border-b border-rule pb-1.5`}>
          <span className={`${indicatorWidth} eyebrow text-text-disabled flex-shrink-0`}>
            {indicatorLabel}
          </span>
          <span className="eyebrow text-text-disabled">
            {valueLabel}
          </span>
        </div>
      )}

      {rows.map(({ indicator, value }) => (
        <div
          key={indicator}
          className="flex items-start border-b border-rule py-2 gap-4"
        >
          <span className={`${indicatorWidth} text-text-secondary flex-shrink-0 leading-snug`}>
            {indicator}
          </span>
          <span className="text-text-primary leading-snug">
            {value}
          </span>
        </div>
      ))}

      {auditTimestamp && (
        <div className="pt-2 eyebrow text-text-disabled">
          Audited: {auditTimestamp}
        </div>
      )}
    </div>
  );
}
