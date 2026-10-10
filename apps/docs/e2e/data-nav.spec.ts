import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { setSettings } from './helpers';

test.use({ viewport: { width: 1280, height: 900 } });

const url = '/#/archive/data';
const axeTags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const axe = async (page: Page) =>
  (await new AxeBuilder({ page }).withTags(axeTags).analyze()).violations.map((v) => ({
    id: v.id,
    nodes: v.nodes.slice(0, 3).map((n) => n.target.join(' ')),
  }));

test.describe('M8 data & navigation in a real browser', () => {
  test('1000 rows: paging keeps focus on the pager, scrolls the table to top and keeps selection', async ({ page }) => {
    await page.goto(url);
    const region = page.getByRole('region', { name: '1000 rows' });
    const table = region.getByRole('table', { name: /样本记录/ });
    const pager = region.getByRole('navigation', { name: '分页' });
    await expect(table.getByRole('rowheader')).toHaveCount(25);
    await expect(pager.getByRole('status')).toHaveText('第 1–25 条，共 1000 条');

    await table.getByRole('checkbox', { name: '选择 ARC-0003' }).check();
    const next = pager.getByRole('button', { name: '下一页' });
    await next.focus();
    await page.keyboard.press('Enter');
    // Stale rows stay while loading, then page 2 arrives.
    await expect(table).toHaveAttribute('aria-busy', 'true');
    await expect(table.getByRole('rowheader').first()).toHaveText('ARC-0026');
    await expect(next).toBeFocused();
    await expect(table).not.toHaveAttribute('aria-busy');
    await expect(region.getByText('已选 1 条（其中 1 条在其他页）')).toBeVisible();

    // Jump to the last page through the page list.
    await pager.getByRole('button', { name: '第 40 页' }).click();
    await expect(table.getByRole('rowheader').last()).toHaveText('ARC-1000');
    await expect(pager.getByRole('button', { name: '第 40 页' })).toHaveAttribute('aria-current', 'page');
    await expect(pager.getByRole('button', { name: '第 40 页' })).toBeFocused();
    await expect(next).toBeDisabled();
  });

  test('sorting returns to page 1 and keeps aria-sort; controls are disabled while loading', async ({ page }) => {
    await page.goto(url);
    const region = page.getByRole('region', { name: '1000 rows' });
    const table = region.getByRole('table', { name: /样本记录/ });
    await region.getByRole('navigation', { name: '分页' }).getByRole('button', { name: '第 3 页' }).click();
    await expect(table.getByRole('rowheader').first()).toHaveText('ARC-0051');
    const sortId = table.getByRole('button', { name: /编号/ });
    await sortId.click();
    await expect(sortId).toBeDisabled();
    await expect(table.getByRole('columnheader', { name: /编号/ })).toHaveAttribute('aria-sort', 'ascending');
    await expect(table).not.toHaveAttribute('aria-busy');
    await expect(sortId).toBeEnabled();
    await sortId.click();
    await expect(table.getByRole('columnheader', { name: /编号/ })).toHaveAttribute('aria-sort', 'descending');
    await expect(table.getByRole('rowheader').first()).toHaveText('ARC-1000');
    await expect(region.getByRole('button', { name: '第 1 页' })).toHaveAttribute('aria-current', 'page');
  });

  test('error state announces an alert; retry recovers', async ({ page }) => {
    await page.goto(url);
    const region = page.getByRole('region', { name: '1000 rows' });
    await region.getByRole('button', { name: '让下一次请求失败' }).click();
    await region.getByRole('button', { name: '下一页' }).click();
    await expect(region.getByRole('alert')).toHaveText('请求失败（演示）。');
    // Paging is inert (aria-disabled) but focusable while the request is unresolved.
    await expect(region.getByRole('button', { name: '第 2 页' })).toHaveAttribute('aria-disabled', 'true');
    await region.getByRole('button', { name: '重试' }).click();
    await expect(region.getByRole('table').getByRole('rowheader').first()).toHaveText('ARC-0026');
  });

  test('table states: first-load skeleton, empty with action, error', async ({ page }) => {
    await page.goto(url);
    const region = page.getByRole('region', { name: 'Table states' });
    const table = region.getByRole('table', { name: '状态示例' });
    await expect(table).toHaveAttribute('aria-busy', 'true');
    await expect(region.getByRole('status')).toHaveText('正在加载…');
    await region.getByRole('radio', { name: '空结果' }).check();
    await expect(region.getByText('没有符合筛选条件的记录。')).toBeVisible();
    await expect(region.getByRole('button', { name: '清除筛选' })).toBeVisible();
    await region.getByRole('radio', { name: '错误' }).check();
    await expect(region.getByRole('alert')).toContainText('档案服务暂时不可用。');
  });

  test('pagination switches to compact mode in a narrow container', async ({ page }) => {
    await page.goto(url);
    const narrow = page.getByRole('navigation', { name: '分页（窄容器）' });
    await expect(narrow.getByText('第 7 / 40 页')).toBeVisible();
    await expect(narrow.getByRole('button', { name: '第 7 页' })).toBeHidden();
    await narrow.getByRole('button', { name: '下一页' }).click();
    await expect(narrow.getByText('第 8 / 40 页')).toBeVisible();
  });

  test('breadcrumb collapses, expands in place and moves focus to the first revealed link', async ({ page }) => {
    await page.goto(url);
    const nav = page.getByRole('navigation', { name: '路径（折叠）' });
    await expect(nav.getByRole('link')).toHaveCount(2);
    await nav.getByRole('button', { name: '显示全部 5 级路径' }).click();
    await expect(nav.getByRole('link')).toHaveCount(4);
    await expect(nav.getByRole('link', { name: '样本' })).toBeFocused();
    const current = nav.getByText(/^ARC-1024/);
    await expect(current).toHaveAttribute('aria-current', 'page');
    // Long label is truncated visually (single line), full text stays in the DOM and title.
    const box = await current.evaluate((el) => ({ sw: el.scrollWidth, cw: el.clientWidth, title: el.getAttribute('title') }));
    expect(box.sw).toBeGreaterThan(box.cw);
    expect(box.title).toContain('第二版修订稿');
  });

  test('layout: breadcrumb stays on one line and uses the free width; pager labels never wrap at 320; error row is centred', async ({ page }) => {
    await page.goto(url);
    const full = page.getByRole('navigation', { name: '路径（完整）' });
    const geometry = await full.evaluate((nav) => {
      const list = nav.querySelector('ol')!;
      const items = [...list.children].map((li) => li.getBoundingClientRect());
      const current = nav.querySelector<HTMLElement>('[aria-current]')!;
      return {
        oneLine: new Set(items.map((r) => Math.round(r.top + r.height / 2))).size === 1,
        listRight: Math.round(list.getBoundingClientRect().right),
        lastRight: Math.round(items[items.length - 1]!.right),
        truncated: current.scrollWidth > current.clientWidth,
      };
    });
    expect(geometry.oneLine).toBe(true);
    // Truncation only happens when the line is actually full.
    if (geometry.truncated) expect(geometry.listRight - geometry.lastRight).toBeLessThanOrEqual(2);

    const region = page.getByRole('region', { name: '1000 rows' });
    await region.getByRole('button', { name: '让下一次请求失败' }).click();
    await region.getByRole('button', { name: '下一页' }).click();
    const alert = region.getByRole('alert');
    await expect(alert).toBeVisible();
    const centred = await alert.evaluate((el) => {
      const cell = el.closest('td')!.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      return Math.abs(r.left - cell.left - (cell.right - r.right));
    });
    // The retry button sits beside the message, so the message alone is offset by about half its width.
    expect(centred).toBeLessThan(200);

    await page.setViewportSize({ width: 320, height: 800 });
    for (const step of await page.locator('.rl-pagination__step').all()) {
      if (!(await step.isVisible())) continue;
      const lines = await step.evaluate((el) => {
        const label = el.querySelector('.rl-pagination__step-label') as HTMLElement | null;
        if (!label || label.getBoundingClientRect().width < 2) return 1;
        return Math.round(label.getBoundingClientRect().height / parseFloat(getComputedStyle(label).lineHeight));
      });
      expect(lines).toBe(1);
    }
  });

  for (const width of [320, 390, 768, 1280] as const) {
    test(`breadcrumb at ${width}px: one line, no overlap, never widens the page`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(url);
      for (const name of ['路径（折叠）', '路径（完整）']) {
        const r = await page.getByRole('navigation', { name }).evaluate((nav) => {
          const items = [...nav.querySelectorAll('li')].map((li) => li.getBoundingClientRect());
          return {
            lines: new Set(items.map((i) => Math.round(i.top + i.height / 2))).size,
            overlaps: items.slice(1).filter((i, n) => i.left < items[n]!.right - 1).length,
            scrolls: nav.scrollWidth > nav.clientWidth,
          };
        });
        expect(r.lines, name).toBe(1);
        expect(r.overlaps, name).toBe(0);
        // The collapsed trail always fits from 320px up; only a long uncollapsed path may scroll inside itself.
        if (name === '路径（折叠）') expect(r.scrolls, name).toBe(false);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
    });
  }

  test('progress and meter expose values; reduced motion stops animations', async ({ page }) => {
    await setSettings(page, { motion: 'reduce' });
    await page.goto(url);
    const region = page.getByRole('region', { name: 'Progress & Meter' });
    const exportBar = region.getByRole('progressbar', { name: '导出档案（示例）' });
    await expect(exportBar).toHaveAttribute('aria-valuetext', '40%');
    await region.getByRole('button', { name: '+20%' }).click();
    await expect(exportBar).toHaveAttribute('aria-valuetext', '60%');
    await expect(region.getByRole('meter', { name: '示例 · 存储占用' })).toHaveAttribute('aria-valuetext', '86%，接近上限');
    const indeterminate = region.getByRole('progressbar', { name: '重建索引（时长未知）' }).locator('.rl-progress__indicator');
    expect(await indeterminate.evaluate((el) => getComputedStyle(el).animationName)).toBe('none');
    const skeleton = page.getByRole('region', { name: 'Table states' }).locator('.rl-table__skeleton').first();
    expect(await skeleton.evaluate((el) => getComputedStyle(el).animationName)).toBe('none');
  });

  test('indeterminate progress and skeletons animate without reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto(url);
    const bar = page.getByRole('progressbar', { name: '重建索引（时长未知）' }).locator('.rl-progress__indicator');
    expect(await bar.evaluate((el) => getComputedStyle(el).animationName)).toBe('rl-progress-travel');
  });

  test('experiment scenario reports step progress to assistive tech', async ({ page }) => {
    await page.goto('/#/archive/scenarios');
    await page.getByRole('tab', { name: '实验监测' }).click();
    const bar = page.getByRole('progressbar', { name: '规程进度' });
    await expect(bar).toHaveAttribute('aria-valuetext', /已完成 0 \/ \d 步/);
    await page.getByRole('button', { name: /^完成「/ }).click();
    await expect(bar).toHaveAttribute('aria-valuetext', /已完成 1 \/ \d 步/);
  });

  for (const theme of ['light', 'dark'] as const) {
    test(`axe clean with loading, error and expanded breadcrumb · ${theme}`, async ({ page }) => {
      await setSettings(page, { theme });
      await page.goto(url);
      await page.getByRole('button', { name: '显示全部 5 级路径' }).click();
      const region = page.getByRole('region', { name: '1000 rows' });
      await region.getByRole('button', { name: '让下一次请求失败' }).click();
      await region.getByRole('button', { name: '下一页' }).click();
      await expect(region.getByRole('alert')).toBeVisible();
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: `test-results/screens/1280-data-states-${theme}.png`, fullPage: true });
      expect(await axe(page)).toEqual([]);
    });
  }
});
