import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['**/*.e2e-spec.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    setupFiles: ['./src/shared/test/e2e/e2eSetup.ts'],
    testTimeout: 15000,
    pool: 'forks',
    poolOptions: {
      forks: {
        maxForks: 1,
      },
    },
  },
});
