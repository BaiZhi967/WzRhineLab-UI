import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const axeTags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function axe(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(axeTags).analyze();
  return results.violations.map((v) => ({ id: v.id, nodes: v.nodes.slice(0, 3).map((n) => n.target.join(' ')) }));
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: '档案台' })).toBeVisible();
});

test('lists the sample records and labels them as samples', async ({ page }) => {
  const table = page.getByRole('table', { name: '档案记录' });
  await expect(table.getByRole('rowheader')).toHaveText(['ARC-0001', 'ARC-0002', 'ARC-0003']);
  await expect(page.getByText('3 / 3 条')).toBeVisible();
  await expect(page.getByLabel('记录详情').getByText('示例数据', { exact: true })).toBeVisible();
});

test('create → validate → save → advance → archive, persisted across reload', async ({ page }) => {
  await page.getByRole('button', { name: '新建记录' }).click();
  const dialog = page.getByRole('dialog', { name: '新建档案记录' });
  await expect(dialog).toBeVisible();

  // Empty submit shows both errors and keeps the dialog open.
  await dialog.getByRole('button', { name: '保存草稿' }).click();
  await expect(dialog.getByText('请填写标题。')).toBeVisible();
  await expect(dialog.getByText('请填写学科。')).toBeVisible();
  await expect(dialog.getByRole('textbox', { name: /标题/ })).toHaveAttribute('aria-invalid', 'true');

  await dialog.getByRole('textbox', { name: /标题/ }).fill('磁场屏蔽测试');
  await dialog.getByRole('textbox', { name: /学科/ }).fill('物理学');
  await dialog.getByRole('button', { name: '保存草稿' }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText('已创建 ARC-0004')).toBeVisible();

  const detail = page.getByLabel('记录详情');
  await expect(detail.getByRole('heading', { level: 2, name: '磁场屏蔽测试' })).toBeVisible();
  await expect(detail.getByText('本机记录')).toBeVisible();
  await expect(detail.getByText('未指定')).toBeVisible();

  await detail.getByRole('button', { name: '提交审核' }).click();
  await expect(detail.getByText('审核中').first()).toBeVisible();
  await detail.getByRole('button', { name: '归档' }).click();
  await expect(detail.getByRole('button', { name: '已归档' })).toBeDisabled();
  await expect(detail.getByRole('list', { name: '处理记录' }).getByRole('listitem')).toHaveCount(3);

  await page.reload();
  await expect(page.getByRole('table', { name: '档案记录' }).getByRole('rowheader')).toHaveText(['ARC-0001', 'ARC-0002', 'ARC-0003', 'ARC-0004']);
  await page.getByRole('button', { name: '查看 ARC-0004' }).click();
  await expect(detail.getByRole('button', { name: '已归档' })).toBeDisabled();
});

test('search, status filter and sorting', async ({ page }) => {
  const table = page.getByRole('table', { name: '档案记录' });
  await page.getByRole('searchbox').fill('光谱');
  await expect(table.getByRole('rowheader')).toHaveText(['ARC-0002']);
  await expect(page.getByText('1 / 3 条')).toBeVisible();
  await page.getByRole('searchbox').fill('');

  await page.getByRole('combobox', { name: '状态' }).click();
  await page.getByRole('option', { name: '草稿' }).click();
  await expect(table.getByRole('rowheader')).toHaveText(['ARC-0003']);

  await page.getByRole('combobox', { name: '状态' }).click();
  await page.getByRole('option', { name: '全部状态' }).click();
  await table.getByRole('button', { name: '编号' }).click();
  await expect(table.getByRole('columnheader', { name: '编号' })).toHaveAttribute('aria-sort', 'descending');
  await expect(table.getByRole('rowheader')).toHaveText(['ARC-0003', 'ARC-0002', 'ARC-0001']);
});

test('delete goes through a confirmation, then restore brings samples back', async ({ page }) => {
  const detail = page.getByLabel('记录详情');
  await detail.getByRole('button', { name: 'ARC-0001 的更多操作' }).click();
  await page.getByRole('menuitem', { name: '删除记录' }).click();
  const confirm = page.getByRole('alertdialog', { name: '删除 ARC-0001？' });
  await expect(confirm).toBeVisible();
  await expect.poll(() => confirm.getByRole('button', { name: '取消' }).evaluate((el) => el === document.activeElement)).toBe(true);
  await confirm.getByRole('button', { name: '取消' }).click();
  await expect(page.getByRole('rowheader', { name: 'ARC-0001' })).toBeVisible();

  await detail.getByRole('button', { name: 'ARC-0001 的更多操作' }).click();
  await page.getByRole('menuitem', { name: '删除记录' }).click();
  await page.getByRole('alertdialog', { name: '删除 ARC-0001？' }).getByRole('button', { name: '删除' }).click();
  await expect(page.getByRole('rowheader', { name: 'ARC-0001' })).toHaveCount(0);
  await expect(page.getByText('2 / 2 条')).toBeVisible();

  await page.getByRole('button', { name: '恢复示例数据' }).click();
  await expect(page.getByText('3 / 3 条')).toBeVisible();
});

