import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { findHorizontalOverflow, setSettings } from './helpers';

/** Real-browser guarantees for the intervention family (atlas 20, 21, 34; ADR-0011 §6). */
test.use({ viewport: { width: 1280, height: 900 } });

const url = '/#/agent/intervention';

const axe = async (page: Page) => {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  return results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
};

const specimen = (page: Page, name: string | RegExp) => page.getByRole('region', { name, exact: typeof name === 'string' });

test.beforeEach(async ({ page }) => {
  await setSettings(page, {});
  await page.goto(url);
  await expect(page.getByRole('heading', { level: 1, name: 'Approval & questions' })).toBeVisible();
});

test.describe('ApprovalPanel', () => {
  test('availability false → 允许 disabled with visible reason, 拒绝 enabled', async ({ page }) => {
    const region = specimen(page, 'ApprovalPanel · waiting · 材料未核验');
    const allow = region.getByRole('button', { name: '允许一次' });
    await expect(allow).toBeDisabled();
    await expect(allow).toHaveAccessibleDescription('文件版本已变化，需要重新读取（示例）。');
    await expect(region.getByText('文件版本已变化，需要重新读取（示例）。')).toBeVisible();
    await expect(region.getByRole('button', { name: '拒绝' })).toBeEnabled();

    const loading = specimen(page, 'ApprovalPanel · material-loading');
    await expect(loading.getByRole('button', { name: '允许一次' })).toBeDisabled();
    await expect(loading.getByRole('button', { name: '拒绝' })).toBeEnabled();
  });

  test('interactive: allow → submitting → unknown → retry (same actionId) → approved', async ({ page }) => {
    const region = specimen(page, 'ApprovalPanel · interactive');
    const card = region.locator('.rl-agent-approval');
    await region.getByRole('button', { name: '允许一次' }).click();
    await expect(card).toHaveAttribute('data-status', 'submitting');
    await expect(card).toHaveAttribute('data-status', 'unknown');
    await expect(card.getByText('结果待确认').first()).toBeVisible();
    await expect(region.getByRole('button', { name: '允许一次' })).toHaveCount(0);
    await expect(region.getByRole('button', { name: '拒绝' })).toBeEnabled();
    await region.getByRole('button', { name: '重试提交' }).click();
    await expect(card).toHaveAttribute('data-status', 'approved');
    await expect(card.locator('.rl-agent-approval__receipt')).toHaveText('已允许此操作');
    await expect(card.getByRole('button')).toHaveCount(0);
    const log = (await region.getByTestId('approval-log').textContent()) ?? '';
    const ids = [...log.matchAll(/actionId (\S+)/g)].map((m) => m[1]);
    expect(ids).toHaveLength(2);
    expect(ids[0]).toBe(ids[1]);
  });

  test('JSON evidence opens in the disclosure', async ({ page }) => {
    const region = specimen(page, 'MCP · JSON evidence');
    const trigger = region.getByRole('button', { name: '查看审批依据（4 项）' });
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(region.locator('pre').filter({ hasText: '"sp-001"' })).toBeVisible();
  });
});

test.describe('QuestionnaireCard', () => {
  test('number key selects, Enter goes next, ←/→ page, aria-current step updates', async ({ page }) => {
    const region = specimen(page, 'QuestionnaireCard · interactive');
    const pager = region.getByRole('navigation', { name: '问题分页' });
    const currentDot = pager.locator('[aria-current="step"]');
    await expect(currentDot).toHaveAccessibleName('第 2 题，未回答');

    await pager.getByRole('button', { name: /^第 1 题/ }).click();
    await expect(currentDot).toHaveAccessibleName(/^第 1 题/);
    await expect(region.getByRole('radio', { name: /表格/ })).toBeFocused();
    await page.keyboard.press('1');
    await expect(region.getByRole('radio', { name: /报告/ })).toHaveAttribute('aria-checked', 'true');

    await page.keyboard.press('Enter');
    await expect(currentDot).toHaveAccessibleName(/^第 2 题/);
    await expect(region.getByRole('checkbox').first()).toBeFocused();
    await page.keyboard.press('2');
    await expect(region.getByRole('checkbox', { name: /包含图表/ })).toHaveAttribute('aria-checked', 'true');
    await expect(currentDot).toHaveAccessibleName('第 2 题，已回答');

    await page.keyboard.press('ArrowRight');
    await expect(currentDot).toHaveAccessibleName(/^第 3 题/);
    await expect(region.getByRole('textbox', { name: '补充说明' })).toBeFocused();
    await region.getByRole('button', { name: '上一页' }).focus();
    await page.keyboard.press('ArrowLeft');
    await expect(currentDot).toHaveAccessibleName(/^第 2 题/);
  });

  test('submit with unanswered shows the confirmation alert; skip-and-submit completes', async ({ page }) => {
    const region = specimen(page, 'QuestionnaireCard · interactive');
    await region.getByRole('button', { name: '提交回答' }).click();
    await expect(region.getByRole('alert')).toHaveText('还有 2 题未回答，将按跳过提交。');
    await expect(region.getByRole('button', { name: '返回填写' })).toBeFocused();
    await region.getByRole('button', { name: '跳过并提交' }).click();
    await expect(region.getByText('已提交回答')).toBeVisible();
    await expect(region.getByRole('form')).toHaveCount(0);
  });

  test('unknown offers 重试提交相同答案; read-only summaries have no inputs', async ({ page }) => {
    await expect(specimen(page, 'QuestionnaireCard · unknown').getByRole('button', { name: '重试提交相同答案' })).toBeVisible();
    const interrupted = specimen(page, 'QuestionnaireCard · interrupted');
    await expect(interrupted.getByText('未回答（已中断）').first()).toBeVisible();
    await expect(interrupted.getByRole('radio')).toHaveCount(0);
  });
});

