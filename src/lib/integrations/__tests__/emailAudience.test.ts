import { renderLifecycleEmail } from '../emailTemplates';

// ---------------------------------------------------------------------------
// The footer is a factual claim about why this email arrived, and it was making
// the same claim to everyone. An administrator alerted to a farmer's
// verification was told they had received it "because of activity on your
// UmojaHub account" — they had had none. These tests pin the distinction so it
// cannot quietly collapse back into one sentence.
// ---------------------------------------------------------------------------

const BASE = {
  heading: 'New verification request',
  intro: 'A farmer submitted documents for verification.',
};

const SUBJECT_FOOTER = /because of activity on your UmojaHub account/;
const ADMIN_FOOTER = /because you administer UmojaHub/;

describe('lifecycle email footer by audience', () => {
  it('tells the subject the email is about their own account', () => {
    const html = renderLifecycleEmail({ ...BASE, audience: 'SUBJECT' });
    expect(html).toMatch(SUBJECT_FOOTER);
    expect(html).not.toMatch(ADMIN_FOOTER);
  });

  it('tells an administrator the email concerns someone else', () => {
    const html = renderLifecycleEmail({ ...BASE, audience: 'ADMIN' });
    expect(html).toMatch(ADMIN_FOOTER);
    expect(html).not.toMatch(SUBJECT_FOOTER);
    // The claim must be explicit, not merely absent: an operator who cannot
    // tell whose account an alert is about will go looking on their own.
    expect(html).toMatch(/not your own/);
  });

  it('defaults to the subject wording when no audience is stated', () => {
    // The overwhelming majority of mail is to the person it happened to, so the
    // unstated case must be the safe one.
    const html = renderLifecycleEmail(BASE);
    expect(html).toMatch(SUBJECT_FOOTER);
  });

  it('escapes the heading regardless of audience', () => {
    for (const audience of ['SUBJECT', 'ADMIN'] as const) {
      const html = renderLifecycleEmail({
        ...BASE,
        audience,
        heading: '<script>alert(1)</script>',
      });
      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    }
  });
});
