import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { setSettings } from './helpers';

const widths = [320, 390, 768, 1280, 1920];
const geometry = (page: Page) => page.getByTestId('signal-geometry');

async function anchorErrors(page: Page) {
  return geometry(page).evaluate((container) => {
    return [[0, 1], [1, 2]].map(([from, to]) => {
      const path = container.querySelector<SVGPathElement>(`.rl-demo-signal-${from}${to} .rl-effect-connection__track`);
      const startNode = container.querySelector<HTMLElement>(`[data-testid="signal-node-${from}"]`);
      const endNode = container.querySelector<HTMLElement>(`[data-testid="signal-node-${to}"]`);
      if (!path || !startNode || !endNode || !path.getAttribute('d')) return Number.POSITIVE_INFINITY;
      const matrix = path.getScreenCTM();
      if (!matrix) return Number.POSITIVE_INFINITY;
      const length = path.getTotalLength();
      return Math.max(...[startNode, endNode].map((node, index) => {
        const point = path.getPointAtLength(index === 0 ? 0 : length).matrixTransform(matrix);
        const rect = node.getBoundingClientRect();
        return Math.max(Math.abs(point.x - rect.left - rect.width / 2), Math.abs(point.y - rect.bottom));
      }));
    });
  });
}

async function expectAnchored(page: Page) {
  await expect.poll(async () => Math.max(...await anchorErrors(page))).toBeLessThanOrEqual(1);
}

async function openGeometry(page: Page) {
  await page.goto('/#/motion/effects');
  await expect(geometry(page)).toBeVisible();
  await geometry(page).scrollIntoViewIfNeeded();
  await expectAnchored(page);
}

