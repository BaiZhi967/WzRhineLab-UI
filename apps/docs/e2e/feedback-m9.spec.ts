import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { setSettings } from './helpers';

/** Real-browser guarantees for M9 feedback (ADR-0006 §5–8): Alert, Callout, EmptyState, Skeleton, Spinner, Toast. */
test.use({ viewport: { width: 1280, height: 900 } });

const url = '/#/components/feedback';

const axe = async (page: Page) => {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  return results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
};

const animationName = (page: Page, selector: string) =>
  page.locator(selector).first().evaluate((el) => getComputedStyle(el).animationName);

/** motion/react writes the rotation as an inline transform on the svg. */
const rotation = (page: Page) => page.locator('#feedback-spinner-title').locator('xpath=../..').locator('.rl-spinner__svg').first().evaluate((el) => (el as SVGElement).style.transform);

test.describe('Alert & Callout', () => {
  test('live roles: off → none, polite → status, assertive → alert; callout is a note', async ({ page }) => {
    await page.goto(url);
    const tones = page.getByRole('region', { name: 'Alert tones' });
    await expect(tones.locator('.rl-alert')).toHaveCount(7);
    await expect(tones.getByRole('status')).toHaveCount(0);
    await expect(tones.getByRole('alert')).toHaveCount(0);

    const live = page.getByRole('region', { name: 'Live alert' });
    const status = live.getByRole('status');
    await expect(status).toContainText('尚未校验');
    await live.getByRole('button', { name: '校验示例记录' }).click();
    await expect(status).toContainText('校验完成');
    await expect(live.getByRole('alert')).toHaveCount(0);
    await live.getByRole('button', { name: '模拟校验失败' }).click();
    await expect(live.getByRole('alert')).toContainText('校验失败');

    const notes = page.getByRole('region', { name: 'Callout' }).getByRole('note');
    await expect(notes).toHaveCount(3);
    await expect(notes.first()).toContainText('关于样例数据');
  });

  test('dismiss button is named and focus moves to the restore control', async ({ page }) => {
    await page.goto(url);
    const region = page.getByRole('region', { name: 'Dismissible alert' });
    const close = region.getByRole('button', { name: '关闭提示' });
    await close.focus();
    await page.keyboard.press('Enter');
    await expect(region.locator('.rl-alert')).toHaveCount(0);
    const restore = region.getByRole('button', { name: '重新显示提示' });
    await expect(restore).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(region.getByRole('button', { name: '关闭提示' })).toBeVisible();
  });
});

