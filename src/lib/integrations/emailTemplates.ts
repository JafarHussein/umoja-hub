/**
 * Branded, email-client-safe HTML templates for UmojaHub lifecycle emails.
 *
 * Email clients (Outlook, Gmail) ignore most modern CSS, so the layout is
 * table-based with inline styles only. Every lifecycle email follows the same
 * structure — context (heading + intro), what happened (optional detail rows),
 * the next step, and a single relevant call-to-action link — so the experience
 * is consistent across roles and events.
 */

const BRAND = '#5A2A2A';
const INK = '#1f2937';
const MUTED = '#6b7280';
const BORDER = '#e5e7eb';
const CANVAS = '#f4f1ec';

/**
 * Who this email is being written to, which decides what the footer may
 * truthfully claim.
 *
 * `SUBJECT` — the person the event happened to.
 * `ADMIN` — an operator being told about someone *else's* account.
 *
 * Without this distinction every email closed with "You received this email
 * because of activity on your UmojaHub account", which is false for every
 * operational broadcast: an administrator alerted to a farmer's verification
 * has had no activity on their own account at all.
 */
export type EmailAudience = 'SUBJECT' | 'ADMIN';

export interface LifecycleEmailParams {
  /** Who is reading. Defaults to SUBJECT. */
  audience?: EmailAudience;
  /** Recipient's first name, for the greeting. */
  firstName?: string;
  /** Bold heading at the top of the card — the headline of what happened. */
  heading: string;
  /** One or two sentences of context. */
  intro: string;
  /** Optional labelled detail rows, e.g. {'Order': 'UMJ-1029', 'Amount': 'KES 4,500'}. */
  details?: Record<string, string>;
  /** The concrete next step the recipient can take. */
  nextStep?: string;
  /** Call-to-action button label. */
  ctaLabel?: string;
  /** Absolute URL the CTA points to. */
  ctaUrl?: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function detailRows(details: Record<string, string>): string {
  return Object.entries(details)
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:4px 12px 4px 0;color:${MUTED};font-size:13px;white-space:nowrap;vertical-align:top">${escapeHtml(
            label
          )}</td>
          <td style="padding:4px 0;color:${INK};font-size:13px;font-weight:600;vertical-align:top">${escapeHtml(
            value
          )}</td>
        </tr>`
    )
    .join('');
}

/**
 * Render a complete lifecycle email document (subject is supplied separately by
 * the caller). Returns inline-styled HTML safe for all major email clients.
 */
export function renderLifecycleEmail(params: LifecycleEmailParams): string {
  const { audience = 'SUBJECT', firstName, heading, intro, details, nextStep, ctaLabel, ctaUrl } =
    params;

  const greeting = firstName ? `Hello ${escapeHtml(firstName)},` : 'Hello,';

  const detailsBlock = details
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:16px 0 4px;border-collapse:collapse">${detailRows(
        details
      )}</table>`
    : '';

  const nextStepBlock = nextStep
    ? `<p style="margin:16px 0 0;color:${INK};font-size:14px;line-height:1.6"><strong>Next step:</strong> ${escapeHtml(
        nextStep
      )}</p>`
    : '';

  const ctaBlock =
    ctaLabel && ctaUrl
      ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 4px">
           <tr>
             <td style="border-radius:8px;background:${BRAND}">
               <a href="${escapeHtml(ctaUrl)}" style="display:inline-block;padding:11px 22px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px">${escapeHtml(
                 ctaLabel
               )}</a>
             </td>
           </tr>
         </table>`
      : '';

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:${CANVAS};font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CANVAS};padding:24px 0">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:560px;max-width:92%;background:#ffffff;border:1px solid ${BORDER};border-radius:12px;overflow:hidden">
            <tr>
              <td style="background:${BRAND};padding:18px 28px">
                <span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:0.3px">UmojaHub</span>
              </td>
            </tr>
            <tr>
              <td style="padding:28px">
                <p style="margin:0 0 12px;color:${MUTED};font-size:14px">${greeting}</p>
                <h1 style="margin:0 0 10px;color:${INK};font-size:19px;line-height:1.35;font-weight:700">${escapeHtml(
                  heading
                )}</h1>
                <p style="margin:0;color:${INK};font-size:14px;line-height:1.6">${escapeHtml(intro)}</p>
                ${detailsBlock}
                ${nextStepBlock}
                ${ctaBlock}
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px;border-top:1px solid ${BORDER};background:#fbfaf8">
                <p style="margin:0;color:${MUTED};font-size:12px;line-height:1.5">
                  ${
                    audience === 'ADMIN'
                      ? 'You received this operational alert because you administer UmojaHub. It concerns another member&rsquo;s account, not your own.'
                      : 'You received this email because of activity on your UmojaHub account.'
                  }
                  UmojaHub — a trust-based agricultural marketplace and academic verification platform.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
