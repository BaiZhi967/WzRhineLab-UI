import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { findHorizontalOverflow, setSettings } from './helpers';

/** Real-browser checks for the workspace & artifact family (terminals, context, ledger, artifacts, file preview). */
test.use({ viewport: { width: 1280, height: 900 } });

const url = '/#/agent/workspace';

const axe = async (page: Page) => {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  return results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
};

const open = async (page: Page) => {
  await setSettings(page, {});
  await page.goto(url);
  await expect(page.getByRole('heading', { level: 1, name: 'Workspace' })).toBeVisible();
};

test.describe('Terminals', () => {
  test('input sends on Enter and the echo appears in the log', async ({ page }) => {
    await open(page);
    const region = page.getByRole('region', { name: 'PersistentTerminal · TerminalTabs' });
    const input = region.getByRole('textbox', { name: '向 终端 A 输入' });
    await input.focus();
    await page.keyboard.type('y');
    await page.keyboard.press('Enter');
    await expect(input).toHaveValue('');
    const log = region.getByRole('log', { name: '终端 A 输出' });
    await expect(log).toContainText('已收到输入（示例回显）：y');
    await expect(log).toHaveAttribute('aria-live', 'off');
  });

  test('stop shows stop-pending text, then ends', async ({ page }) => {
    await open(page);
    const region = page.getByRole('region', { name: 'PersistentTerminal · TerminalTabs' });
    await region.getByRole('button', { name: '停止 终端 A' }).click();
    await expect(region.getByRole('tabpanel').getByText('停止尚未确认', { exact: true })).toBeVisible();
    await expect(region.getByRole('button', { name: '停止 终端 A' })).toHaveCount(0);
    await expect(region.getByRole('tabpanel').getByRole('status')).toContainText('已结束', { timeout: 5000 });
  });

  test('inherited terminal has no stop or input controls', async ({ page }) => {
    await open(page);
    const region = page.getByRole('region', { name: 'PersistentTerminal · TerminalTabs' });
    const firstTab = region.getByRole('tab').first();
    await firstTab.focus();
    await page.keyboard.press('End');
    await page.keyboard.press('Enter');
    await expect(region.getByRole('tab', { name: /继承终端/ })).toHaveAttribute('aria-selected', 'true');
    const panel = region.getByRole('tabpanel');
    await expect(panel.getByText('继承的终端记录 · 只读')).toBeVisible();
    await expect(panel.getByRole('textbox')).toHaveCount(0);
    await expect(panel.getByRole('button')).toHaveCount(0);
  });
});

test.describe('ContextUsage', () => {
  test('unknown max: no meter and no percentage', async ({ page }) => {
    await open(page);
    const region = page.getByRole('region', { name: 'ContextUsage' });
    const unknown = region.locator('.sc-card-list[data-case="上限未知"]');
    await expect(unknown).toContainText('上限未知，不显示百分比');
    await expect(unknown.getByRole('meter')).toHaveCount(0);
    await expect(unknown).not.toContainText('%');
    const partial = region.locator('.sc-card-list[data-case="部分数据"]');
    await expect(partial.getByRole('meter')).toHaveCount(0);
    // The estimated full view does have a meter.
    await expect(region.locator('.sc-card-list[data-case="估计值"]').getByRole('meter')).toHaveCount(1);
  });

  test('ring popover opens with the keyboard and closes with Escape', async ({ page }) => {
    await open(page);
    const trigger = page.getByRole('button', { name: '上下文用量 12.4K / 32K · 估计值' });
    await trigger.focus();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog', { name: '上下文用量' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('meter')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });
});

test.describe('Ledger, artifacts, file preview', () => {
  test('ledger filter keeps order and sets aria-selected', async ({ page }) => {
    await open(page);
    const region = page.getByRole('region', { name: 'ActivityLedger' });
    const all = await region.locator('.rl-agent-ledger__title').allTextContents();
    await region.getByRole('tab', { name: /工具/ }).click();
    await expect(region.getByRole('tab', { name: /工具/ })).toHaveAttribute('aria-selected', 'true');
    await expect(region.getByRole('tab', { name: /全部/ })).toHaveAttribute('aria-selected', 'false');
    const tools = await region.locator('.rl-agent-ledger__title').allTextContents();
    expect(tools).toEqual(all.filter((t) => tools.includes(t)));
    expect(tools).toEqual(['read_file · data/reef/manifest.csv', 'run_command · classify.py']);
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    await expect(region.getByRole('tab', { name: /系统/ })).toHaveAttribute('aria-selected', 'true');
  });

  test('「已保存」 appears only on saved artifacts', async ({ page }) => {
    await open(page);
    const region = page.getByRole('region', { name: 'ArtifactList · ArtifactCard' });
    const cards = region.getByRole('article');
    const count = await cards.count();
    expect(count).toBeGreaterThan(4);
    for (let i = 0; i < count; i += 1) {
      const card = cards.nth(i);
      const status = await card.getAttribute('data-status');
      if (status === 'saved') await expect(card).toContainText('已保存');
      else await expect(card).not.toContainText('已保存');
    }
  });

  test('file preview tabs switch with arrow keys', async ({ page }) => {
    await open(page);
    const region = page.getByRole('region', { name: 'FilePreview' });
    const preview = region.getByRole('tab', { name: '预览' });
    await preview.focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    await expect(region.getByRole('tab', { name: '原始' })).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    await expect(region.getByRole('tab', { name: '元数据' })).toHaveAttribute('aria-selected', 'true');
    await expect(region.getByRole('tabpanel')).toContainText('text/x-python');
  });
});

test('axe: no WCAG A/AA violations (light and dark)', async ({ page }) => {
  await open(page);
  expect(await axe(page)).toEqual([]);
  await setSettings(page, { theme: 'dark' });
  await page.goto(url);
  await expect(page.getByRole('heading', { level: 1, name: 'Workspace' })).toBeVisible();
  expect(await axe(page)).toEqual([]);
});

test('no horizontal overflow at 320', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await open(page);
  const result = await findHorizontalOverflow(page);
  expect(result.offenders).toEqual([]);
  expect(result.scrollWidth).toBeLessThanOrEqual(result.clientWidth);
});
