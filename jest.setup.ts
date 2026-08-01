import '@testing-library/jest-dom';

// No test may reach a real Redis. `cache.ts` and `rateLimit.ts` construct an
// Upstash client at module load whenever these are set, and next/jest loads
// `.env.local`, which defines them — so without this a unit test would silently
// talk to the network. Runs before any test module is evaluated, which is what
// makes it effective against module-scope clients.
delete process.env['UPSTASH_REDIS_REST_URL'];
delete process.env['UPSTASH_REDIS_REST_TOKEN'];
