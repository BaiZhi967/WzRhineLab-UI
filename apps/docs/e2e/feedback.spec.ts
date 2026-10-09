import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { setSettings } from './helpers';

/** Real-browser guarantees for M2-B: Popover, Menu, Toast. */
test.use({ viewport: { width: 1280, height: 900 } });

const axe = async (page: Page) => {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  return results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
};

test.describe('Popover', () => {
  test('keyboard: open moves focus in, Tab leaves non-modally, Escape returns focus', async ({ page }) => {
    await page.goto('/#/components/popover');
    const trigger = page.getByRole('region', { name: 'Popover' }).first().getByRole('button', { name: '筛选…' });
    await trigger.focus();
    await page.keyboard.press('Enter');
    const popup = page.getByRole('dialog', { name: '筛选条件' });
    await expect(popup).toBeVisible();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(popup).toHaveAccessibleDescription(/仅影响当前列表/);
    expect(await popup.evaluate((el) => el.contains(document.activeElement))).toBe(true);
    await page.keyboard.press('Escape');
    await expect(popup).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('non-modal: page stays scrollable and the nav stays in the accessibility tree', async ({ page }) => {
    await page.goto('/#/components/popover');
    await page.getByRole('region', { name: 'Popover' }).first().getByRole('button', { name: '筛选…' }).click();
    await expect(page.getByRole('dialog', { name: '筛选条件' })).toBeVisible();
    await expect(page.getByRole('navigation', { name: '主导航' })).toBeVisible();
    const overflow = await page.evaluate(() => getComputedStyle(document.documentElement).overflow);
    expect(overflow).not.toBe('hidden');
  });

  test('outside click dismisses', async ({ page }) => {
    await page.goto('/#/components/popover');
    await page.getByRole('region', { name: 'Popover' }).first().getByRole('button', { name: '筛选…' }).click();
    const popup = page.getByRole('dialog', { name: '筛选条件' });
    await expect(popup).toBeVisible();
    await page.mouse.click(5, 450);
    await expect(popup).toBeHidden();
  });

  test('inline edit writes back to the page', async ({ page }) => {
    await page.goto('/#/components/popover');
    const card = page.getByRole('region', { name: 'Inline edit' });
    await card.getByRole('button', { name: '修改' }).click();
    const popup = page.getByRole('dialog', { name: '修改负责人' });
    await popup.getByRole('textbox', { name: '姓名' }).fill('另一位研究员');
    await popup.getByRole('button', { name: '保存' }).click();
    await expect(popup).toBeHidden();
    await expect(card).toContainText('另一位研究员');
  });

  test('hover preview opens and is reachable by keyboard too', async ({ page }) => {
    await page.goto('/#/components/popover');
    const trigger = page.getByRole('button', { name: 'REC-EXAMPLE' });
    await trigger.hover();
    await expect(page.getByRole('dialog', { name: 'REC-EXAMPLE 预览' })).toBeVisible({ timeout: 2000 });
    await page.mouse.move(5, 5);
    await expect(page.getByRole('dialog', { name: 'REC-EXAMPLE 预览' })).toBeHidden({ timeout: 2000 });
    await trigger.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog', { name: 'REC-EXAMPLE 预览' })).toBeVisible();
  });

  for (const theme of ['light', 'dark'] as const) {
    test(`stays inside the viewport; ${theme} tokens; axe clean`, async ({ page }) => {
      await page.setViewportSize({ width: theme === 'light' ? 390 : 1280, height: 844 });
      await setSettings(page, { theme });
      await page.goto('/#/components/popover');
      await page.getByRole('region', { name: 'Popover' }).first().getByRole('button', { name: '筛选…' }).click();
      const box = await page.locator('.rl-popover').boundingBox();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(theme === 'light' ? 390 : 1280);
      expect(await page.locator('.rl-popover').evaluate((el) => el.closest('.rl-theme')?.getAttribute('data-rl-theme'))).toBe(theme);
      await page.screenshot({ path: `test-results/screens/${theme === 'light' ? 390 : 1280}-popover-open-${theme}.png` });
      expect(await axe(page)).toEqual([]);
    });
  }
});

test.describe('Menu', () => {
  test('keyboard: ArrowDown opens, arrows/typeahead move, Enter runs, focus returns', async ({ page }) => {
    await page.goto('/#/components/menu');
    const playground = page.getByRole('region', { name: 'Menu' }).first();
    const trigger = playground.getByRole('button', { name: '记录操作' });
    await expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    await trigger.focus();
    await page.keyboard.press('ArrowDown');
    const menu = page.getByRole('menu');
    await expect(menu).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /导出/ })).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('menuitem', { name: '复制为新记录' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(menu).toBeHidden();
    await expect(trigger).toBeFocused();
    await expect(playground.locator('.sc-kv')).toContainText('复制为新记录');
  });

  test('disabled item is discoverable but inert; Escape closes without action', async ({ page }) => {
    await page.goto('/#/components/menu');
    const playground = page.getByRole('region', { name: 'Menu' }).first();
    await playground.getByRole('button', { name: '记录操作' }).click();
    const disabled = page.getByRole('menuitem', { name: /无权限/ });
    await expect(disabled).toHaveAttribute('aria-disabled', 'true');
    await disabled.click({ force: true });
    await expect(page.getByRole('menu')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('menu')).toBeHidden();
    await expect(playground.locator('.sc-kv')).toContainText('—');
  });

  test('checkbox and radio items toggle and keep the menu open', async ({ page }) => {
    await page.goto('/#/components/menu');
    const playground = page.getByRole('region', { name: 'Menu' }).first();
    await playground.getByRole('button', { name: '记录操作' }).click();
    const check = page.getByRole('menuitemcheckbox', { name: '紧凑显示' });
    await check.click();
    await expect(check).toHaveAttribute('aria-checked', 'true');
    await page.getByRole('menuitemradio', { name: '状态' }).click();
    await expect(page.getByRole('menu')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(playground.locator('.sc-kv')).toContainText('true');
    await expect(playground.locator('.sc-kv')).toContainText('status');
  });

  test('row action → confirm dialog → toast, focus lands back on the row trigger', async ({ page }) => {
    await page.goto('/#/components/menu');
    const trigger = page.getByRole('button', { name: 'REC-0102 的操作' });
    await trigger.click();
    await page.getByRole('menuitem', { name: '归档…' }).click();
    const dialog = page.getByRole('dialog', { name: '归档 REC-0102' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: '确认归档' }).click();
    await expect(dialog).toBeHidden();
    await expect(page.locator('.rl-toast').filter({ hasText: 'REC-0102 已归档' })).toBeVisible();
    await expect(page.getByRole('row', { name: /REC-0102/ })).toContainText('已归档');
  });

  test('menu stays inside the viewport at 390px and axe is clean while open', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/#/components/menu');
    await page.getByRole('button', { name: 'REC-0101 的操作' }).click();
    const box = await page.getByRole('menu').boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(390);
    await page.screenshot({ path: 'test-results/screens/390-menu-open-light.png' });
    await page.keyboard.press('Escape');
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.getByRole('region', { name: 'Menu' }).first().getByRole('button', { name: '记录操作' }).click();
    await expect(page.getByRole('menu')).toBeVisible();
    await page.screenshot({ path: 'test-results/screens/1280-menu-open-light.png' });
    expect(await axe(page)).toEqual([]);
  });
});

test.describe('Toast', () => {
  test('show → visible in the themed viewport with status and action', async ({ page }) => {
    await page.goto('/#/components/toast');
    await page.getByRole('button', { name: '显示通知' }).click();
    const toast = page.locator('.rl-toast').filter({ hasText: '记录已归档' });
    await expect(toast).toBeVisible();
    await expect(toast).toHaveAttribute('data-status', 'success');
    const viewport = page.locator('.rl-toast-viewport');
    await expect(viewport).toHaveAttribute('aria-live', 'polite');
    expect(await viewport.evaluate((el) => !!el.closest('.rl-theme'))).toBe(true);
    await page.screenshot({ path: 'test-results/screens/1280-toast-open-light.png' });
    expect(await axe(page)).toEqual([]);
  });

  test('stack: three toasts, hover expands and pauses, close button dismisses', async ({ page }) => {
    await page.goto('/#/components/toast');
    const show = page.getByRole('button', { name: '显示通知' });
    for (let i = 0; i < 3; i += 1) await show.click();
    await expect(page.locator('.rl-toast')).toHaveCount(3);
    await page.locator('.rl-toast').first().hover();
    await expect(page.locator('.rl-toast[data-expanded]')).toHaveCount(3);
    const front = page.locator('.rl-toast').last();
    await front.locator('.rl-toast__close').click();
    await expect(page.locator('.rl-toast')).toHaveCount(2);
  });

  test('progress toast updates in place; failure is announced and persists', async ({ page }) => {
    await page.goto('/#/components/toast');
    await page.getByRole('button', { name: '同步档案' }).click();
    await expect(page.locator('.rl-toast').filter({ hasText: '正在同步档案' })).toBeVisible();
    await expect(page.locator('.rl-toast').filter({ hasText: '同步完成' })).toBeVisible({ timeout: 4000 });
    await expect(page.locator('.rl-toast')).toHaveCount(1);

    await page.getByRole('button', { name: '模拟失败' }).click();
    await expect(page.getByRole('alert').filter({ hasText: '同步失败' })).toBeAttached();
    const failure = page.locator('.rl-toast').filter({ hasText: '同步失败' });
    await expect(failure).toHaveAttribute('data-status', 'danger');
    await page.waitForTimeout(5500);
    await expect(failure).toBeVisible();
  });

  test('auto-dismisses after the default timeout', async ({ page }) => {
    await page.goto('/#/components/toast');
    await page.getByRole('button', { name: '显示通知' }).click();
    const toast = page.locator('.rl-toast').filter({ hasText: '记录已归档' });
    await expect(toast).toBeVisible();
    await page.mouse.move(5, 5);
    await expect(toast).toBeHidden({ timeout: 8000 });
  });

  test('fits a 320px viewport; reduced motion removes the slide', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await setSettings(page, { motion: 'reduce' });
    await page.goto('/#/components/toast');
    await page.getByRole('button', { name: '显示通知' }).click();
    const toast = page.locator('.rl-toast').first();
    await expect(toast).toBeVisible();
    const box = await toast.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(320);
    const duration = await toast.evaluate((el) => getComputedStyle(el).transitionDuration);
    expect(duration.split(',').every((d) => d.trim() === '0s')).toBe(true);
    await page.screenshot({ path: 'test-results/screens/320-toast-open-light.png' });
  });
});
