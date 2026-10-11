import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { findHorizontalOverflow, setSettings } from './helpers';

/** Real-browser guarantees for the tools family (atlas 11–13, 31, 37–46). */
test.use({ viewport: { width: 1280, height: 900 } });

const url = '/#/agent/tools';

const axe = async (page: Page) => {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  return results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
};

test.beforeEach(async ({ page }) => {
  await setSettings(page, {});
});

test('tool row expands from the keyboard and shows its details', async ({ page }) => {
  await page.goto(url);
  const region = page.getByRole('region', { name: 'ToolActivity' });
  const row = region.getByRole('button', {
    name: /读取文件 data\/reef\/manifest\.csv/,
  });
  await expect(row).toHaveAttribute('aria-expanded', 'false');
  await row.focus();
  await page.keyboard.press('Enter');
  await expect(row).toHaveAttribute('aria-expanded', 'true');
  const details = region.getByRole('group', { name: '读取文件 详情' });
  await expect(details).toBeVisible();
  await expect(details).toContainText('可从第 41 行继续读取');
  await page.keyboard.press('Space');
  await expect(row).toHaveAttribute('aria-expanded', 'false');
});

test('expanded row survives a status change', async ({ page }) => {
  await page.goto(url);
  const region = page.getByRole('region', { name: 'ToolActivity' });
  const row = region.getByRole('button', {
    name: /执行命令 python classify\.py/,
  });
  await row.click();
  await expect(row).toHaveAttribute('aria-expanded', 'true');
  await region.getByRole('button', { name: '让「执行命令」完成（示例）' }).click();
  await expect(row).toHaveAccessibleName(/已完成/);
  await expect(row).toHaveAttribute('aria-expanded', 'true');
});

test('lazy details: loading state, then the adapter-delivered record', async ({ page }) => {
  await page.goto(url);
  const box = page.getByTestId('lazy-record');
  const row = box.getByRole('button', { name: /读取工具材料/ });
  await row.click();
  await expect(box.getByRole('status')).toHaveText('正在读取完整记录…');
  await expect(box.locator('[aria-busy="true"]')).toHaveCount(1);
  await expect(box.getByText('Processing image 3/3')).toBeVisible();
  await expect(box.locator('[aria-busy="true"]')).toHaveCount(0);
});

test('history "load more" appends a page without duplicate ids', async ({ page }) => {
  await page.goto(url);
  const specimen = page.getByRole('region', { name: 'ToolHistory' });
  const trigger = specimen.getByRole('button', { name: /完整工具记录/ });
  await trigger.click();
  const list = specimen.getByRole('list', { name: '工具记录' });
  const rows = list.locator(':scope > li');
  await expect(rows).toHaveCount(3);
  const firstBefore = await rows.first().getByRole('button').first().getAttribute('aria-label');
  await specimen.getByRole('button', { name: '加载更多操作' }).click();
  await expect(rows).toHaveCount(5);
  await expect(list.getByRole('button', { name: /^命令：.*执行命令 python classify\.py/ })).toHaveCount(1);
  expect(await rows.first().getByRole('button').first().getAttribute('aria-label')).toBe(firstBefore);
  await expect(trigger).toContainText('已加载 5 / 6 个操作');
});

test('display truncation and execution truncation use different notices', async ({ page }) => {
  await page.goto(url);
  const display = page.getByTestId('display-truncated');
  await expect(display).toContainText('仅显示部分输出');
  await expect(display).not.toContainText('结果本身被截断');
  await display.getByRole('button', { name: '加载更多' }).click();
  await expect(display.getByRole('region')).toContainText('R-12');
  const execution = page.getByTestId('output-执行截断');
  await expect(execution).toContainText('工具输出已达上限，结果本身被截断');
  await expect(execution).not.toContainText('仅显示部分输出');
  await expect(execution.getByRole('button', { name: '加载更多' })).toHaveCount(0);
});

test('diff shows a visible +/− sign column and spoken add/remove', async ({ page }) => {
  await page.goto(url);
  const diff = page.getByTestId('diff-specimens').getByRole('region', { name: 'src/config.py 的差异' }).first();
  await expect(diff).toHaveAttribute('tabindex', '0');
  const signs = await diff.locator('.rl-agent-diff__sign').allTextContents();
  expect(signs).toContain('+');
  expect(signs).toContain('−');
  await expect(diff.locator('.rl-agent-sr', { hasText: '新增' }).first()).toBeAttached();
  await expect(diff.locator('.rl-agent-sr', { hasText: '删除' }).first()).toBeAttached();
});

test('axe: no WCAG A/AA violations', async ({ page }) => {
  await page.goto(url);
  await expect(page.getByRole('heading', { level: 1, name: 'Tools' })).toBeVisible();
  // Open the collapsed groups so their content is scanned too.
  await page
    .getByRole('region', { name: 'ToolHistory' })
    .getByRole('button', { name: /完整工具记录/ })
    .click();
  await page
    .getByRole('region', { name: 'ToolActivity' })
    .getByRole('button', { name: /读取文件 data\/reef/ })
    .click();
  expect(await axe(page)).toEqual([]);
});

test.describe('320px', () => {
  test.use({ viewport: { width: 320, height: 844 } });

  test('no horizontal page overflow; wide code scrolls inside its region', async ({ page }) => {
    await setSettings(page, { motion: 'reduce' });
    await page.goto(url);
    await expect(page.locator('h1')).toBeVisible();
    const result = await findHorizontalOverflow(page);
    expect(result.offenders, JSON.stringify(result)).toEqual([]);
    expect(result.scrollWidth).toBeLessThanOrEqual(result.clientWidth);
    const scroller = page.getByTestId('diff-specimens').getByRole('region', { name: 'src/config.py 的差异' }).first();
    const sizes = await scroller.evaluate((el) => ({
      scroll: el.scrollWidth,
      client: el.clientWidth,
    }));
    expect(sizes.scroll).toBeGreaterThan(sizes.client);
  });
});