test('keyboard only: open the create dialog, Escape returns focus', async ({ page }) => {
  const trigger = page.getByRole('button', { name: '新建记录' });
  await trigger.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: '新建档案记录' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('textbox', { name: /标题/ })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test('pagination: 8 rows per page, filters reset to page 1, selection of a record survives paging', async ({ page }) => {
  // Seed enough local records to need two pages (store reads localStorage on load).
  await page.evaluate(() => {
    const now = '2026-10-10';
    const rows = Array.from({ length: 12 }, (_, i) => ({
      id: `ARC-${String(i + 1).padStart(4, '0')}`,
      title: `分页测试记录 ${i + 1}`,
      discipline: i % 2 ? '材料学' : '生物学',
      owner: '测试',
      status: 'draft',
      created: now,
      updated: now,
      summary: '',
      sample: false,
      history: [],
    }));
    localStorage.setItem('wzrhine-example:archive-desk', JSON.stringify(rows));
  });
  await page.reload();
  const table = page.getByRole('table', { name: '档案记录' });
  const pager = page.getByRole('navigation', { name: '分页' });
  await expect(table.getByRole('rowheader')).toHaveCount(8);
  await expect(pager.getByRole('status')).toHaveText('第 1–8 条，共 12 条');
  await pager.getByRole('button', { name: '下一页' }).click();
  await expect(pager.getByRole('button', { name: '下一页' })).toBeDisabled();
  await expect(pager.getByRole('button', { name: '第 2 页' })).toBeFocused();
  await expect(table.getByRole('rowheader')).toHaveText(['ARC-0009', 'ARC-0010', 'ARC-0011', 'ARC-0012']);
  await page.getByRole('button', { name: '查看 ARC-0010' }).click();
  const detail = page.getByLabel('记录详情');
  await expect(detail.getByRole('navigation', { name: '记录位置' })).toContainText('ARC-0010');
  await expect(detail.getByRole('navigation', { name: '记录位置' }).getByText('ARC-0010')).toHaveAttribute('aria-current', 'page');
  // Filtering shrinks the result set below one page: back to page 1, pager disappears.
  await page.getByRole('searchbox').fill('材料学');
  await expect(pager).toBeHidden();
  await expect(table.getByRole('rowheader')).toHaveCount(6);
  await expect(detail.getByRole('heading', { level: 2, name: '分页测试记录 10' })).toBeVisible();
});

test('theme switch applies to the scope and to portalled popups, and persists', async ({ page }) => {
  await page.getByRole('combobox', { name: '主题' }).click();
  await page.getByRole('option', { name: '深色' }).click();
  await expect(page.locator('.rl-theme').first()).toHaveAttribute('data-rl-theme', 'dark');
  const canvas = await page.locator('.desk-root').evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(canvas).toBe('rgb(17, 24, 27)');
  await page.getByRole('button', { name: '新建记录' }).click();
  // The dialog renders inside the provider's portal, so it inherits the dark theme.
  const dialog = page.getByRole('dialog', { name: '新建档案记录' });
  await expect(dialog).toBeVisible();
  expect(await dialog.evaluate((el) => el.closest('.rl-theme')?.getAttribute('data-rl-theme'))).toBe('dark');
  await page.keyboard.press('Escape');
  await page.reload();
  await expect(page.locator('.rl-theme').first()).toHaveAttribute('data-rl-theme', 'dark');
});

for (const theme of ['light', 'dark'] as const) {
  test(`no WCAG 2.2 A/AA violations · ${theme}`, async ({ page }) => {
    await page.evaluate((t) => window.localStorage.setItem('wzrhine-example:archive-desk:theme', t), theme);
    await page.reload();
    await expect(page.getByRole('heading', { level: 1, name: '档案台' })).toBeVisible();
    expect(await axe(page)).toEqual([]);
    await page.getByRole('button', { name: '新建记录' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    expect(await axe(page)).toEqual([]);
  });
}

for (const width of [320, 390, 768, 1280, 1920] as const) {
  test(`${width}px: no horizontal page overflow`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
    await page.screenshot({ path: `test-results/screens/archive-desk-${width}.png`, fullPage: true });
  });
}
