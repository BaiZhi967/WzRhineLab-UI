import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'effects',
    environment: 'jsdom',
    include: ['test/**/*.test.{ts,tsx}'],
    setupFiles: ['./test/setup.ts'],
    restoreMocks: true,
  },
});
