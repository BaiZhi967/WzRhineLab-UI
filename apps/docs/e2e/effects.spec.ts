import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { setSettings } from './helpers';

/** M4 showcase effects and the motion player, in a real browser. */
test.use({ viewport: { width: 1280, height: 900 } });

const revealPlayer = (page: import('@playwright/test').Page) => page.getByRole('region', { name: 'ArchiveReveal' });
const scanPlayer = (page: import('@playwright/test').Page) => page.getByRole('region', { name: 'ScanSurface' });

test.describe('MotionPlayer', () => {
  for (const width of [1920, 1280, 768, 390]) {
    test(`lanes never leave a single orphan tile on a row · ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/#/motion/effects');
      await expect(revealPlayer(page).locator('.rl-player__lane')).toHaveCount(4);
      const tops = await revealPlayer(page)
        .locator('.rl-player__lane')
        .evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().top)));
      const perRow = Object.values(tops.reduce<Record<number, number>>((acc, t) => ({ ...acc, [t]: (acc[t] ?? 0) + 1 }), {}));
      expect([[4], [2, 2], [1, 1, 1, 1]].map(String)).toContain(String(perRow));
    });
  }

  test('shows the four MOTION.md lanes for each effect', async ({ page }) => {
    await page.goto('/#/motion/effects');
    for (const player of [revealPlayer(page), scanPlayer(page)]) {
      await expect(player.locator('.rl-player__lane')).toHaveCount(4);
      await expect(player.locator('.rl-player__lane-label > span:first-child')).toHaveText(['Default', 'Slow ×0.25', 'Reduced', 'Interrupt']);
    }
  });

  test('reveal: default settles, slow is still mid-flight, reduced is instant, interrupt reverses', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/#/motion/effects');
    const player = revealPlayer(page);
    const state = (lane: string) => player.locator(`[data-lane="${lane}"] .rl-reveal`);
    for (const lane of ['default', 'slow', 'reduced', 'interrupt']) await expect(state(lane)).toHaveAttribute('data-state', 'concealed');

    await player.getByRole('button', { name: '播放' }).click();
    // Reduced lane switches immediately, without passing through "animating".
    await expect(state('reduced')).toHaveAttribute('data-state', 'revealed', { timeout: 300 });
    await expect(state('reduced')).toHaveAttribute('data-reduced', 'true');
    // Default finishes (640ms); slow (2560ms) is still animating at that point.
    await expect(state('default')).toHaveAttribute('data-state', 'revealed', { timeout: 2000 });
    await expect(state('slow')).toHaveAttribute('data-state', 'animating');
    // Interrupt lane was reversed mid-flight and ends concealed.
    await expect(state('interrupt')).toHaveAttribute('data-state', 'concealed', { timeout: 2000 });
    await expect(state('slow')).toHaveAttribute('data-state', 'revealed', { timeout: 4000 });
    await expect(player.getByText(/第 1 次 · 目标：激活/)).toBeVisible();
  });

  test('the real text is exposed to assistive tech while glyphs are hidden', async ({ page }) => {
    await page.goto('/#/motion/effects');
    const lane = revealPlayer(page).locator('[data-lane="default"]');
    await expect(lane.locator('.rl-reveal__glyphs')).toHaveAttribute('aria-hidden', 'true');
    await expect(lane.locator('.rl-effect-sr')).toHaveText('受限记录');
    await revealPlayer(page).getByRole('button', { name: '播放' }).click();
    await expect(lane.locator('.rl-effect-sr')).toContainText('ARC-1024');
  });

  test('scan: one sweep per play; content stays clickable during the sweep', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/#/motion/effects');
    const player = scanPlayer(page);
    const lane = player.locator('[data-lane="default"]');
    await expect(lane.locator('.rl-scan__line')).toHaveCount(0);
    // The sweep line lives for one 900 ms sweep. Sample it in the page the moment it mounts:
    // reading it in a later round-trip raced its unmount under parallel WebKit load (detached node).
    const sampled = lane.evaluate(
      (el) =>
        new Promise<{ pointerEvents: string; animationName: string }>((resolve) => {
          const read = () => {
            const line = el.querySelector('.rl-scan__line');
            if (!line) return false;
            const cs = getComputedStyle(line);
            resolve({ pointerEvents: cs.pointerEvents, animationName: cs.animationName });
            return true;
          };
          if (read()) return;
          const observer = new MutationObserver(() => read() && observer.disconnect());
          observer.observe(el, { childList: true, subtree: true });
        }),
    );
    await player.getByRole('button', { name: '播放' }).click();
    expect(await sampled).toEqual({ pointerEvents: 'none', animationName: 'rl-scan-sweep' });
    // Reduced lane is flagged so CSS swaps the travelling sweep for a static outline (asserted below).
    await expect(player.locator('[data-lane="reduced"] .rl-scan')).toHaveAttribute('data-reduced', 'true');
    await expect(lane.locator('.rl-scan__line')).toHaveCount(0, { timeout: 3000 });
    await expect(lane).toContainText('第 1 次');
  });
});

test('reduced scan renders a static outline instead of the sweep animation', async ({ page }) => {
  await setSettings(page, { motion: 'reduce' });
  await page.goto('/#/motion/effects');
  const card = page.getByRole('region', { name: 'In context' });
  await expect(card.locator('.rl-scan')).toHaveAttribute('data-reduced', 'true');
  // The reduced outline lives ~160ms; capture its computed style synchronously as it mounts.
  const captured = page.evaluate(
    () =>
      new Promise<{ animation: string; shadow: string }>((resolve) => {
        const observer = new MutationObserver(() => {
          const line = document.querySelector('.rl-scan__line');
          if (!line) return;
          observer.disconnect();
          const s = getComputedStyle(line);
          resolve({ animation: s.animationName, shadow: s.boxShadow });
        });
        observer.observe(document.body, { childList: true, subtree: true });
      }),
  );
  await card.getByRole('button', { name: '重新扫描' }).click();
  const style = await captured;
  expect(style.animation).toBe('none');
  expect(style.shadow).toContain('inset');
});

test.describe('Effects in context', () => {
  test('location is concealed until the user reveals it; content is readable throughout', async ({ page }) => {
    await page.goto('/#/motion/effects');
    const card = page.getByRole('region', { name: 'In context' });
    await expect(card.locator('dl')).toContainText('ARC-1024');
    await expect(card.locator('.rl-effect-sr')).toHaveText('存放位置已隐藏');
    await card.getByRole('button', { name: '显示位置' }).click();
    await expect(card.locator('.rl-reveal')).toHaveAttribute('data-state', 'revealed', { timeout: 2000 });
    await expect(card.locator('.rl-reveal__glyphs')).toHaveText('实验楼 2F · 观测室');
    await expect(card.getByRole('button', { name: '隐藏位置' })).toHaveAttribute('aria-pressed', 'true');
  });

  test('orbit: labels are an accessible list; rotation only when asked', async ({ page }) => {
    await page.goto('/#/motion/effects');
    const card = page.getByRole('region', { name: 'OrbitalDiagram · 轨道' });
    await expect(card.getByRole('list', { name: '实验流程阶段' }).getByRole('listitem')).toHaveCount(5);
    const orbit = card.locator('.rl-orbit');
    await expect(orbit).not.toHaveAttribute('data-spinning');
    await card.getByRole('button', { name: '缓慢旋转' }).click();
    await expect(orbit).toHaveAttribute('data-spinning', 'true');
    await card.getByRole('button', { name: '停止旋转' }).click();
    await expect(orbit).not.toHaveAttribute('data-spinning');
  });

  test('orbit never rotates under reduced motion', async ({ page }) => {
    await setSettings(page, { motion: 'reduce' });
    await page.goto('/#/motion/effects');
    const card = page.getByRole('region', { name: 'OrbitalDiagram · 轨道' });
    await card.getByRole('button', { name: '缓慢旋转' }).click();
    await expect(card.getByRole('button', { name: '停止旋转' })).toHaveAttribute('aria-pressed', 'true');
    await expect(card.locator('.rl-orbit')).not.toHaveAttribute('data-spinning');
  });

  test('page hidden pauses the reveal loop', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/#/motion/effects');
    const card = page.getByRole('region', { name: 'In context' });
    // The effects page is lazy-loaded; hide only after it has mounted so the listener is attached.
    await expect(card.locator('.rl-reveal')).toHaveAttribute('data-state', 'concealed');
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await card.getByRole('button', { name: '显示位置' }).click();
    await page.waitForTimeout(1200);
    await expect(card.locator('.rl-reveal')).not.toHaveAttribute('data-state', 'revealed');
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await expect(card.locator('.rl-reveal')).toHaveAttribute('data-state', 'revealed', { timeout: 2000 });
  });

  test('effects code is loaded only on this page', async ({ page }) => {
    const effectRequests: string[] = [];
    page.on('request', (r) => {
      if (/ShowcaseEffectsPage/.test(r.url())) effectRequests.push(r.url());
    });
    await page.goto('/#/components/button');
    await expect(page.locator('h1')).toBeVisible();
    expect(effectRequests).toEqual([]);
    await page.goto('/#/motion/effects');
    await expect(page.getByRole('heading', { level: 1, name: 'Showcase effects' })).toBeVisible();
    expect(effectRequests.length).toBeGreaterThan(0);
  });

  for (const theme of ['light', 'dark'] as const) {
    test(`axe clean after playing every effect · ${theme}`, async ({ page }) => {
      await setSettings(page, { theme });
      await page.goto('/#/motion/effects');
      await revealPlayer(page).getByRole('button', { name: '播放' }).click();
      await scanPlayer(page).getByRole('button', { name: '播放' }).click();
      await page.waitForTimeout(1200);
      // Return to the top so sticky chrome is captured in place in the full-page screenshot.
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.mouse.click(1, 1);
      await page.screenshot({ path: `test-results/screens/1280-effects-played-${theme}.png`, fullPage: true });
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
      expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
    });
  }
});
