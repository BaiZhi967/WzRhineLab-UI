import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { setSettings } from './helpers';

/**
 * Real-browser guarantees for the M2 components (Dialog, Select, Tabs, Tooltip).
 * Supersedes the ADR-0001 Lab spike spec: the same assertions now run against the public components.
 */
test.use({ viewport: { width: 1280, height: 900 } });

const axe = async (page: import('@playwright/test').Page) => {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  return results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
};

test.describe('Dialog', () => {
  test('traps Tab / Shift+Tab, closes on Escape, restores focus to trigger', async ({ page }) => {
    await page.goto('/#/components/dialog');
    const trigger = page.getByRole('button', { name: '归档记录…' });
    await trigger.focus();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog', { name: '确认归档' });
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAccessibleDescription(/归档后记录变为只读/);

    const inside: boolean[] = [];
    for (let i = 0; i < 8; i += 1) {
      await page.keyboard.press(i % 3 === 2 ? 'Shift+Tab' : 'Tab');
      inside.push(await dialog.evaluate((el) => el.contains(document.activeElement)));
    }
    expect(inside.every(Boolean)).toBe(true);

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('locks page scroll and makes the app inert while open', async ({ page }) => {
    await page.goto('/#/components/dialog');
    await page.getByRole('button', { name: '归档记录…' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    const overflow = await page.evaluate(
      () => `${getComputedStyle(document.documentElement).overflow}|${getComputedStyle(document.body).overflow}`,
    );
    expect(overflow).toContain('hidden');
    await expect(page.getByRole('navigation', { name: '主导航' })).toHaveCount(0);
  });

  test('rapid toggling leaves a single popup and exit completes before unmount', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/#/components/dialog');
    const trigger = page.getByRole('button', { name: '归档记录…' });
    for (let i = 0; i < 3; i += 1) {
      await trigger.click();
      await page.keyboard.press('Escape');
    }
    await trigger.click();
    const popup = page.locator('.rl-dialog');
    await expect(popup).toHaveCount(1);
    await page.getByRole('button', { name: '取消' }).click();
    await expect(popup).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });

  test('reduced motion: no transform while entering', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/#/components/dialog');
    await page.getByRole('button', { name: '归档记录…' }).click();
    const transform = await page.locator('.rl-dialog').evaluate((el) => getComputedStyle(el).transform);
    expect(['none', 'matrix(1, 0, 0, 1, 0, 0)']).toContain(transform);
  });

  test('form dialog: initial focus on the field, cannot close while saving, result announced', async ({ page }) => {
    await page.goto('/#/components/dialog');
    await page.getByRole('button', { name: '归档并备注…' }).click();
    const dialog = page.getByRole('dialog', { name: '归档样本记录' });
    const note = dialog.getByRole('textbox', { name: /归档备注/ });
    await expect(note).toBeFocused();
    await note.fill('复核完成');
    const save = dialog.getByRole('button', { name: '保存并归档' });
    await save.click();
    await expect(save).toHaveAttribute('aria-busy', 'true');
    await page.keyboard.press('Escape');
    await expect(dialog).toBeVisible();
    await expect(dialog).toBeHidden({ timeout: 4000 });
    await expect(page.getByRole('status').filter({ hasText: '复核完成' })).toBeVisible();
  });

  for (const theme of ['light', 'dark'] as const) {
    test(`portals inside the themed root; ${theme} tokens apply; no axe violations`, async ({ page }) => {
      await setSettings(page, { theme });
      await page.goto('/#/components/dialog');
      await page.getByRole('button', { name: '归档记录…' }).click();
      const popup = page.locator('.rl-dialog');
      await expect(popup).toBeVisible();
      expect(await popup.evaluate((el) => el.closest('.rl-theme')?.getAttribute('data-rl-theme'))).toBe(theme);
      if (theme === 'dark') {
        expect(await popup.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe('rgb(35, 48, 53)');
      }
      await page.screenshot({ path: `test-results/screens/1280-dialog-open-${theme}.png` });
      expect(await axe(page)).toEqual([]);
    });
  }

  test('preview scope: a dialog opened in a dark playground renders dark', async ({ page }) => {
    await page.goto('/#/components/dialog');
    const playground = page.getByRole('region', { name: 'Dialog' }).first();
    await playground.getByRole('radio', { name: 'Dark' }).check();
    await playground.getByRole('button', { name: '归档记录…' }).click();
    const popup = page.locator('.rl-dialog');
    await expect(popup).toBeVisible();
    expect(await popup.evaluate((el) => el.closest('.rl-theme')?.getAttribute('data-rl-theme'))).toBe('dark');
  });

  test('fits a 390px viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/#/components/dialog');
    await page.getByRole('button', { name: '归档记录…' }).click();
    const box = await page.locator('.rl-dialog').boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(390);
    await page.screenshot({ path: 'test-results/screens/390-dialog-open-light.png' });
  });
});

test.describe('Select', () => {
  test('keyboard: open, navigate, select, focus returns; Escape cancels', async ({ page }) => {
    await page.goto('/#/components/select');
    const trigger = page.getByRole('combobox', { name: '记录类别' }).first();
    await trigger.focus();
    await page.keyboard.press('ArrowDown');
    const listbox = page.getByRole('listbox');
    await expect(listbox).toBeVisible();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(listbox).toBeHidden();
    await expect(trigger).toBeFocused();
    const chosen = (await trigger.textContent())?.trim();
    expect(chosen).not.toBe('选择类别');

    await page.keyboard.press('ArrowDown');
    await expect(listbox).toBeVisible();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Escape');
    await expect(listbox).toBeHidden();
    await expect(trigger).toHaveText(chosen!);
  });

  test('labelled and described by Field', async ({ page }) => {
    await page.goto('/#/components/select');
    await expect(page.getByRole('combobox', { name: '记录类别' }).first()).toHaveAccessibleDescription(/用于档案检索的筛选/);
  });

  test('grouped options submit with the form', async ({ page }) => {
    await page.goto('/#/components/select');
    const form = page.getByRole('form', { name: '档案筛选' });
    await form.getByRole('combobox', { name: '学科' }).click();
    await page.getByRole('option', { name: '影像' }).click();
    await form.getByRole('button', { name: '应用筛选' }).click();
    await expect(form.getByRole('status')).toContainText('discipline=imagery');
    await expect(form.getByRole('status')).toContainText('status=review');
  });

  test('popup stays within the viewport at 390px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 700 });
    await page.goto('/#/components/select');
    await page.getByRole('combobox', { name: '记录类别' }).first().click();
    const box = await page.getByRole('listbox').boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(390);
    await page.screenshot({ path: 'test-results/screens/390-select-open-light.png' });
  });

  test('no axe violations while open', async ({ page }) => {
    await page.goto('/#/components/select');
    await page.getByRole('combobox', { name: '记录类别' }).first().click();
    await expect(page.getByRole('listbox')).toBeVisible();
    await page.screenshot({ path: 'test-results/screens/1280-select-open-light.png' });
    expect(await axe(page)).toEqual([]);
  });
});

