import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'editor',
    environment: 'jsdom',
    include: ['test/**/*.test.{ts,tsx}'],
    setupFiles: ['./test/setup.ts'],
    restoreMocks: true,
    typecheck: {
      enabled: true,
      include: ['test/**/*.test-d.{ts,tsx}'],
      tsconfig: './tsconfig.json',
    },
  },
});
