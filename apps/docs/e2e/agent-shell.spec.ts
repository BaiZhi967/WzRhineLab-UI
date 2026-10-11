import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { findHorizontalOverflow, setSettings } from './helpers';

/** Agent shell family (atlas 01–04, 26) in a real browser: selection, row menu, pane toggle, resize. */
test.use({ viewport: { width: 1440, height: 960 } });

const axe = async (page: Page) => {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  return results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
};

const open = async (page: Page) => {
  await setSettings(page, {});
  await page.goto('/#/agent/shell');
  const demo = page.locator('section[aria-labelledby="shell-demo-title"]');
  await expect(demo).toBeVisible();
  const shell = demo.getByTestId('shell-demo');
  const list = shell.getByRole('region', { name: '会话列表（示例）' });
  return { demo, shell, list };
};

test.describe('Agent shell', () => {
  test('click and ↑ / ↓ + Enter select a conversation; aria-current moves', async ({ page }) => {
    const { shell, list } = await open(page);
    await expect(shell).toHaveAttribute('data-layout', 'wide');
    const coral = list.getByRole('button', { name: /^珊瑚礁图像分类(，|$)/ });
    const sat = list.getByRole('button', { name: /^卫星影像处理(，|$)/ });
    await expect(coral).toHaveAttribute('aria-current', 'true');

    await sat.click();
    await expect(sat).toHaveAttribute('aria-current', 'true');
    await expect(coral).not.toHaveAttribute('aria-current');
    await expect(list.locator('[aria-current="true"]')).toHaveCount(1);
    await expect(shell.getByRole('heading', { level: 3, name: '卫星影像处理' })).toBeVisible();

    // Arrows move focus only; Enter selects.
    await page.keyboard.press('ArrowDown');
    const lab = list.getByRole('button', { name: /^实验报告草稿(，|$)/ });
    await expect(lab).toBeFocused();
    await expect(sat).toHaveAttribute('aria-current', 'true');
    await page.keyboard.press('Enter');
    await expect(lab).toHaveAttribute('aria-current', 'true');
    await expect(sat).not.toHaveAttribute('aria-current');

    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowUp');
    await expect(coral).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(coral).toHaveAttribute('aria-current', 'true');
    await expect(list.locator('[aria-current="true"]')).toHaveCount(1);
    await expect(shell.getByTestId('reading')).toContainText('珊瑚礁图像分类');
  });

  test('the row menu opens without selecting; delete confirms in an AlertDialog', async ({ page }) => {
    const { demo, list } = await open(page);
    const coral = list.getByRole('button', { name: /^珊瑚礁图像分类(，|$)/ });
    const lab = list.getByRole('button', { name: /^实验报告草稿(，|$)/ });
    const more = list.getByRole('button', { name: '实验报告草稿 的操作' });

    await lab.hover();
    await more.click();
    const menu = page.getByRole('menu');
    await expect(menu).toBeVisible();
    await expect(coral).toHaveAttribute('aria-current', 'true');
    await expect(lab).not.toHaveAttribute('aria-current');

    await menu.getByRole('menuitem', { name: '删除' }).click();
    const dialog = page.getByRole('alertdialog', { name: '删除会话？' });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('「实验报告草稿」及其全部消息将被删除');
    await dialog.getByRole('button', { name: '取消' }).click();
    await expect(dialog).toBeHidden();
    await expect(lab).toBeVisible();

    await more.click();
    await page.getByRole('menu').getByRole('menuitem', { name: '删除' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: '删除会话' }).click();
    await expect(page.getByRole('alertdialog')).toBeHidden();
    await expect(list.getByRole('button', { name: /^实验报告草稿(，|$)/ })).toHaveCount(0);
    await expect(demo.getByTestId('shell-log')).toContainText('已删除「实验报告草稿」');
    await expect(coral).toHaveAttribute('aria-current', 'true');
  });

  test('the context toggle flips aria-pressed and opens / closes the pane', async ({ page }) => {
    const { shell } = await open(page);
    const toggle = shell.getByRole('button', { name: '详情面板', exact: true });
    const column = shell.locator('.rl-agent-shell__context');
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(column).toHaveAttribute('data-open', 'true');
    await expect(shell.getByRole('complementary', { name: '会话详情（示例）' })).toBeVisible();

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await expect(column).not.toHaveAttribute('data-open');
    await expect(shell.getByRole('complementary', { name: '会话详情（示例）' })).toHaveCount(0);
    await expect(shell.getByRole('separator')).toHaveCount(0);

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(column).toHaveAttribute('data-open', 'true');
    // The pane's own close button returns focus to the toggle.
    await shell.getByRole('button', { name: '关闭详情面板' }).click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await expect(toggle).toBeFocused();
  });

  test('compact layout opens the pane as a sheet', async ({ page }) => {
    await open(page);
    const cell = page.locator('section[aria-labelledby="shell-layouts-title"] [data-layout="compact"]');
    const toggle = cell.getByRole('button', { name: '详情面板', exact: true });
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await toggle.click();
    const sheet = page.getByRole('dialog', { name: '会话详情（compact 示例）' });
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole('tab', { name: '摘要' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(sheet).toBeHidden();
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await expect(toggle).toBeFocused();
  });

  test('ResizeHandle: keyboard changes aria-valuenow', async ({ page }) => {
    await open(page);
    const section = page.locator('section[aria-labelledby="shell-resize-title"]');
    const handle = section.getByRole('separator', { name: '调整示例面板宽度' });
    await expect(handle).toHaveAttribute('aria-valuenow', '144');
    await expect(handle).toHaveAttribute('aria-valuemin', '96');
    await expect(handle).toHaveAttribute('aria-valuemax', '200');
    await handle.focus();
    await page.keyboard.press('ArrowLeft');
    await expect(handle).toHaveAttribute('aria-valuenow', '152');
    await page.keyboard.press('Shift+ArrowRight');
    await expect(handle).toHaveAttribute('aria-valuenow', '120');
    await page.keyboard.press('End');
    await expect(handle).toHaveAttribute('aria-valuenow', '200');
    await page.keyboard.press('ArrowLeft');
    await expect(handle).toHaveAttribute('aria-valuenow', '200');
    await page.keyboard.press('Home');
    await expect(handle).toHaveAttribute('aria-valuenow', '96');
    await expect(section.getByTestId('resize-value')).toContainText('96 像素');
    await handle.dblclick();
    await expect(handle).toHaveAttribute('aria-valuenow', '144');

    // The shell's own handle follows the same keys.
    const shellHandle = page.getByTestId('shell-demo').getByRole('separator', { name: '调整详情面板宽度' });
    const min = (await shellHandle.getAttribute('aria-valuemin'))!;
    await shellHandle.focus();
    await page.keyboard.press('Home');
    await expect(shellHandle).toHaveAttribute('aria-valuenow', min);
    await page.keyboard.press('ArrowLeft');
    await expect(shellHandle).toHaveAttribute('aria-valuenow', String(Number(min) + 16));
  });

  test('axe clean (light and dark), with a row menu open', async ({ page }) => {
    const { list } = await open(page);
    expect(await axe(page)).toEqual([]);
    await list.getByRole('button', { name: /^卫星影像处理(，|$)/ }).hover();
    await list.getByRole('button', { name: '卫星影像处理 的操作' }).click();
    await expect(page.getByRole('menu')).toBeVisible();
    expect(await axe(page)).toEqual([]);
    await page.keyboard.press('Escape');
    await setSettings(page, { theme: 'dark' });
    await page.reload();
    await expect(page.locator('h1')).toBeVisible();
    expect(await axe(page)).toEqual([]);
  });

  test('no horizontal overflow at 320; the demo shell switches to narrow', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    const { shell } = await open(page);
    await expect(shell).toHaveAttribute('data-layout', 'narrow');
    await expect(shell.getByRole('button', { name: '打开会话列表' })).toBeVisible();
    const report = await findHorizontalOverflow(page);
    expect(report.offenders).toEqual([]);
    expect(report.scrollWidth).toBeLessThanOrEqual(report.clientWidth);
  });
});