test.describe('EmptyState, Skeleton, Spinner', () => {
  test('EmptyState heading level follows headingLevel; paragraph otherwise; icons decorative', async ({ page }) => {
    await page.goto(url);
    const region = page.getByRole('region', { name: 'EmptyState' });
    await expect(region.getByRole('heading', { level: 3 })).toHaveCount(4);
    await expect(region.getByRole('heading', { level: 3, name: '没有符合条件的记录' })).toBeVisible();
    const paragraph = region.getByText('段落标题（未传 headingLevel）');
    expect(await paragraph.evaluate((el) => el.tagName)).toBe('P');
    for (const icon of await region.locator('.rl-empty__icon').all()) await expect(icon).toHaveAttribute('aria-hidden', 'true');
    await region.getByRole('radio', { name: /^sm/ }).check();
    await expect(region.locator('.rl-empty[data-size="sm"]')).toHaveCount(5);
  });

  test('Skeleton is aria-hidden inside an aria-busy container with status text', async ({ page }) => {
    await page.goto(url);
    const card = page.getByTestId('skeleton-card');
    await expect(card).toHaveAttribute('aria-busy', 'true');
    for (const s of await card.locator('.rl-skeleton, .rl-skeleton-lines').all()) {
      const hidden = await s.evaluate((el) => el.closest('[aria-hidden="true"]') !== null);
      expect(hidden).toBe(true);
    }
    await expect(card).toContainText('正在加载记录摘要');
    expect(await animationName(page, '[data-testid="skeleton-card"] .rl-skeleton')).toBe('rl-skeleton-pulse');
    await page.getByRole('button', { name: '模拟加载完成' }).click();
    await expect(card).not.toHaveAttribute('aria-busy');
    await expect(card.locator('.rl-skeleton')).toHaveCount(0);
  });

  test('Spinner with label is a status; without label it is hidden', async ({ page }) => {
    await page.goto(url);
    const region = page.getByRole('region', { name: 'Spinner' });
    await expect(region.getByRole('status')).toHaveText('正在加载批次列表（示例）');
    const decorative = region.locator('.rl-spinner[aria-hidden="true"]');
    await expect(decorative).toHaveCount(3);
    expect(await decorative.evaluateAll((els) => els.map((el) => el.getAttribute('data-size')))).toEqual(['sm', 'md', 'lg']);
  });

  test('spinner rotates and skeleton pulses with motion allowed', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto(url);
    await expect(page.locator('.rl-spinner').first()).not.toHaveAttribute('data-reduced');
    await expect.poll(() => rotation(page)).toMatch(/rotate\((?!0deg)/);
    expect(await animationName(page, '.rl-skeleton')).toBe('rl-skeleton-pulse');
  });

  for (const via of ['setting', 'os'] as const) {
    test(`reduced motion (${via}): spinner static, skeleton animation none`, async ({ page }) => {
      if (via === 'setting') {
        await setSettings(page, { motion: 'reduce' });
        await page.emulateMedia({ reducedMotion: 'no-preference' });
      } else {
        await page.emulateMedia({ reducedMotion: 'reduce' });
      }
      await page.goto(url);
      const spinners = page.locator('.rl-spinner');
      await expect(spinners.first()).toHaveAttribute('data-reduced', 'true');
      await page.waitForTimeout(300);
      const transform = await rotation(page);
      expect(transform === '' || transform === 'none' || /rotate\(0deg\)/.test(transform)).toBe(true);
      expect(await animationName(page, '.rl-spinner__svg')).toBe('none');
      expect(await animationName(page, '.rl-skeleton')).toBe('none');
      // Longer static arc under reduce.
      expect(await page.locator('.rl-spinner__arc').first().evaluate((el) => getComputedStyle(el).strokeDasharray)).toMatch(/^70/);
    });
  }

  test('DataTable empty state renders EmptyState in the cell with the same text', async ({ page }) => {
    await page.goto('/#/archive/data');
    const region = page.getByRole('region', { name: 'Table states' });
    await region.getByRole('radio', { name: '空结果' }).check();
    const cell = region.locator('td.rl-table__empty');
    await expect(cell.locator('.rl-empty[data-size="sm"]')).toBeVisible();
    await expect(cell).toHaveText('没有符合筛选条件的记录。清除筛选');
    await expect(cell.getByRole('button', { name: '清除筛选' })).toBeVisible();
    await expect(region.getByRole('heading')).toHaveCount(1); // only the specimen's own h2
    await region.getByRole('radio', { name: '首次加载' }).check();
    const skeleton = region.locator('.rl-table__skeleton').first();
    await expect(skeleton).toHaveClass(/rl-skeleton/);
  });

  test('Button loading still shows the decorative spinner', async ({ page }) => {
    await page.goto('/#/components/button');
    const button = page.getByRole('button', { name: '归档样本' });
    await button.click();
    await expect(button).toHaveAttribute('aria-busy', 'true');
    const spinner = button.locator('.rl-button__spinner .rl-spinner');
    await expect(spinner).toHaveAttribute('aria-hidden', 'true');
    await expect(button.getByRole('status')).toHaveCount(0);
  });

  for (const theme of ['light', 'dark'] as const) {
    test(`axe clean · ${theme} (with live alerts and dismissed state)`, async ({ page }) => {
      await setSettings(page, { theme });
      await page.goto(url);
      const live = page.getByRole('region', { name: 'Live alert' });
      await live.getByRole('button', { name: '模拟校验失败' }).click();
      await expect(live.getByRole('alert')).toBeVisible();
      expect(await axe(page)).toEqual([]);
      await page.getByRole('region', { name: 'EmptyState' }).getByRole('radio', { name: /^sm/ }).check();
      await page.getByRole('button', { name: '关闭提示' }).click();
      expect(await axe(page)).toEqual([]);
    });
  }
});

