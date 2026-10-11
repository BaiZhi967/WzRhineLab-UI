import { defineConfig, devices } from '@playwright/test';

const port = 4177;

/** Local-only acceptance for the Next.js App Router example, against `next build` + `next start`. */
export default defineConfig({
  testDir: './e2e',
  outputDir: './test-results',
  fullyParallel: true,
  forbidOnly: true,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: 'retain-on-failure',
    locale: 'zh-CN',
  },
  // `test:e2e` runs Chromium; `test:e2e:all` adds Firefox and WebKit.
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'pnpm build && pnpm start',
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: process.env.PW_REUSE_SERVER === '1',
    timeout: 300_000,
    env: { NEXT_TELEMETRY_DISABLED: '1' },
  },
});
