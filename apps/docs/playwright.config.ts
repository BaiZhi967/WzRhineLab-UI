import { defineConfig, devices } from '@playwright/test';

// PW_PORT lets parallel runs use their own server, build output and results folder.
const port = Number(process.env.PW_PORT ?? 4173);
const isolated = process.env.PW_PORT !== undefined;
const outDir = isolated ? `.pw-dist/${port}` : 'dist';

/**
 * Local-only browser acceptance. Runs against the production build (`vite preview`).
 * `test:e2e` = Chromium; `test:e2e:all` = Chromium + Firefox + WebKit (browsers via `playwright install`).
 */
export default defineConfig({
  testDir: './e2e',
  testIgnore: ['visual/**'],
  outputDir: isolated ? `./test-results-${port}` : './test-results',
  // Visual baselines are committed per platform: Chromium renders text differently across OSes.
  snapshotPathTemplate: '{testDir}/__screenshots__/{platform}/{arg}{ext}',
  expect: {
    toHaveScreenshot: {
      // Measured: run-to-run noise is at most 1 anti-aliased pixel; the smallest real token change
      // (border-strong darkened by 16/255, radius 4→3px) moved 17+ pixels. Keep the budget between.
      maxDiffPixels: 10,
      threshold: 0.05,
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
    },
  },
  fullyParallel: true,
  forbidOnly: true,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: isolated ? `playwright-report-${port}` : 'playwright-report' }]],
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: 'retain-on-failure',
    locale: 'zh-CN',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // `pnpm test:e2e` runs Chromium only; `pnpm test:e2e:all` adds Firefox and WebKit.
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    // `pnpm test:visual` compares against committed baselines; `test:visual:update` rewrites them.
    {
      name: 'visual',
      testDir: './e2e/visual',
      testIgnore: [],
      use: { ...devices['Desktop Chrome'], deviceScaleFactor: 1, colorScheme: 'light', reducedMotion: 'reduce' },
    },
  ],
  webServer: {
    command: isolated
      ? `pnpm typecheck && pnpm exec vite build --outDir ${outDir} && pnpm exec vite preview --host 127.0.0.1 --port ${port} --strictPort --outDir ${outDir}`
      : `pnpm build && pnpm preview`,
    url: `http://127.0.0.1:${port}`,
    // Reusing a leftover server once ran the suite against a stale build; opt in explicitly.
    reuseExistingServer: process.env.PW_REUSE_SERVER === '1',
    timeout: 120_000,
  },
});
