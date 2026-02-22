/**
 * Public landing page — Phase 6 will implement the full version.
 * This placeholder confirms the design system is wired correctly.
 */
export default function LandingPage(): React.ReactElement {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-surface-primary px-4">
      <div className="max-w-2xl w-full space-y-6 text-center">
        <div className="flex justify-center">
          {/* Logo placeholder until public/images/logo.svg is in place */}
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded bg-accent-green" />
            <span className="font-heading text-t2 font-semibold">
              <span className="text-text-primary">Umoja</span>
              <span className="text-accent-green">Hub</span>
            </span>
          </div>
        </div>

        <h1 className="font-heading text-t1 font-semibold text-text-primary">
          Infrastructure for Food Security and Technical Talent in Kenya
        </h1>

        <p className="font-body text-t4 text-text-secondary max-w-lg mx-auto">
          A verified farmer marketplace with M-Pesa checkout and a hands-on experience platform for
          CS students — built for Kenya, designed to scale.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <a
            href="/auth/login"
            className="inline-flex items-center justify-center min-h-[44px] px-6 rounded-sm bg-accent-green text-text-primary font-body text-t5 font-medium transition-all duration-150 hover:opacity-90"
          >
            Sign in
          </a>
          <a
            href="/auth/register"
            className="inline-flex items-center justify-center min-h-[44px] px-6 rounded-sm border border-white/10 text-text-secondary font-body text-t5 transition-all duration-150 hover:border-white/20 hover:text-text-primary"
          >
            Create account
          </a>
        </div>

        <div className="pt-12 border-t border-white/5">
          <p className="font-mono text-t6 text-text-disabled">
            Phase 0 — Foundation complete. Authentication next.
          </p>
        </div>
      </div>
    </main>
  );
}
