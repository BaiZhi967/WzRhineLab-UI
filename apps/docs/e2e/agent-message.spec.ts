import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { findHorizontalOverflow, setSettings } from './helpers';

/** Message family (atlas 05–10, 32, 35) in a real browser: scroll ownership, disclosure, copy, citations. */
test.use({ viewport: { width: 1280, height: 900 } });

const url = '/#/agent/messages';

const axe = async (page: Page) => {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  return results.violations.map((v) => `${v.id}: ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(', ')}`);
};

test.beforeEach(async ({ page }) => {
  await setSettings(page, {});
  // Deterministic clipboard: record writes instead of depending on browser permissions.
  await page.addInitScript(() => {
    const store = { text: '' };
    (window as unknown as { __clip: typeof store }).__clip = store;
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (text: string) => {
          store.text = text;
        },
      },
    });
  });
});

const listRegion = (page: Page) => page.getByTestId('message-list-demo').getByRole('region', { name: '对话消息' });

test.describe('MessageList scroll ownership', () => {
  test('scrolling up stops following; new content shows JumpToLatest; jumping returns and hides it', async ({ page }) => {
    await page.goto(url);
    const demo = page.getByRole('region', { name: 'MessageList' });
    const viewport = listRegion(page);
    const distance = () => viewport.evaluate((el) => Math.round(el.scrollHeight - el.scrollTop - el.clientHeight));

    // Fill the list until it scrolls, then confirm it starts at the bottom.
    for (let i = 0; i < 4; i += 1) await demo.getByRole('button', { name: '追加助手消息' }).click();
    await expect.poll(distance).toBeLessThanOrEqual(4);
    await expect(page.getByTestId('follow-state')).toHaveText('跟随最新');

    await viewport.hover();
    await page.mouse.wheel(0, -600);
    await expect(page.getByTestId('follow-state')).toHaveText('阅读历史');
    const top = await viewport.evaluate((el) => el.scrollTop);

    await demo.getByRole('button', { name: '追加助手消息' }).click();
    await demo.getByRole('button', { name: '追加助手消息' }).click();
    const jump = demo.getByRole('button', { name: /返回最新消息，2 条新消息/ });
    await expect(jump).toBeVisible();
    // Reading position is kept and focus did not move to the jump button.
    expect(Math.abs((await viewport.evaluate((el) => el.scrollTop)) - top)).toBeLessThanOrEqual(1);
    await expect(jump).not.toBeFocused();

    await jump.click();
    await expect.poll(distance).toBeLessThanOrEqual(4);
    await expect(demo.getByRole('button', { name: /返回最新消息/ })).toHaveCount(0);
    await expect(page.getByTestId('follow-state')).toHaveText('跟随最新');
  });

  test('keyboard PageUp in the viewport stops following; sending scrolls to the latest', async ({ page }) => {
    await page.goto(url);
    const demo = page.getByRole('region', { name: 'MessageList' });
    const viewport = listRegion(page);
    for (let i = 0; i < 4; i += 1) await demo.getByRole('button', { name: '追加助手消息' }).click();
    await viewport.focus();
    await page.keyboard.press('PageUp');
    await expect(page.getByTestId('follow-state')).toHaveText('阅读历史');
    await demo.getByRole('button', { name: '发送示例消息' }).click();
    await expect(page.getByTestId('follow-state')).toHaveText('跟随最新');
    await expect.poll(() => viewport.evaluate((el) => Math.round(el.scrollHeight - el.scrollTop - el.clientHeight))).toBeLessThanOrEqual(4);
  });

  test('loading earlier messages keeps the visible message in place', async ({ page }) => {
    await page.goto(url);
    const demo = page.getByRole('region', { name: 'MessageList' });
    const viewport = listRegion(page);
    await viewport.evaluate((el) => {
      el.scrollTop = 0;
    });
    const firstId = 'm-1';
    const offset = () =>
      viewport.evaluate((el, id) => {
        const node = el.querySelector(`li[data-message-id="${id}"]`)!;
        return Math.round(node.getBoundingClientRect().top - el.getBoundingClientRect().top);
      }, firstId);
    const before = await offset();
    await demo.getByRole('button', { name: '加载更早消息' }).click();
    await expect(viewport.locator('li[data-message-id="old-0"]')).toHaveCount(1);
    await expect.poll(offset).toBeGreaterThanOrEqual(before - 2);
    expect(Math.abs((await offset()) - before)).toBeLessThanOrEqual(2);
  });
});

test('ThinkingBlock toggles with Enter and Space; aria-expanded follows', async ({ page }) => {
  await page.goto(url);
  const region = page.getByRole('region', { name: 'ThinkingBlock' });
  const trigger = region.getByRole('button', { name: /思考 2/ });
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await trigger.focus();
  await page.keyboard.press('Enter');
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  const panelId = await trigger.getAttribute('aria-controls');
  expect(panelId).toBeTruthy();
  await expect(page.locator(`[id="${panelId}"]`)).toBeVisible();
  await page.keyboard.press('Space');
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
});

test('copy action shows the copied state and writes the text', async ({ page }) => {
  await page.goto(url);
  const region = page.getByTestId('copy-specimen');
  const copy = region.getByRole('button', { name: '复制消息' });
  await copy.click();
  await expect(region.getByRole('button', { name: '已复制' }).first()).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { __clip: { text: string } }).__clip.text)).toBe('可复制的示例回答。');
  await expect(region.getByRole('button', { name: '复制消息' })).toBeVisible({ timeout: 3000 });
});

