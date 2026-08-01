import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({ dir: './' });

// ---------------------------------------------------------------------------
// Integration tests — `12_TESTING_STRATEGY.md` §3.2.
//
// Separate from jest.config.ts because these run against a real MongoDB, so
// `npm test` stays binary-free. CI runs them as their own `integration` job
// against a mongo:7 service container; locally they fall back to
// mongodb-memory-server-core, which downloads a ~400 MB binary on first use and
// caches it. See the suite header for how the two paths are selected.
//
// A separate config rather than an env-var switch: npm scripts that set env
// vars inline are not portable to Windows, which is the primary dev platform
// here.
// ---------------------------------------------------------------------------

const config: Config = {
  coverageProvider: 'v8',
  // These exercise database wrappers, never the DOM.
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testMatch: ['<rootDir>/src/**/*.integration.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // Starting the in-memory server has to extract the binary on a cold cache.
  testTimeout: 120_000,
  // The suite shares one in-memory server per file; running files in parallel
  // spawns one mongod each, which is slow and memory-hungry on a laptop.
  maxWorkers: 1,
};

export default createJestConfig(config);