for (const width of widths) {
  test(`relationship paths attach to card bottom centers · ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await openGeometry(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.getByRole('button', { name: '切换演示阶段', exact: true }).click();
    await expectAnchored(page);
    await testInfo.attach(`signal-geometry-${width}`, { body: await geometry(page).screenshot(), contentType: 'image/png' });
  });
}

test('anchors follow container-only resizing, wrapping, gaps and nested scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1000 });
  await openGeometry(page);
  const slider = page.getByRole('slider', { name: '关系区域宽度' });
  await slider.focus();
  await page.keyboard.press('Home');
  await expectAnchored(page);
  await page.keyboard.press('End');
  await expectAnchored(page);
  await geometry(page).evaluate((el) => {
    const node = el.querySelector<HTMLElement>('[data-testid="signal-node-1"]')!;
    node.style.maxWidth = '130px';
    node.style.marginLeft = '9px';
    node.append(document.createTextNode(' 额外多行标注用于验证字体与卡片尺寸变化'));
    el.style.padding = '21px 17px';
    el.style.border = '3px solid currentColor';
  });
  await expectAnchored(page);
  await geometry(page).evaluate((el) => { el.style.transformOrigin = 'top left'; el.style.transform = 'scale(.8)'; });
  await expectAnchored(page);
  await geometry(page).evaluate((el) => {
    const row = el.querySelector<HTMLElement>('[data-testid="signal-node-0"]')!.parentElement!;
    row.style.overflowX = 'auto';
    row.style.width = '65%';
    for (const child of row.children) {
      if (child instanceof HTMLElement) child.style.minWidth = '200px';
    }
    row.scrollLeft = 71;
  });
  await expectAnchored(page);
});

test('idle geometry does not continuously read layout', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1000 });
  await openGeometry(page);
  await page.waitForTimeout(150);
  const reads = await geometry(page).evaluate(async (el) => {
    const read = el.getBoundingClientRect;
    let count = 0;
    el.getBoundingClientRect = function () { count += 1; return read.call(this); };
    await new Promise((resolve) => setTimeout(resolve, 200));
    el.getBoundingClientRect = read;
    return count;
  });
  expect(reads).toBe(0);
});

test('explicit tracking follows transformed endpoints and can be disabled', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1000 });
  await openGeometry(page);
  const tracking = page.getByRole('checkbox', { name: '跟踪运动端点', exact: true });
  await tracking.check();
  await page.getByTestId('signal-node-1').evaluate((el) => {
    el.style.transition = 'transform 500ms linear';
    el.style.transform = 'translate(30px, 12px)';
  });
  await expectAnchored(page);
  await expect.poll(async () => {
    return page.getByTestId('signal-node-1').evaluate((el) => getComputedStyle(el).transform);
  }).toBe('matrix(1, 0, 0, 1, 30, 12)');
  await expectAnchored(page);
  await tracking.uncheck();
  await expectAnchored(page);
});

test('anchors remain attached when their own positioning container scrolls', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1000 });
  await openGeometry(page);
  await geometry(page).evaluate((el) => {
    el.style.maxHeight = '100px';
    el.style.overflow = 'auto';
    const row = el.querySelector<HTMLElement>('[data-testid="signal-node-0"]')!.parentElement!;
    row.style.minWidth = '1400px';
    el.scrollLeft = 73;
    el.scrollTop = 19;
  });
  await expectAnchored(page);
});

test('hidden endpoints remove their path and revealing them measures fresh coordinates', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1000 });
  await openGeometry(page);
  await page.getByTestId('signal-node-1').evaluate((el) => { el.style.display = 'none'; });
  await expect(geometry(page).locator('.rl-effect-connection__track')).toHaveCount(0);
  await page.getByTestId('signal-node-1').evaluate((el) => { el.style.display = ''; });
  await expectAnchored(page);
});

const effects = [
  { name: 'CalibrationReticle', selector: '.rl-calibration' },
  { name: 'SignalPath', selector: '.rl-signal-path' },
  { name: 'AnnotationTrace', selector: '.rl-annotation-trace' },
];

for (const effect of effects) {
  test(`${effect.name}: four lanes, explicit activation and static reduced state`, async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1200 });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/#/motion/effects');
    const player = page.getByRole('region', { name: effect.name, exact: true });
    await player.scrollIntoViewIfNeeded();
    await expect(player.locator('.rl-player__lane')).toHaveCount(4);
    const lane = (name: string) => player.locator(`[data-lane="${name}"] ${effect.selector}`);
    await expect(lane('default')).toHaveAttribute('data-active', 'false');
    await expect(lane('reduced')).toHaveAttribute('data-reduced', 'true');
    await player.getByRole('button', { name: '播放', exact: true }).click();
    await expect(lane('reduced')).toHaveAttribute('data-active', 'true');
    await expect(lane('reduced')).not.toHaveAttribute('data-state', 'running');
    await expect(lane('default')).toHaveAttribute('data-state', 'settled');
    await expect(lane('interrupt')).toHaveAttribute('data-active', 'false');
    await expect(lane('slow')).toHaveAttribute('data-state', 'settled', { timeout: 6000 });
    await expect(lane('default')).toHaveAttribute('aria-hidden', 'true');
    expect(await lane('default').evaluate((el) => getComputedStyle(el).pointerEvents)).toBe('none');
  });
}

test('progress freezes on hidden pages and settles the newest target after reduce', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1200 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/#/motion/effects');
  const player = page.getByRole('region', { name: 'SignalPath', exact: true });
  await player.scrollIntoViewIfNeeded();
  await player.getByRole('button', { name: '播放', exact: true }).click();
  const slow = player.locator('[data-lane="slow"] .rl-signal-path');
  await expect(slow).toHaveAttribute('data-state', 'running');
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(slow).toHaveAttribute('data-state', 'paused');
  const signal = slow.locator('.rl-effect-connection__signal');
  const before = await signal.getAttribute('style');
  await page.waitForTimeout(200);
  expect(await signal.getAttribute('style')).toBe(before);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(slow).toHaveAttribute('data-reduced', 'true');
  await expect(slow).toHaveAttribute('data-state', 'settled');
});

for (const theme of ['light', 'dark'] as const) {
  test(`signature effects preserve accessible content · ${theme}`, async ({ page }) => {
    await setSettings(page, { theme, motion: 'reduce' });
    await page.goto('/#/motion/effects');
    await expect(geometry(page)).toBeVisible();
    for (const effect of effects) {
      const player = page.getByRole('region', { name: effect.name, exact: true });
      await player.getByRole('button', { name: '播放', exact: true }).click();
    }
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect(result.violations).toEqual([]);
  });
}

test('instrument rotation and scaling preserve the common optical center', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.goto('/#/');
  const scene = page.getByRole('region', { name: 'Research instrument', exact: true });
  await expect(scene.locator('.rl-calibration')).toBeVisible();
  const error = () => scene.locator('.rl-calibration__svg').evaluate((svg) => {
    const root = svg as SVGSVGElement;
    const target = new DOMPoint(160, 130).matrixTransform(root.getScreenCTM()!);
    return Math.max(...Array.from(root.querySelectorAll<SVGGElement>('g[style]')).map((group) => {
      const point = new DOMPoint(160, 130).matrixTransform(group.getScreenCTM()!);
      return Math.max(Math.abs(point.x - target.x), Math.abs(point.y - target.y));
    }));
  });
  expect(await error()).toBeLessThanOrEqual(1);
  await scene.getByRole('button', { name: '对准结构', exact: true }).click();
  await expect(scene.locator('.rl-calibration')).toHaveAttribute('data-state', 'settled');
  expect(await error()).toBeLessThanOrEqual(1);
});

test('home instrument is idle until a keyboard action and does not require a real device', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.goto('/#/');
  const scene = page.getByRole('region', { name: 'Research instrument', exact: true });
  await expect(scene).toBeVisible();
  await expect(scene.locator('.rl-calibration')).toHaveAttribute('data-active', 'false');
  const trigger = scene.getByRole('button', { name: '对准结构', exact: true });
  await trigger.focus();
  await page.keyboard.press('Enter');
  await expect(scene.locator('.rl-calibration')).toHaveAttribute('data-active', 'true');
  await expect(scene.getByRole('button', { name: '恢复初始', exact: true })).toBeFocused();
  await expect(scene.locator('.rl-calibration')).toHaveAttribute('data-state', 'settled');
  await testInfo.attach('research-instrument', { body: await scene.screenshot(), contentType: 'image/png' });
});
