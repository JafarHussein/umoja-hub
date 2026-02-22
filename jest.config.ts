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
    global: {
      lines: 70,
      branches: 65,
      functions: 70,
    },
    // Folder-level thresholds re-enabled in Phase 1 once files exist:
    // './src/lib/trust/':      { lines: 90 }
    // './src/lib/educationhub/': { lines: 90 }
    // './src/lib/validation/': { lines: 95 }
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/app/layout.tsx',
    '!src/app/page.tsx',
  ],
};

export default createJestConfig(config);
