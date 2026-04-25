import type { Config } from 'jest';

const config: Config = {
  // Use ts-jest to handle TypeScript files
  preset: 'ts-jest',

  // Node environment — correct for Next.js API route handlers
  testEnvironment: 'node',

  // Only run unit + API tests (not Playwright e2e)
  testMatch: [
    '<rootDir>/src/__tests__/**/*.test.ts',
  ],

  // Path alias — mirrors tsconfig paths so @/ imports resolve
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^uuid$': '<rootDir>/src/__tests__/__mocks__/uuid.js',
    '^next/cache$': '<rootDir>/src/__tests__/__mocks__/next-cache.js',
  },

  // Run setup before each test file
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],

  // Collect coverage from source files
  collectCoverageFrom: [
    'src/services/**/*.ts',
    'src/lib/**/*.ts',
    'src/app/api/**/*.ts',
    '!src/**/*.d.ts',
  ],

  // Enforce minimum test coverage
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },

  // ts-jest config — skip type-checking for speed (tsc already validates)
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        // Allow importing .js extensions and jsx
        module: 'commonjs',
        esModuleInterop: true,
      },
      diagnostics: false, // skip ts-jest type errors — use tsc for that
    }],
  },

  // Don't transform node_modules except these ESM packages
  transformIgnorePatterns: [
    'node_modules/(?!(next-test-api-route-handler|uuid)/)',
  ],

  // Clear mocks between every test
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // Verbose output
  verbose: true,
};

export default config;
