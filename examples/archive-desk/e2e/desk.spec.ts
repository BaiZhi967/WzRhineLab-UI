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
  await expect(table.getByRole('rowheader')).toHaveText(['ARC-0001', 'ARC-0002', 'ARC-0003', 'ARC-0004', 'ARC-0005', 'ARC-0006', 'ARC-0007', 'ARC-0008']);
  await expect(page.getByText('1000 / 1000 条')).toBeVisible();
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
  await expect(page.getByText('已创建 ARC-1001')).toBeVisible();

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
  await page.getByRole('searchbox').fill('磁场屏蔽测试');
  await page.getByRole('button', { name: '查看 ARC-1001' }).click();
  await expect(detail.getByRole('button', { name: '已归档' })).toBeDisabled();
});

test('search, status filter and sorting', async ({ page }) => {
  const table = page.getByRole('table', { name: '档案记录' });
  await page.getByRole('searchbox').fill('外勤采样路线规划');
  await expect(table.getByRole('rowheader')).toHaveText(['ARC-0003']);
  await page.getByRole('searchbox').fill('');

  await page.getByRole('combobox', { name: '状态' }).click();
  await page.getByRole('option', { name: '草稿' }).click();
  await expect(table.getByRole('rowheader').first()).toHaveText('ARC-0003');
  await expect(page.getByText(/条$/).first()).toContainText('/ 1000 条');

  await page.getByRole('combobox', { name: '状态' }).click();
  await page.getByRole('option', { name: '全部状态' }).click();
  await table.getByRole('button', { name: '编号' }).click();
  await expect(table.getByRole('columnheader', { name: '编号' })).toHaveAttribute('aria-sort', 'descending');
  await expect(table.getByRole('rowheader').first()).toHaveText('ARC-1000');
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
  await expect(page.getByText('999 / 999 条')).toBeVisible();

  await page.getByRole('button', { name: '恢复示例数据' }).click();
  await expect(page.getByText('1000 / 1000 条')).toBeVisible();
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
    localStorage.setItem('wzrhine-example:archive-desk:records:v2', JSON.stringify({ version: 2, items: rows }));
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


// ---------------------------------------------------------------------------
// P030-08: resources page (second data shape) and settings / fault injection.
// ---------------------------------------------------------------------------

test('resources: grid loads the sample dataset, filters, selects and opens the inspector', async ({ page }) => {
  await page.getByRole('tab', { name: '资源' }).click();
  const grid = page.getByRole('list', { name: '资源集合' });
  await expect(grid.getByRole('checkbox')).toHaveCount(24);
  await expect(page.getByText('共 240 条资源 · 示例数据')).toBeVisible();

  // Category condition: cycle to 图像 (60 items), applied chip appears and can be removed.
  await page.getByRole('button', { name: /类别：/ }).click();
  await expect(page.getByText('共 60 条资源 · 示例数据')).toBeVisible();
  await page.getByRole('button', { name: '移除 类别：图像' }).click();
  await expect(page.getByText('共 240 条资源 · 示例数据')).toBeVisible();

  // Selection is explicit and scoped; opening is a separate control.
  await grid.getByRole('checkbox', { name: /选择 潮间带照片/ }).first().check();
  await expect(page.getByRole('toolbar', { name: '批量操作' })).toContainText('已选 1 条');
  await grid.getByRole('button', { name: /潮间带照片/ }).first().click();
  const inspector = page.getByRole('region', { name: '资源属性' });
  await expect(inspector).toContainText('RES-');
  await page.getByRole('region', { name: '资源属性' }).getByRole('button', { name: /返回/ }).click();
  await expect(grid.getByRole('checkbox', { name: /选择 潮间带照片/ }).first()).toBeChecked();
});

// The checks below assert end results (rendered collection, re-issued request, reloaded storage)
// rather than "a control changed state" — the gap the 2026-10-15 audit called out in §6.3.

test('resources: the view switch changes the actual collection and keeps selection identity', async ({ page }) => {
  await page.getByRole('tab', { name: '资源' }).click();
  const grid = page.getByRole('list', { name: '资源集合' });
  await expect(grid).toBeVisible();

  // Select a known resource in grid view.
  const target = grid.getByRole('checkbox', { name: /选择 潮间带照片/ }).first();
  await target.check();
  const selectedLabel = await target.getAttribute('aria-label');
  await expect(page.getByRole('toolbar', { name: '批量操作' })).toContainText('已选 1 条');

  // Switching to list renders a table, not just a checked radio (audit F01).
  await page.getByRole('radio', { name: '列表' }).click();
  await expect(grid).toHaveCount(0);
  const table = page.getByRole('table', { name: '资源集合' });
  await expect(table).toBeVisible();
  await expect(table.getByRole('row')).not.toHaveCount(0);

  // The same resource is identifiable, still selected, and openable from the list view.
  const rowCheckbox = table.getByRole('checkbox', { name: selectedLabel! }).first();
  await expect(rowCheckbox).toBeChecked();
  await expect(page.getByRole('toolbar', { name: '批量操作' })).toContainText('已选 1 条');
  await table.getByRole('button', { name: /潮间带照片/ }).first().click();
  await expect(page.getByRole('region', { name: '资源属性' })).toContainText('RES-');

  // Back to grid: the selection survives the round trip.
  await page.getByRole('radio', { name: '网格' }).click();
  await expect(page.getByRole('list', { name: '资源集合' })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: selectedLabel! }).first()).toBeChecked();
});

