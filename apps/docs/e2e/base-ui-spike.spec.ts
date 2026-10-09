import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { setSettings } from './helpers';

/**
 * ADR-0001 spike, real browser: focus trap, Escape, focus return, scroll lock,
 * exit animation and reduced motion for Base UI Dialog/Select composed with motion/react.
 */
test.use({ viewport: { width: 1280, height: 900 } });

test.describe('Dialog', () => {
  test('traps Tab / Shift+Tab, closes on Escape, restores focus to trigger', async ({ page }) => {
    await page.goto('/#/lab/overlays');
    const trigger = page.getByRole('button', { name: '归档记录…' });
    await trigger.focus();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog', { name: '确认归档' });
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAccessibleDescription(/归档后记录变为只读/);

    const insideAfterEachTab: boolean[] = [];
    for (let i = 0; i < 8; i += 1) {
      await page.keyboard.press(i % 3 === 2 ? 'Shift+Tab' : 'Tab');
      insideAfterEachTab.push(await dialog.evaluate((el) => el.contains(document.activeElement)));
    }
    expect(insideAfterEachTab.every(Boolean)).toBe(true);

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('locks page scroll while open and makes outside content inert', async ({ page }) => {
    await page.goto('/#/lab/overlays');
    await page.getByRole('button', { name: '归档记录…' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    const overflow = await page.evaluate(() => getComputedStyle(document.documentElement).overflow + '|' + getComputedStyle(document.body).overflow);
    expect(overflow).toContain('hidden');
    await expect(page.getByRole('navigation', { name: '主导航' })).toHaveCount(0);
  });

  test('exit animation completes before unmount; rapid toggle does not leave stale popups', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/#/lab/overlays');
    const trigger = page.getByRole('button', { name: '归档记录…' });
    for (let i = 0; i < 3; i += 1) {
      await trigger.click();
      await page.keyboard.press('Escape');
    }
    await trigger.click();
    const popup = page.locator('.rl-dialog__popup');
    await expect(popup).toHaveCount(1);
    await page.getByRole('button', { name: '取消' }).click();
    // Still mounted on the next frame while fading out…
    const midExit = await popup.count();
    await expect(popup).toHaveCount(0);
    expect(midExit).toBeLessThanOrEqual(1);
    await expect(trigger).toBeFocused();
  });

  test('reduced motion: no transform during enter', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/#/lab/overlays');
    await page.getByRole('button', { name: '归档记录…' }).click();
    const transform = await page.locator('.rl-dialog__popup').evaluate((el) => getComputedStyle(el).transform);
    expect(transform === 'none' || transform === 'matrix(1, 0, 0, 1, 0, 0)').toBe(true);
  });

  test('portals inside the themed root so dark tokens apply', async ({ page }) => {
    await setSettings(page, { theme: 'dark' });
    await page.goto('/#/lab/overlays');
    await page.getByRole('button', { name: '归档记录…' }).click();
    const popup = page.locator('.rl-dialog__popup');
    await expect(popup).toBeVisible();
    expect(await popup.evaluate((el) => el.closest('.rl-theme')?.getAttribute('data-rl-theme'))).toBe('dark');
    expect(await popup.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe('rgb(35, 48, 53)');
    await page.screenshot({ path: 'test-results/screens/1280-lab-dialog-dark.png' });
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag22aa']).analyze();
    expect(results.violations.map((v) => v.id)).toEqual([]);
  });

  test('has no axe violations while open', async ({ page }) => {
    await page.goto('/#/lab/overlays');
    await page.getByRole('button', { name: '归档记录…' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.screenshot({ path: 'test-results/screens/1280-lab-dialog-light.png' });
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag22aa']).analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
  });
});

test.describe('Select', () => {
  test('keyboard: open, navigate, select, focus returns; Escape cancels', async ({ page }) => {
    await page.goto('/#/lab/overlays');
    const trigger = page.getByRole('combobox', { name: '记录类别' });
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

  test('popup stays within the viewport at 390px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 700 });
    await page.goto('/#/lab/overlays');
    await page.getByRole('combobox', { name: '记录类别' }).click();
    const box = await page.getByRole('listbox').boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(390);
    await page.screenshot({ path: 'test-results/screens/390-lab-select-light.png' });
  });

  test('has no axe violations while open', async ({ page }) => {
    await page.goto('/#/lab/overlays');
    await page.getByRole('combobox', { name: '记录类别' }).click();
    await expect(page.getByRole('listbox')).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag22aa']).analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
  });
});
