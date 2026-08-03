# Screenshots

This directory holds the images referenced by the root `README.md`.

Capture them with the exact filenames listed in [`../SCREENSHOT_PLAN.md`](../SCREENSHOT_PLAN.md):

```bash
npm run demo
npm run dev                            # serve (separate terminal)
tsx scripts/capture-screenshots.ts     # capture all PNGs into this folder
```

Until captured, the README image slots will show their descriptive alt text. The
filenames are stable — re-running the capture script overwrites them in place.
