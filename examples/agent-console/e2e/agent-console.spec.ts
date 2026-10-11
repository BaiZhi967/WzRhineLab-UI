import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

/**
 * Agent console example: a consumer adapter over a mock runtime feeds @wzrhine/agent through its
 * public entry. Covers the full approval loop with a lost receipt, stream dedupe, locale switch,
 * instance isolation, axe in both themes and narrow-screen overflow.
 */

const axe = async (page: Page) => {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  return results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
};

const consoleOf = (page: Page, instance: 'primary' | 'secondary') => page.locator(`[data-instance="${instance}"]`);
const composerOf = (scope: Locator) => scope.locator('.rl-agent-composer textarea');
const messagesOf = (scope: Locator) => scope.locator('article.rl-agent-message');
const logOf = (scope: Locator) => scope.locator('.console-log__entry');

async function open(page: Page, width = 1440) {
  await page.setViewportSize({ width, height: 1000 });
  await page.goto('/');
  await expect(consoleOf(page, 'primary').locator('.rl-agent-shell')).toBeVisible();
}

async function send(scope: Locator, text: string) {
  const input = composerOf(scope);
  await input.click();
  await input.pressSequentially(text);
  await input.press('Enter');
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

test('send → tools → approval → unknown receipt → retry with the same actionId → approved', async ({ page }) => {
  await open(page);
  const primary = consoleOf(page, 'primary');

  // Mention a file from the fake list, then send with Enter.
  const input = composerOf(primary);
  await input.click();
  await input.pressSequentially('检查配置 @conf');
  await expect(page.getByRole('option', { name: /config\.py/ })).toBeVisible();
  await input.press('Enter');
  await input.press('Enter');
  await expect(primary.getByText('检查配置').first()).toBeVisible();

  // While the run is active the send button turns into stop.
  await expect(primary.getByRole('button', { name: '停止生成' })).toBeVisible();

  // Tool rows appear in the live ToolActivity under the streaming message.
  const activity = primary.locator('.rl-agent-activity');
  await expect(activity.locator('[data-tool-id$="-op1"]')).toBeVisible();
  await expect(activity.locator('[data-tool-id$="-op2"]')).toBeVisible();

  // The approval docks above the composer with the DiffPreview material.
  const approval = primary.locator('.rl-agent-approval');
  await expect(approval).toBeVisible({ timeout: 8000 });
  await expect(approval.locator('.rl-agent-diff, [class*="rl-agent-diff"]').first()).toBeVisible();
  await expect(approval.getByRole('button', { name: '拒绝' })).toBeEnabled();
  await approval.getByRole('button', { name: '允许一次' }).click();

  // First receipt is lost: unknown, never shown as approved, with a retry of the same action.
  await expect(approval).toHaveAttribute('data-status', 'unknown');
  await expect(approval.locator('.rl-agent-approval__unknown').getByText('结果待确认')).toBeVisible();
  const retry = approval.getByRole('button', { name: '重试提交' });
  await expect(retry).toBeVisible();
  await retry.click();

  await expect(approval).toHaveAttribute('data-status', 'approved', { timeout: 8000 });
  await expect(approval.locator('.rl-agent-approval__receipt').getByText('已允许此操作')).toBeVisible();
  await expect(primary.getByText(/已把 .*src\/config\.py.* 中的 debug 改为 False/).first()).toBeVisible({ timeout: 8000 });

  // The adapter log shows the same actionId sent twice for approve.
  const approveCommands = primary.locator('.console-log__entry[data-kind="command"][data-command="approve"]');
  await expect(approveCommands).toHaveCount(2);
  const ids = await approveCommands.evaluateAll((nodes) => nodes.map((n) => n.getAttribute('data-action-id')));
  expect(ids[0]).toBeTruthy();
  expect(ids[0]).toBe(ids[1]);
  await expect(primary.locator('.console-log__entry[data-kind="command"][data-command="approve"]').filter({ hasText: '重试同一动作' })).toHaveCount(1);
  const results = await primary
    .locator('.console-log__entry[data-kind="result"][data-command="approve"]')
    .evaluateAll((nodes) => nodes.map((n) => n.textContent ?? ''));
  expect(results.some((r) => r.includes('unknown'))).toBe(true);
  expect(results.some((r) => r.includes('accepted'))).toBe(true);
});

test('stop while running ends the run as cancelled', async ({ page }) => {
  await open(page);
  const primary = consoleOf(page, 'primary');
  await send(primary, '开始后停止');
  const stop = primary.getByRole('button', { name: '停止生成' });
  await expect(stop).toBeEnabled();
  await stop.click();
  await expect(primary.getByText('已按你的要求停止（示例）')).toBeVisible({ timeout: 8000 });
  await expect(primary.getByRole('button', { name: '发送' })).toBeVisible();
  await expect(primary.locator('.console-log__entry[data-kind="result"][data-command="stop"]').filter({ hasText: 'accepted' })).toHaveCount(1);
});

test('duplicate, out-of-order and stale replayed events do not duplicate messages', async ({ page }) => {
  await open(page);
  const primary = consoleOf(page, 'primary');
  await expect(messagesOf(primary)).toHaveCount(2);

  await send(primary, '统计样本');
  await expect(primary.locator('.rl-agent-approval')).toBeVisible({ timeout: 8000 });

  // The runtime delivered the user message twice, the command row before the read completion,
  // and an older assistant revision after the newer one: the adapter dropped or reordered all three.
  await expect(logOf(primary).filter({ hasText: '重复到达，已丢弃' })).toHaveCount(1);
  await expect(logOf(primary).filter({ hasText: '尚未到达（乱序）' })).toHaveCount(1);
  await expect(logOf(primary).filter({ hasText: '已补齐' })).toHaveCount(1);
  await expect(logOf(primary).filter({ hasText: '的旧修订 rev 2' })).toHaveCount(1);

  await expect(messagesOf(primary)).toHaveCount(4);
  const ids = await messagesOf(primary).evaluateAll((nodes) => nodes.map((n) => n.getAttribute('data-message-id')));
  expect(new Set(ids).size).toBe(ids.length);
  // The stale replay did not roll the assistant text back.
  await expect(primary.getByText('等待你的批准（示例）')).toBeVisible();
  // Tool rows stay in sequence order and unique despite the out-of-order delivery.
  const toolIds = await primary.locator('.rl-agent-activity [data-tool-id]').evaluateAll((nodes) => nodes.map((n) => n.getAttribute('data-tool-id')));
  expect(toolIds).toEqual(['run-1-op1', 'run-1-op2', 'run-1-op3']);
});

test('switching to English changes the component copy', async ({ page }) => {
  await open(page);
  const primary = consoleOf(page, 'primary');
  await expect(primary.getByRole('button', { name: '发送' })).toBeVisible();

  await page.getByRole('switch', { name: 'English' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Agent console (sample)');
  await expect(primary.getByRole('button', { name: 'Send', exact: true })).toBeVisible();
  await expect(primary.getByRole('button', { name: '发送' })).toHaveCount(0);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');

  await page.getByRole('switch', { name: 'English' }).click();
  await expect(primary.getByRole('button', { name: '发送' })).toBeVisible();
});

test('the two shells are isolated', async ({ page }) => {
  await open(page);
  const primary = consoleOf(page, 'primary');
  const secondary = consoleOf(page, 'secondary');
  await expect(secondary.locator('.rl-agent-shell')).toBeVisible();

  // Typing in one composer does not touch the other.
  await composerOf(primary).click();
  await composerOf(primary).pressSequentially('只在主实例');
  await expect(composerOf(primary)).toHaveValue('只在主实例');
  await expect(composerOf(secondary)).toHaveValue('');

  // A run in the secondary instance stays there.
  await send(secondary, '第二实例的任务');
  await expect(secondary.locator('.rl-agent-approval')).toBeVisible({ timeout: 8000 });
  await expect(primary.locator('.rl-agent-approval')).toHaveCount(0);
  await expect(composerOf(primary)).toHaveValue('只在主实例');
  await expect(logOf(primary).filter({ hasText: 'send →' })).toHaveCount(0);
  await expect(secondary.getByText('第二实例的任务').first()).toBeVisible();
  await expect(primary.getByText('第二实例的任务')).toHaveCount(0);

  // No duplicate ids anywhere on the page.
  const duplicates = await page.evaluate(() => {
    const seen = new Map<string, number>();
    for (const el of Array.from(document.querySelectorAll('[id]'))) seen.set(el.id, (seen.get(el.id) ?? 0) + 1);
    return [...seen].filter(([, n]) => n > 1).map(([id]) => id);
  });
  expect(duplicates).toEqual([]);
});

test('axe is clean in light and dark', async ({ page }) => {
  await open(page);
  // Include an open approval and tool rows in the scan.
  await send(consoleOf(page, 'primary'), '检查配置');
  await expect(consoleOf(page, 'primary').locator('.rl-agent-approval')).toBeVisible({ timeout: 8000 });
  expect(await axe(page)).toEqual([]);

  await page.getByRole('switch', { name: '深色主题' }).click();
  await expect(page.locator('.app-root')).toHaveAttribute('data-rl-theme', 'dark');
  expect(await axe(page)).toEqual([]);
});

test('no horizontal overflow at 390', async ({ page }) => {
  await open(page, 390);
  await send(consoleOf(page, 'primary'), '检查配置');
  await expect(consoleOf(page, 'primary').locator('.rl-agent-approval')).toBeVisible({ timeout: 8000 });
  const overflow = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const offenders: string[] = [];
    for (const el of Array.from(document.querySelectorAll<HTMLElement>('body *'))) {
      // Intentional inner scrollers (tab lists, code, diff, terminal) may extend inside their own box.
      if (el.closest('.rl-tabs__list, pre, .console-log__scroll')) continue;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      if (rect.right > vw + 1 || rect.left < -1) offenders.push(`${el.tagName.toLowerCase()}.${[...el.classList].join('.')}`);
    }
    return { scrollWidth: document.documentElement.scrollWidth, clientWidth: vw, offenders: offenders.slice(0, 10) };
  });
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);
  expect(overflow.offenders).toEqual([]);
});
