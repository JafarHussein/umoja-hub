import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({ dir: './' });

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  coverageThreshold: {
    // Global thresholds grow incrementally as coverage builds across phases.
    // Phase 1: validation schemas only. Phase 3+: trust/. Phase 5+: educationhub/. Phase 8: global.
    global: {},
    './src/lib/validation/': { lines: 95, branches: 90, functions: 95 },
    // './src/lib/trust/':        { lines: 90 }  — added in Phase 3
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
