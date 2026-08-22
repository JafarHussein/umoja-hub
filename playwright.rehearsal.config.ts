import base from './playwright.config';

// ---------------------------------------------------------------------------
// The end-to-end rehearsal, run on purpose.
//
// The default config ignores `rehearsal.spec.ts`, because that spec uploads to
// real file storage and CI holds only placeholder Cloudinary credentials —
// there it would fail for a reason that says nothing about the product. This
// config is the deliberate way in:
//
//   npm run test:e2e:rehearsal
//
// Everything else — the harness database and its guards, the fixtures, the
// built app on its own port — is inherited unchanged, so the rehearsal runs
// against exactly the world the rest of the suite runs against.
//
// A separate config rather than an environment variable: npm scripts that set
// env vars inline are not portable to Windows, which is the primary development
// platform here. The same reasoning is recorded in `jest.integration.config.ts`.
// ---------------------------------------------------------------------------

const rehearsalConfig = {
  ...base,
  testIgnore: [],
  testMatch: ['**/rehearsal.spec.ts'],
  // One worker: the rehearsal is a single ordered story, and its browser pass
  // reads the world the API half just built.
  workers: 1,
};

export default rehearsalConfig;
