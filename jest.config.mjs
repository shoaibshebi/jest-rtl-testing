import nextJest from 'next/jest.js';

/**
 * next/jest wires up the SWC transform (so JSX/TS need no Babel config),
 * CSS and image mocks, `next/font`, environment-file loading, and the `@/*`
 * path alias from tsconfig.json.
 * Docs: https://nextjs.org/docs/app/guides/testing/jest
 */
const createJestConfig = nextJest({
  // Point at the Next.js app so its config is picked up.
  dir: './',
});

/** @type {import('jest').Config} */
const config = {
  // Runs after the test framework is installed, so `expect` exists and
  // jest-dom can extend it.
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],

  // React Testing Library needs a DOM.
  testEnvironment: 'jsdom',

  // Colocated tests (Counter.test.tsx next to Counter.tsx) plus a __tests__ dir.
  testMatch: [
    '<rootDir>/src/**/*.{test,spec}.{ts,tsx}',
    '<rootDir>/src/**/__tests__/**/*.{ts,tsx}',
  ],

  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.{test,spec}.{ts,tsx}',
    '!src/**/__fixtures__/**',
    '!src/app/**/layout.tsx',
  ],
};

// Exported as a promise-returning function so next/jest can load the
// Next.js config asynchronously.
export default createJestConfig(config);