test('resources: retry re-issues the read, still failing while the fault is on', async ({ page }) => {
  await page.getByRole('tab', { name: '设置' }).click();
  await page.getByRole('radio', { name: '错误（读取/保存失败）' }).check();
  await page.getByRole('tab', { name: '资源' }).click();
  await expect(page.getByText('注入的读取失败（演示错误恢复）。')).toBeVisible();

  // Clicking retry (the entry the old test never used) must re-run the read: with the fault still
  // injected it fails again, which is what proves a second request happened (audit F02).
  const retry = page.getByRole('button', { name: '重试' });
  await retry.click();
  await expect(page.getByText('注入的读取失败（演示错误恢复）。')).toBeVisible();

  // Clearing the fault lets the read succeed again (the effect re-runs on the faults change).
  await page.getByRole('tab', { name: '设置' }).click();
  await page.getByRole('radio', { name: '无（正常）' }).check();
  await page.getByRole('tab', { name: '资源' }).click();
  await expect(page.getByRole('list', { name: '资源集合' }).getByRole('checkbox').first()).toBeVisible();
  await expect(page.getByText('注入的读取失败（演示错误恢复）。')).toHaveCount(0);
});

test('resources: retry puts the collection back into a loading state (a request really goes out)', async ({ page }) => {
  // "Still failing after retry" would also hold if retry did nothing at all. A slow failure makes
  // the re-issued request observable: pressing retry has to show the busy state again (audit F02).
  await page.getByRole('tab', { name: '设置' }).click();
  await page.getByRole('radio', { name: '错误（读取/保存失败）' }).check();
  await page.getByRole('spinbutton', { name: '延迟毫秒' }).fill('2000');
  await page.getByRole('tab', { name: '资源' }).click();

  const grid = page.getByRole('list', { name: '资源集合' });
  await expect(grid).toHaveAttribute('aria-busy', 'true');
  await expect(page.getByText('注入的读取失败（演示错误恢复）。')).toBeVisible({ timeout: 10_000 });
  await expect(grid).not.toHaveAttribute('aria-busy', 'true');

  // The page stays mounted, so only the retry click can start another read.
  await page.getByRole('button', { name: '重试' }).click();
  await expect(grid).toHaveAttribute('aria-busy', 'true');
  await expect(page.getByText('注入的读取失败（演示错误恢复）。')).toBeVisible({ timeout: 10_000 });
});

test('settings: a saved preference survives a reload; a failed write keeps the input', async ({ page }) => {
  await page.getByRole('tab', { name: '设置' }).click();
  const nickname = page.getByRole('textbox', { name: '显示昵称' });
  await nickname.fill('审计复验昵称');
  await page.getByRole('button', { name: '保存设置' }).click();
  await expect(page.getByText('已写入本机浏览器（重新加载后保留）。')).toBeVisible();

  // The claim is checked against storage, not against the message (audit F03).
  await page.reload();
  await page.getByRole('tab', { name: '设置' }).click();
  await expect(page.getByRole('textbox', { name: '显示昵称' })).toHaveValue('审计复验昵称');

  // A failing write must report the failure and keep the edit.
  await page.getByRole('radio', { name: '错误（读取/保存失败）' }).check();
  await page.getByRole('textbox', { name: '显示昵称' }).fill('不应被保存');
  await page.getByRole('button', { name: '保存设置' }).click();
  await expect(page.getByText('注入的保存失败（演示错误恢复）。')).toBeVisible();
  await expect(page.getByRole('textbox', { name: '显示昵称' })).toHaveValue('不应被保存');
  await page.reload();
  await page.getByRole('tab', { name: '设置' }).click();
  await expect(page.getByRole('textbox', { name: '显示昵称' })).toHaveValue('审计复验昵称');
});

test('settings: restoring demo data discards a real change (not just the untouched seed)', async ({ page }) => {
  // Make a real change first: resetting pristine seed data can pass without working (audit F04).
  await page.getByRole('button', { name: '新建记录' }).click();
  const dialog = page.getByRole('dialog', { name: '新建档案记录' });
  await dialog.getByRole('textbox', { name: /标题/ }).fill('审计复验记录');
  await dialog.getByRole('textbox', { name: /学科/ }).fill('物理学');
  await dialog.getByRole('button', { name: '保存草稿' }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText('1001 / 1001 条')).toBeVisible();

  await page.getByRole('tab', { name: '设置' }).click();
  await page.getByRole('button', { name: '恢复演示数据' }).click();
  await page.getByRole('tab', { name: '档案' }).click();
  await expect(page.getByText('1000 / 1000 条')).toBeVisible();

  // And it is really gone from storage, not just from this render.
  await page.reload();
  await expect(page.getByText('1000 / 1000 条')).toBeVisible();
  await page.getByRole('searchbox').fill('审计复验记录');
  await expect(page.getByText('0 / 1000 条')).toBeVisible();
});
