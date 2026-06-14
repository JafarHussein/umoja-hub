// ---------------------------------------------------------------------------
// University email-domain allowlist (AUTH-05). A student's institutional email
// must sit on one of these domains before a verification pin is issued. This is
// a starter set of accredited Kenyan universities — extend as institutions are
// onboarded. Domains are matched case-insensitively against the full host after
// the `@`, so subdomains (e.g. students.uonbi.ac.ke) must be listed explicitly.
// ---------------------------------------------------------------------------

const ALLOWED_UNIVERSITY_DOMAINS = new Set<string>([
  'uonbi.ac.ke',
  'students.uonbi.ac.ke',
  'ku.ac.ke',
  'students.ku.ac.ke',
  'jkuat.ac.ke',
  'students.jkuat.ac.ke',
  'strathmore.edu',
  'mu.ac.ke',
  'egerton.ac.ke',
  'tukenya.ac.ke',
  'usiu.ac.ke',
  'dkut.ac.ke',
  'maseno.ac.ke',
  'mmust.ac.ke',
]);

export function isAllowedUniversityDomain(email: string): boolean {
  const at = email.lastIndexOf('@');
  if (at === -1) return false;
  const domain = email.slice(at + 1).toLowerCase().trim();
  return ALLOWED_UNIVERSITY_DOMAINS.has(domain);
}
