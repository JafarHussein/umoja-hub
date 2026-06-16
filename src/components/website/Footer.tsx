/**
 * Website footer. Plain, non-marketing description (WEBSITE_PURPOSE_V1
 * Principle 1). Server component.
 */
export function Footer() {
  return (
    <footer className="mt-20 border-t border-border">
      <div className="mx-auto max-w-6xl space-y-3 px-4 py-10 font-body text-read-meta text-fg-muted">
        <p className="font-heading text-read-h3 text-fg">
          Umoja<span className="text-brand-text">Hub</span>
        </p>
        <p className="max-w-reading">
          Verification infrastructure for Kenyan farmers and computer-science students. UmojaHub
          records who is verified, by whom, and on what evidence — so strangers can transact with
          less risk.
        </p>
        <p className="text-fg-subtle">
          This site explains the platform in full and requires no account to read.
        </p>
      </div>
    </footer>
  );
}