test.describe('Toast (ADR-0006 §8)', () => {
  test('dedupe: pressing 复制编号 three times leaves one toast', async ({ page }) => {
    await page.goto('/#/components/toast');
    const copy = page.getByRole('button', { name: '复制编号' });
    await copy.click();
    await copy.click();
    await copy.click();
    const toast = page.locator('.rl-toast').filter({ hasText: '已复制编号 ARC-1024' });
    await expect(toast).toContainText('本次共复制 3 次');
    await expect(page.locator('.rl-toast')).toHaveCount(1);
  });

  test('undo: the action restores the item and closes the toast; the page keeps its own restore entry', async ({ page }) => {
    await page.goto('/#/components/toast');
    const demo = page.getByTestId('undo-demo');
    await demo.getByRole('button', { name: '删除 ARC-0007' }).click();
    await expect(demo.getByRole('list', { name: '示例记录' })).not.toContainText('ARC-0007');
    await expect(demo.getByRole('group', { name: '已删除（可恢复）' })).toContainText('ARC-0007');
    const toast = page.locator('.rl-toast').filter({ hasText: '已删除 ARC-0007' });
    await expect(toast).toBeVisible();
    await toast.getByRole('button', { name: '撤销' }).click();
    await expect(toast).toHaveCount(0);
    await expect(demo.getByRole('list', { name: '示例记录' }).locator('li').first()).toContainText('ARC-0007');
    await expect(demo.getByRole('group', { name: '已删除（可恢复）' })).toHaveCount(0);

    // Same result without the toast: the page's own restore button.
    await demo.getByRole('button', { name: '删除 ARC-0012' }).click();
    await demo.getByRole('button', { name: '恢复 ARC-0012' }).click();
    await expect(demo.getByRole('list', { name: '示例记录' })).toContainText('ARC-0012');
  });

  test('undo toast outlives the 5 s default (action floor 10 s)', async ({ page }) => {
    await page.goto('/#/components/toast');
    await page.getByTestId('undo-demo').getByRole('button', { name: '删除 ARC-0019' }).click();
    const toast = page.locator('.rl-toast').filter({ hasText: '已删除 ARC-0019' });
    await expect(toast).toBeVisible();
    await page.mouse.move(5, 5);
    await page.waitForTimeout(6500);
    await expect(toast).toBeVisible();
    await expect(toast).toBeHidden({ timeout: 6000 });
  });

  test('promise: one toast goes loading → success in place', async ({ page }) => {
    await page.goto('/#/components/toast');
    await page.getByRole('button', { name: '导出示例记录' }).click();
    const toast = page.locator('.rl-toast');
    await expect(toast).toHaveCount(1);
    await expect(toast).toContainText('正在导出示例记录');
    await expect(toast.locator('.rl-spinner')).toBeVisible();
    const handle = await toast.elementHandle();
    await expect(toast).toContainText('导出完成', { timeout: 4000 });
    await expect(toast).toHaveAttribute('data-status', 'success');
    await expect(toast).toHaveCount(1);
    expect(await handle!.evaluate((el) => el.isConnected)).toBe(true);
    await expect(page.getByTestId('promise-result')).toContainText('成功，24 条');
  });

  test('promise failure: high priority, persists, retry action', async ({ page }) => {
    await page.goto('/#/components/toast');
    await page.getByRole('region', { name: 'toast.promise' }).getByRole('checkbox', { name: '模拟失败' }).check();
    await page.getByRole('button', { name: '导出示例记录' }).click();
    const toast = page.locator('.rl-toast');
    await expect(toast).toContainText('导出失败', { timeout: 4000 });
    await expect(toast).toHaveAttribute('data-status', 'danger');
    await expect(page.getByRole('alert').filter({ hasText: '导出失败' })).toBeAttached();
    await page.mouse.move(5, 5);
    await page.waitForTimeout(5500);
    await expect(toast).toBeVisible();
    await expect(toast).toHaveCount(1);
  });

  for (const theme of ['light', 'dark'] as const) {
    test(`axe clean with undo and promise toasts · ${theme}`, async ({ page }) => {
      await setSettings(page, { theme });
      await page.goto('/#/components/toast');
      await page.getByTestId('undo-demo').getByRole('button', { name: '删除 ARC-0007' }).click();
      await page.getByRole('button', { name: '复制编号' }).click();
      await expect(page.locator('.rl-toast')).toHaveCount(2);
      expect(await axe(page)).toEqual([]);
    });
  }
});