test('unavailable citation is focusable but not openable; available one opens', async ({ page }) => {
  await page.goto(url);
  const region = page.getByTestId('citation-specimen');
  const dead = region.getByRole('button', { name: /引用 2：已删除的旧报告/ });
  await expect(dead).toHaveAttribute('aria-disabled', 'true');
  await dead.focus();
  await expect(dead).toBeFocused();
  await page.keyboard.press('Enter');
  // Playwright treats aria-disabled as not actionable; force the pointer path anyway.
  await dead.click({ force: true });
  await expect(page.getByTestId('citation-log')).toHaveText('尚未打开引用。');
  await region.getByRole('button', { name: '引用 1：manifest.csv' }).click();
  await expect(page.getByTestId('citation-log')).toContainText('onOpen：1 · manifest.csv');
});

test('custom part without renderer and unknown part types show a fallback', async ({ page }) => {
  await page.goto(url);
  await expect(page.getByTestId('part-sp-custom')).toContainText('无法显示此内容');
  await expect(page.getByTestId('part-sp-custom')).toContainText('图表：3 组示例数据');
  await expect(page.getByTestId('part-sp-unknown')).toContainText('内容类型：hologram');
});

test('run details disclosure toggles with the keyboard and shows the rows', async ({ page }) => {
  await page.goto(url);
  const region = page.getByTestId('details-specimen');
  const trigger = region.getByRole('button', { name: '运行详情' });
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect(region.getByText('sample-model-2026-10-01')).toHaveCount(0);
  await trigger.focus();
  await page.keyboard.press('Enter');
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByTestId('details-state')).toHaveText('运行详情：已展开（受控）');
  await expect(region.getByText('sample-model-2026-10-01')).toBeVisible();
  await expect(region.getByText('2 次调用未返回用量')).toBeVisible();
  await page.keyboard.press('Space');
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByTestId('details-state')).toHaveText('运行详情：已折叠（受控）');
  // Standalone lower-bound wording and the skill row.
  await expect(region.getByText('至少 18s')).toBeVisible();
  await expect(region.getByRole('list', { name: '已加载技能' }).first()).toContainText('reef-analysis');
});

test('disabled fork stays focusable, shows its reason and does nothing', async ({ page }) => {
  await page.goto(url);
  const region = page.getByTestId('fork-disabled-actions');
  const fork = region.getByRole('button', { name: '从此处分叉' });
  await expect(fork).toHaveAttribute('aria-disabled', 'true');
  await expect(fork).toHaveAccessibleDescription('当前运行未结束，暂不能分叉（示例）');
  // Keyboard: Tab into the toolbar, arrow to fork; it takes focus and the tooltip names the reason.
  await region.getByRole('button', { name: '复制消息' }).focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await expect(fork).toBeFocused();
  await expect(page.locator('.rl-tooltip').filter({ hasText: '从此处分叉 · 当前运行未结束，暂不能分叉（示例）' })).toBeVisible();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Space');
  // Playwright treats aria-disabled as not actionable; force the pointer path anyway.
  await fork.click({ force: true });
  await expect(page.getByTestId('capability-log')).toHaveText('尚未触发操作。');
});

test('restore-input action on a failed message calls back with the message id', async ({ page }) => {
  await page.goto(url);
  const region = page.getByTestId('restore-message');
  await expect(region.getByText('生成失败')).toBeVisible();
  await region.getByRole('button', { name: '重新编辑本轮输入' }).click();
  await expect(page.getByTestId('capability-log')).toHaveText('回调（示例）：重新编辑本轮输入 restore-1');
});

test('holdFollow: new content does not scroll while held; release returns to the latest', async ({ page }) => {
  await page.goto(url);
  const demo = page.getByRole('region', { name: 'MessageList' });
  const viewport = listRegion(page);
  const distance = () => viewport.evaluate((el) => Math.round(el.scrollHeight - el.scrollTop - el.clientHeight));
  for (let i = 0; i < 4; i += 1) await demo.getByRole('button', { name: '追加助手消息' }).click();
  await expect.poll(distance).toBeLessThanOrEqual(4);
  const hold = demo.getByRole('button', { name: /holdFollow/ });
  await hold.click();
  await expect(hold).toHaveAttribute('aria-pressed', 'true');
  const top = await viewport.evaluate((el) => el.scrollTop);
  await demo.getByRole('button', { name: '追加助手消息' }).click();
  await expect(demo.getByRole('button', { name: /返回最新消息，1 条新消息/ })).toBeVisible();
  expect(Math.abs((await viewport.evaluate((el) => el.scrollTop)) - top)).toBeLessThanOrEqual(1);
  await hold.click();
  await expect.poll(distance).toBeLessThanOrEqual(4);
  await expect(demo.getByRole('button', { name: /返回最新消息/ })).toHaveCount(0);
});

test('axe: no WCAG 2.2 A/AA violations (light and dark)', async ({ page }) => {
  await page.goto(url);
  await expect(page.locator('h1')).toBeVisible();
  expect(await axe(page)).toEqual([]);
  await setSettings(page, { theme: 'dark' });
  await page.goto(url);
  await page.reload();
  await expect(page.locator('h1')).toBeVisible();
  expect(await axe(page)).toEqual([]);
});

test('no horizontal overflow at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto(url);
  await expect(page.locator('h1')).toBeVisible();
  const result = await findHorizontalOverflow(page);
  expect(result.offenders).toEqual([]);
  expect(result.scrollWidth).toBeLessThanOrEqual(result.clientWidth);
});
