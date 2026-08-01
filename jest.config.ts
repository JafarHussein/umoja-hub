import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({ dir: './' });

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  // Playwright specs live under e2e/ and use `.spec.ts`, which Jest's default
  // testMatch would otherwise pick up and fail on. They run via `npm run test:e2e`.
  //
  // `*.integration.test.ts` needs a real MongoDB and downloads a ~400 MB binary
  // on first run, so it is excluded here and runs via `npm run test:integration`
  // (jest.integration.config.ts). Keeping it out of the default gate is what
  // lets `npm test` stay fast and dependency-free in CI.
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/e2e/',
    '\\.integration\\.test\\.ts$',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  coverageThreshold: {
    // Global thresholds grow incrementally as coverage builds across phases.
    // Phase 1: validation schemas only. Phase 3+: trust/. Phase 5+: educationhub/. Phase 8: global.
    global: {},
    './src/lib/validation/': { lines: 95, branches: 90, functions: 95 },
    './src/lib/trust/':        { lines: 90 },
    // './src/lib/educationhub/': { lines: 90 }  — added in Phase 5
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/app/layout.tsx',
    '!src/app/page.tsx',
  ],
};

export default createJestConfig(config);
