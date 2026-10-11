import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { findHorizontalOverflow, setSettings } from './helpers';

/** Real-browser checks for M12 group 2 (ADR-0010 §2): Combobox, CommandPalette, FileDropZone. */
test.use({ viewport: { width: 1280, height: 900 } });

const url = '/#/components/command';

const axe = async (page: Page) => {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  return results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
};

test.beforeEach(async ({ page }, testInfo) => {
  // The dark-theme test seeds its own settings.
  if (testInfo.title.startsWith('dark theme')) return;
  await setSettings(page, {});
  await page.goto(url);
});

test.describe('Combobox', () => {
  test('type to filter, ArrowDown + Enter selects, the input shows the label', async ({ page }) => {
    const input = page.getByRole('combobox', { name: '档案类别' });
    await input.click();
    await input.pressSequentially('样本');
    const listbox = page.getByRole('listbox');
    await expect(listbox.getByRole('option')).toHaveCount(2);
    await page.keyboard.press('ArrowDown');
    await expect(input).toHaveAttribute('aria-activedescendant', /.+/);
    await page.keyboard.press('Enter');
    await expect(input).toHaveValue('样本档案');
    await expect(page.getByText('当前值：spec（样本档案）')).toBeVisible();
    await expect(listbox).toBeHidden();
    await expect(input).toBeFocused();
  });

  test('async search shows the loading status, then results', async ({ page }) => {
    const input = page.getByRole('combobox', { name: '远程检索（模拟）' });
    await input.click();
    await input.pressSequentially('1024');
    const status = page.locator('.rl-combobox__status');
    await expect(status).toHaveText('正在搜索…');
    await expect(page.locator('.rl-combobox__popup')).toHaveAttribute('aria-busy', 'true');
    await expect(page.getByRole('option', { name: /ARC-1024/ })).toBeVisible();
    await expect(status).toHaveText('');
  });

  test('open popup and its field have no axe violations', async ({ page }) => {
    await page.getByRole('combobox', { name: '档案类别' }).click();
    await expect(page.getByRole('listbox')).toBeVisible();
    // Scoped: while an input-anchored list is open, Base UI sets aria-hidden on the rest of the page
    // (focusable controls inside it trip `aria-hidden-focus`); see docs/components/command.md.
    const results = await new AxeBuilder({ page })
      .include('.rl-combobox__popup')
      .include('#command-combobox-title')
      .include('.rl-combobox-field')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations.map((v) => v.id)).toEqual([]);
  });
});

test.describe('CommandPalette', () => {
  test('Control+K opens, typing filters, Enter runs and closes, focus returns', async ({ page }) => {
    const trigger = page.getByRole('button', { name: '打开命令面板' });
    await trigger.focus();
    await page.keyboard.press('Control+k');
    const dialog = page.getByRole('dialog', { name: '命令面板' });
    await expect(dialog).toBeVisible();
    const input = dialog.getByRole('combobox', { name: '搜索命令' });
    await expect(input).toBeFocused();
    await input.pressSequentially('导出');
    await expect(dialog.getByRole('option')).toHaveCount(1);
    await expect(dialog.locator('mark')).toHaveText('导出');
    await page.keyboard.press('Enter');
    await expect(dialog).toBeHidden();
    await expect(page.getByTestId('last-command')).toHaveText('上次执行：导出当前档案');
    await expect(trigger).toBeFocused();
  });

  test('the button opens it; Escape closes and returns focus', async ({ page }) => {
    const trigger = page.getByRole('button', { name: '打开命令面板' });
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: '命令面板' });
    await expect(dialog).toBeVisible();
    expect(await axe(page)).toEqual([]);
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('a disabled command shows its reason and does not run', async ({ page }) => {
    await page.getByRole('button', { name: '打开命令面板' }).click();
    const dialog = page.getByRole('dialog', { name: '命令面板' });
    await dialog.getByRole('combobox', { name: '搜索命令' }).pressSequentially('缓存');
    const option = dialog.getByRole('option', { name: /清除本地缓存/ });
    await expect(option).toHaveAttribute('aria-disabled', 'true');
    await expect(option).toContainText('需要管理员权限（示例）');
    await page.keyboard.press('Enter');
    // Playwright refuses to click aria-disabled elements; force sends the click anyway.
    await option.click({ force: true });
    await expect(dialog).toBeVisible();
    await expect(page.getByTestId('last-command')).toHaveText('上次执行：无');
  });
});

