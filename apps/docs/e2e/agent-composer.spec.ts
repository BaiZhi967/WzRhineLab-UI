import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { findHorizontalOverflow, setSettings } from './helpers';

/** Agent Composer family (ADR-0011 §8, atlas 14–19) in a real browser: tokens, menus, IME, send / stop, pickers. */
test.use({ viewport: { width: 1280, height: 900 } });

const axe = async (page: Page) => {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  return results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
};

const open = async (page: Page) => {
  await setSettings(page, {});
  await page.goto('/#/agent/composer');
  const demo = page.locator('section[aria-labelledby="composer-demo-title"]');
  await expect(demo).toBeVisible();
  const input = demo.getByRole('combobox', { name: '消息内容' });
  return { demo, input, send: demo.locator('.rl-agent-send') };
};

test.describe('Agent composer', () => {
  test('@ opens the listbox; ↓ + Enter inserts a token; Backspace removes it whole', async ({ page }) => {
    const { demo, input } = await open(page);
    await input.click();
    await page.keyboard.type('@');
    const listbox = demo.getByRole('listbox', { name: '引用文件与上下文' });
    await expect(listbox).toBeVisible();
    await expect(input).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.type('re');
    await expect(listbox.getByRole('option')).toHaveCount(3);
    await page.keyboard.press('ArrowDown');
    const active = await input.getAttribute('aria-activedescendant');
    await expect(listbox.locator(`[id="${active}"]`)).toContainText('report.pdf');
    await page.keyboard.press('Enter');

    await expect(input).toHaveAttribute('aria-expanded', 'false');
    await expect(input).toBeFocused();
    const value = await input.inputValue();
    expect(value).toContain('\u2068');
    expect(value).toContain('@report.pdf');
    await expect(demo.locator('.rl-agent-token[data-kind="file"]')).toHaveText('\u2068@report.pdf\u2069');
    await expect(demo.getByRole('list', { name: '待发送的附件与引用' })).toContainText('report.pdf');

    await page.keyboard.press('Backspace');
    await expect(input).toHaveValue('');
    await expect(demo.locator('.rl-agent-token')).toHaveCount(0);
    await expect(demo.getByRole('list', { name: '待发送的附件与引用' })).toHaveCount(0);
    // Whole-token delete is a native edit: undo brings it back.
    await page.keyboard.press('Control+z');
    await expect.poll(() => input.inputValue()).toContain('@report.pdf');
  });

  test('Tab on a folder drills into it', async ({ page }) => {
    const { demo, input } = await open(page);
    await input.click();
    await page.keyboard.type('@sr');
    await page.keyboard.press('Tab');
    await expect(input).toHaveValue('@src/');
    await expect(demo.getByRole('listbox')).toContainText('agent.ts');
    await expect(input).toBeFocused();
  });

  test('Esc closes the menu and the same query does not reopen until it changes', async ({ page }) => {
    const { demo, input } = await open(page);
    await input.click();
    await page.keyboard.type('@re');
    await expect(demo.getByRole('listbox')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(demo.getByRole('listbox')).toHaveCount(0);
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.type(' ');
    await page.keyboard.press('Backspace');
    await expect(input).toHaveValue('@re');
    await expect(input).toHaveAttribute('aria-expanded', 'false');
    await expect(demo.getByRole('listbox')).toHaveCount(0);
    await page.keyboard.type('a');
    await expect(demo.getByRole('listbox')).toBeVisible();
  });

  test('/ menu: a disabled command shows its reason and is not dispatched', async ({ page }) => {
    const { demo, input } = await open(page);
    await input.click();
    await page.keyboard.type('/');
    const listbox = demo.getByRole('listbox', { name: '命令与技能' });
    await expect(listbox.getByRole('group')).toHaveCount(2);
    await page.keyboard.type('fork');
    await expect(listbox.getByRole('option')).toHaveAttribute('aria-disabled', 'true');
    await page.keyboard.press('Enter');
    await expect(demo.locator('.rl-agent-composer__status')).toHaveText('不可用：运行中不能分叉');
    await expect(demo.getByTestId('demo-log')).toHaveText('未分发：/fork');
    await expect(input).toHaveValue('/fork');
  });

  test('Shift+Enter adds a line, Enter sends; the button switches send → stop → pending → send', async ({ page }) => {
    const { demo, input, send } = await open(page);
    await expect(send).toHaveAccessibleName('发送');
    await expect(send).toHaveAttribute('aria-disabled', 'true');
    await input.click();
    await page.keyboard.type('line one');
    await page.keyboard.press('Shift+Enter');
    await page.keyboard.type('line two');
    await expect(input).toHaveValue('line one\nline two');
    await expect(send).not.toHaveAttribute('aria-disabled');
    await page.keyboard.press('Enter');

    await expect(demo.getByTestId('sent-messages').getByRole('listitem')).toHaveText(['line one\nline two']);
    await expect(input).toHaveValue('');
    await expect(send).toHaveAccessibleName('停止生成');
    await send.click();
    await expect(send).toHaveAccessibleName('停止待确认');
    await expect(send).toHaveAttribute('aria-disabled', 'true');
    await expect(send).toBeFocused();
    await expect(send).toHaveAccessibleName('发送', { timeout: 5000 });
    await expect(demo.getByTestId('demo-log')).toHaveText('运行状态（示例）：已完成');
  });

  test('IME: Enter during composition does not send', async ({ page }) => {
    const { demo, input } = await open(page);
    await input.click();
    await page.keyboard.type('nihao');
    await input.evaluate((el) => {
      el.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true, data: '' }));
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', isComposing: true, bubbles: true, cancelable: true }));
    });
    await expect(input).toHaveValue('nihao');
    await input.evaluate((el) => {
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 229, bubbles: true, cancelable: true }));
      el.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: '' }));
    });
    await expect(demo.getByTestId('sent-messages').getByRole('listitem')).toHaveCount(0);
    await page.keyboard.press('Enter');
    await expect(demo.getByTestId('sent-messages').getByRole('listitem')).toHaveText(['nihao']);
  });

  test('elevated permission asks for confirmation; focus returns to the trigger', async ({ page }) => {
    const { demo } = await open(page);
    const trigger = demo.getByRole('button', { name: '权限模式：确认更改' });
    await trigger.click();
    await page.getByRole('menuitemradio', { name: /完全访问/ }).click();
    const dialog = page.getByRole('alertdialog', { name: '启用「完全访问」？' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: '取消' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    await expect(trigger).toBeVisible();

    await trigger.click();
    await page.getByRole('menuitemradio', { name: /完全访问/ }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: '启用完全访问' }).click();
    await expect(demo.getByRole('button', { name: '权限模式：完全访问' })).toBeVisible();
  });

  test('model picker drills into models and returns focus to the trigger', async ({ page }) => {
    const { demo } = await open(page);
    const trigger = demo.getByRole('button', { name: '模型：vision-1，思考强度：均衡' });
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: '模型与思考强度' });
    await dialog.getByRole('button', { name: /切换模型/ }).click();
    await expect(dialog.getByRole('button', { name: '返回思考强度' })).toBeFocused();
    await expect(dialog.getByRole('button', { name: /legacy-0/ })).toHaveAttribute('aria-disabled', 'true');
    await dialog.getByRole('button', { name: /text-1/ }).click();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(demo.getByRole('button', { name: /^模型：text-1/ })).toBeFocused();
  });

  test('axe clean (light and dark), with a menu open', async ({ page }) => {
    const { input } = await open(page);
    expect(await axe(page)).toEqual([]);
    await input.click();
    await page.keyboard.type('@');
    await expect(page.getByRole('listbox', { name: '引用文件与上下文' }).first()).toBeVisible();
    expect(await axe(page)).toEqual([]);
    await setSettings(page, { theme: 'dark' });
    await page.reload();
    await expect(page.locator('h1')).toBeVisible();
    expect(await axe(page)).toEqual([]);
  });

  test('no horizontal overflow at 320', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await open(page);
    const report = await findHorizontalOverflow(page);
    expect(report.offenders).toEqual([]);
    expect(report.scrollWidth).toBeLessThanOrEqual(report.clientWidth);
  });
});