test.describe('Tabs', () => {
  test('keyboard roving focus and manual activation', async ({ page }) => {
    await page.goto('/#/components/tabs');
    const line = page.getByRole('region', { name: 'Line' });
    const overview = line.getByRole('tab', { name: '概览' });
    await overview.focus();
    await page.keyboard.press('ArrowRight');
    const metadata = line.getByRole('tab', { name: /元数据/ });
    await expect(metadata).toBeFocused();
    await expect(overview).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('Enter');
    await expect(metadata).toHaveAttribute('aria-selected', 'true');
    await expect(line.getByRole('tabpanel')).toContainText('元数据视图');
    await page.keyboard.press('End');
    await expect(line.getByRole('tab', { name: '历史' })).toBeFocused();
  });

  test('indicator follows the active tab and retargets when interrupted', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/#/components/tabs');
    const line = page.getByRole('region', { name: 'Line' });
    await line.getByRole('tab', { name: '历史' }).click();
    await line.getByRole('tab', { name: /元数据/ }).click();
    await page.waitForTimeout(400);
    const [ib, tb] = await Promise.all([
      line.locator('.rl-tabs__indicator').boundingBox(),
      line.getByRole('tab', { name: /元数据/ }).boundingBox(),
    ]);
    expect(Math.abs(ib!.x - tb!.x)).toBeLessThan(2);
    expect(Math.abs(ib!.width - tb!.width)).toBeLessThan(2);
  });

  test('reduced motion: indicator has no transition', async ({ page }) => {
    await setSettings(page, { motion: 'reduce' });
    await page.goto('/#/components/tabs');
    const duration = await page
      .locator('.rl-tabs__indicator')
      .first()
      .evaluate((el) => getComputedStyle(el).transitionDuration);
    expect(duration.split(',').every((d) => d.trim() === '0s')).toBe(true);
  });

  test('overflowing tab list scrolls inside itself, not the page', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/#/components/tabs');
    const list = page.getByRole('tablist', { name: '实验阶段' });
    const { scrollWidth, clientWidth } = await list.evaluate((el) => ({ scrollWidth: el.scrollWidth, clientWidth: el.clientWidth }));
    expect(scrollWidth).toBeGreaterThan(clientWidth);
    await expect(list).toHaveAttribute('data-overflowing', 'true');
    await expect(list).not.toHaveAttribute('data-scrolled-end');
    await list.getByRole('tab').last().focus();
    await expect(list.getByRole('tab').last()).toBeInViewport();
    await expect(list).toHaveAttribute('data-scrolled-end', 'true');
  });
});

test.describe('Tooltip', () => {
  test('appears on keyboard focus, mirrors the name, and Escape hides it', async ({ page }) => {
    await page.goto('/#/components/tooltip');
    const toolbar = page.getByRole('toolbar', { name: '档案操作' });
    const button = toolbar.getByRole('button', { name: '导出档案' });
    await button.focus();
    const tip = page.locator('.rl-tooltip');
    await expect(tip).toBeVisible();
    await expect(tip).toHaveText('导出档案');
    await page.screenshot({ path: 'test-results/screens/1280-tooltip-open-light.png' });
    await page.keyboard.press('Escape');
    await expect(tip).toBeHidden();
    await expect(button).toBeFocused();
  });

  test('hover opens after the delay; moving to a neighbour switches', async ({ page }) => {
    await page.goto('/#/components/tooltip');
    const toolbar = page.getByRole('toolbar', { name: '档案操作' });
    await toolbar.getByRole('button', { name: '刷新列表' }).hover();
    await expect(page.locator('.rl-tooltip')).toHaveText('刷新列表', { timeout: 2000 });
    await toolbar.getByRole('button', { name: '导出档案' }).hover();
    await expect(page.locator('.rl-tooltip')).toHaveText('导出档案');
  });

  test('no axe violations with a tooltip open', async ({ page }) => {
    await page.goto('/#/components/tooltip');
    await page.getByRole('toolbar', { name: '档案操作' }).getByRole('button', { name: '刷新列表' }).focus();
    await expect(page.locator('.rl-tooltip')).toBeVisible();
    expect(await axe(page)).toEqual([]);
  });
});
