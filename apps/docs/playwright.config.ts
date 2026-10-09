import { defineConfig, devices } from '@playwright/test';

const port = 4173;

/**
 * Local-only browser acceptance. Runs against the production build (`vite preview`).
 * Chromium only for now; Firefox/WebKit are listed in ACCESSIBILITY.md as pending.
 */
export default defineConfig({
  testDir: './e2e',
  outputDir: './test-results',
  fullyParallel: true,
  forbidOnly: true,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: 'retain-on-failure',
    locale: 'zh-CN',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `pnpm build && pnpm preview`,
    url: `http://127.0.0.1:${port}`,
    // Reusing a leftover server once ran the suite against a stale build; opt in explicitly.
    reuseExistingServer: process.env.PW_REUSE_SERVER === '1',
    timeout: 120_000,
  },
});