test.describe('ErrorRecoveryNotice & dock', () => {
  test('only the danger notice is role=alert', async ({ page }) => {
    const region = specimen(page, 'ErrorRecoveryNotice · kinds');
    await expect(region.getByRole('alert')).toHaveCount(1);
    await expect(region.getByRole('alert')).toContainText('工具操作结果未确认');
    await expect(region.getByText('停止尚未确认，工具可能仍在运行。')).toBeVisible();
  });

  test('dock opens with cards and shows the pending counter', async ({ page }) => {
    const region = specimen(page, 'InterventionDock');
    await expect(region.getByRole('region', { name: '待处理的干预' })).toHaveCount(0);
    await region.getByRole('button', { name: '添加干预' }).click();
    const dock = region.getByRole('region', { name: '待处理的干预' });
    await expect(dock).toBeVisible();
    await expect(dock.getByText('还有 2 个待处理')).toBeVisible();
    await expect(dock.locator('.rl-agent-approval')).toBeVisible();
  });
});

test('axe clean (light + dark)', async ({ page }) => {
  expect(await axe(page)).toEqual([]);
  await page.evaluate(() => window.localStorage.setItem('wzrhine-showcase:settings', JSON.stringify({ theme: 'dark', density: 'comfortable', motion: 'user' })));
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'Approval & questions' })).toBeVisible();
  await specimen(page, 'InterventionDock').getByRole('button', { name: '添加干预' }).click();
  // Let the card entrance (opacity) finish before sampling contrast.
  await expect(page.locator('.rl-agent-dock__item').first()).toHaveCSS('opacity', '1');
  expect(await axe(page)).toEqual([]);
});

test.describe('GrantList', () => {
  test('revoke: first attempt is unconfirmed, retry reuses the action id, then the row is gone', async ({ page }) => {
    const region = specimen(page, 'GrantList · interactive');
    const list = region.getByRole('region', { name: '会话授权' });
    await expect(list.getByRole('listitem')).toHaveCount(3);
    await list.getByRole('button', { name: '撤销 npm test' }).click();
    await expect(list.getByText('结果待确认', { exact: true })).toBeVisible();
    const log = region.getByTestId('grant-log');
    const ids = async () => [...((await log.textContent()) ?? '').matchAll(/actionId (\S+)/g)].map((m) => m[1]);
    const [first] = await ids();
    await list.getByRole('button', { name: '重试撤销 npm test' }).click();
    await expect(list.getByRole('listitem')).toHaveCount(2);
    expect(await ids()).toEqual([first, first]);
    // Another grant revokes directly with a fresh id.
    await list.getByRole('button', { name: '撤销 python scripts/classify.py --batch' }).click();
    await expect(list.getByRole('listitem')).toHaveCount(1);
    await expect(list.getByRole('listitem')).toContainText('目录已被移除或改名（示例）');
  });

  test('unavailable grant: 重新选择 by keyboard', async ({ page }) => {
    const region = specimen(page, 'GrantList · interactive');
    await region.getByRole('button', { name: '重新选择 D:/datasets/reef-2026' }).focus();
    await page.keyboard.press('Enter');
    await expect(region.getByTestId('grant-log')).toContainText('重新选择 D:/datasets/reef-2026');
  });
});

test('ended questionnaire: 放弃未保存填写 asks first, Escape cancels, confirm discards', async ({ page }) => {
  const region = specimen(page, 'QuestionnaireCard · ended with unsaved draft');
  const trigger = region.getByRole('button', { name: '放弃未保存填写' });
  await trigger.click();
  const dialog = page.getByRole('alertdialog', { name: '放弃未保存的填写？' });
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await dialog.getByRole('button', { name: '放弃填写' }).click();
  await expect(dialog).toBeHidden();
  await expect(region.getByRole('button', { name: '放弃未保存填写' })).toHaveCount(0);
  await expect(region.getByTestId('discard-log')).toContainText('已放弃未保存填写');
});

test('no horizontal overflow at 320', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'Approval & questions' })).toBeVisible();
  await specimen(page, 'InterventionDock').getByRole('button', { name: '添加干预' }).click();
  await specimen(page, 'MCP · JSON evidence').getByRole('button', { name: /查看审批依据/ }).click();
  const result = await findHorizontalOverflow(page);
  expect(result.offenders).toEqual([]);
  expect(result.scrollWidth).toBeLessThanOrEqual(result.clientWidth);
});