test.describe('CommandPalette async', () => {
  test('typing calls onQueryChange, the loading row shows, then server results', async ({ page }) => {
    await page.getByRole('button', { name: '远程搜索记录' }).click();
    const dialog = page.getByRole('dialog', { name: '远程命令搜索' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('输入编号开始搜索（示例）')).toBeVisible();
    await dialog.getByRole('combobox', { name: '搜索命令' }).pressSequentially('1024');
    await expect(page.getByTestId('async-query')).toContainText('查询：1024');
    const status = dialog.locator('.rl-command__status');
    await expect(status).toHaveText('正在搜索命令…');
    await expect(dialog.getByRole('listbox')).toHaveAttribute('aria-busy', 'true');
    const option = dialog.getByRole('option', { name: /打开 ARC-1024/ });
    await expect(option).toBeVisible();
    await expect(option.locator('.rl-command__meta')).toHaveText('6 天前');
    await expect(status).toHaveText('');
    expect(await axe(page)).toEqual([]);
    await page.keyboard.press('Enter');
    await expect(dialog).toBeHidden();
    await expect(page.getByTestId('async-query')).toContainText('上次执行：打开 ARC-1024');
  });
});

test.describe('SplitButton', () => {
  test('keyboard: Tab to the toggle, Enter opens the menu, ArrowDown + Enter runs, focus returns', async ({ page }) => {
    const group = page.getByRole('group', { name: '导出 CSV' });
    const toggle = group.getByRole('button', { name: '更多导出格式' });
    await group.getByRole('button', { name: '导出 CSV' }).focus();
    await page.keyboard.press('Tab');
    await expect(toggle).toBeFocused();
    await page.keyboard.press('Enter');
    const menu = page.getByRole('menu');
    await expect(menu).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(menu.getByRole('menuitem').first()).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(menu.getByRole('menuitem', { name: '导出 PDF 报告' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(menu).toBeHidden();
    await expect(page.getByTestId('split-last')).toContainText('导出 PDF 报告');
    await expect(toggle).toBeFocused();
  });

  test('both halves share one frame: same height, adjoining edges', async ({ page }) => {
    const group = page.getByRole('group', { name: '导出 CSV' });
    const a = await group.getByRole('button', { name: '导出 CSV' }).boundingBox();
    const b = await group.getByRole('button', { name: '更多导出格式' }).boundingBox();
    expect(a && b).toBeTruthy();
    expect(Math.abs(a!.height - b!.height)).toBeLessThan(1);
    // The toggle overlaps the main button by one border width.
    expect(Math.abs(b!.x - (a!.x + a!.width))).toBeLessThanOrEqual(1.5);
  });
});

test.describe('ScrollArea', () => {
  test('the region is focusable and scrolls with the keyboard; up keys report intent', async ({ page }) => {
    const region = page.getByRole('region', { name: '运行日志（示例）' });
    await expect(region).toHaveAttribute('tabindex', '0');
    await region.focus();
    await expect(region).toBeFocused();
    const top = () => region.evaluate((el) => el.scrollTop);
    expect(await top()).toBe(0);
    await page.keyboard.press('PageDown');
    await expect.poll(top).toBeGreaterThan(0);
    await page.keyboard.press('End');
    await expect.poll(() => region.evaluate((el) => Math.abs(el.scrollHeight - el.clientHeight - el.scrollTop))).toBeLessThan(2);
    await page.keyboard.press('ArrowUp');
    await expect(page.getByTestId('scroll-intent')).toContainText('向上滚动意图：1 次');
    await page.keyboard.press('Home');
    await expect.poll(top).toBe(0);
    // The overlay scrollbar is visible while the viewport has focus.
    await expect(page.locator('section[aria-labelledby="command-scroll-title"] .rl-scroll-area__scrollbar')).toHaveCSS('opacity', '1');
  });

  test('wheel scrolling is native and wheel up reports intent', async ({ page }) => {
    const region = page.getByRole('region', { name: '运行日志（示例）' });
    await region.hover();
    await page.mouse.wheel(0, 200);
    await expect.poll(() => region.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
    await page.mouse.wheel(0, -100);
    await expect(page.getByTestId('scroll-intent')).toContainText(/向上滚动意图：[1-9]/);
  });
});

test.describe('FileDropZone', () => {
  const png = (bytes: number) => ({ name: 'sample.png', mimeType: 'image/png', buffer: Buffer.alloc(bytes, 1) });

  test('too large file is rejected with a message; a valid png is accepted', async ({ page }) => {
    const input = page.getByLabel(/样本图像/);
    await input.setInputFiles({ ...png(2 * 1024 * 1024), name: 'huge.png' });
    const status = page.locator('.rl-file-drop__status');
    await expect(status).toContainText('「huge.png」超过 1 MB 的大小上限');
    await expect(page.getByText('huge.png · 超过 1 MB')).toBeVisible();

    await input.setInputFiles(png(2048));
    await expect(status).toContainText('已添加 1 个文件');
    await expect(page.getByTestId('accepted-files')).toContainText('sample.png · 2.0 KB');
  });

  test('the browse label is the visible focus target of the keyboard-focusable input', async ({ page }) => {
    const input = page.getByLabel(/样本图像/);
    await input.focus();
    await expect(input).toBeFocused();
    const outline = await page.locator('.rl-file-drop__browse').evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(outline).not.toBe('none');
  });

  test('drop with a synthetic DataTransfer runs validation', async ({ page }) => {
    const handle = await page.evaluateHandle(() => {
      const dt = new DataTransfer();
      dt.items.add(new File(['x'], 'notes.txt', { type: 'text/plain' }));
      return dt;
    });
    const area = page.locator('.rl-file-drop__area');
    await area.dispatchEvent('dragenter', { dataTransfer: handle });
    await expect(area).toHaveAttribute('data-drag-over');
    await area.dispatchEvent('drop', { dataTransfer: handle });
    await expect(area).not.toHaveAttribute('data-drag-over');
    await expect(page.locator('.rl-file-drop__status')).toContainText('「notes.txt」的文件类型不受支持');
  });
});

test('dark theme: open palette portals into the themed root with no axe violations', async ({ page }) => {
  await setSettings(page, { theme: 'dark' });
  await page.goto(url);
  await page.getByRole('button', { name: '打开命令面板' }).click();
  const popup = page.locator('.rl-command');
  await expect(popup).toBeVisible();
  expect(await popup.evaluate((el) => el.closest('.rl-theme')?.getAttribute('data-rl-theme'))).toBe('dark');
  expect(await axe(page)).toEqual([]);
});

test('page has no axe violations and no horizontal overflow at 320', async ({ page }) => {
  expect(await axe(page)).toEqual([]);
  await page.setViewportSize({ width: 320, height: 800 });
  const overflow = await findHorizontalOverflow(page);
  expect(overflow.offenders).toEqual([]);
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);
});
