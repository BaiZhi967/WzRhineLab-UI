import { expect, test } from '@playwright/test';
import { setSettings } from './helpers';

test.describe('keyboard', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('skip link is the first tab stop and moves focus to the page heading', async ({ page }) => {
    await page.goto('/#/components/button');
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: '跳到主要内容' });
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { level: 1, name: 'Button' })).toBeFocused();
  });

  test('sidebar links navigate and focus lands on the new heading', async ({ page }) => {
    await page.goto('/#/');
    const link = page.getByRole('link', { name: /^Foundations/ }).first();
    await link.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#\/foundations$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Design Tokens' })).toBeFocused();
    await expect(page.getByRole('link', { name: /^Foundations/ }).first()).toHaveAttribute('aria-current', 'page');
  });

  test('focus-visible ring uses the focus token', async ({ page }) => {
    await page.goto('/#/foundations');
    const button = page.getByRole('button', { name: 'Tab 到这里' });
    await button.focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    await expect(button).toBeFocused();
    const outline = await button.evaluate((el) => {
      const s = getComputedStyle(el);
      const token = getComputedStyle(el.closest('.rl-theme')!).getPropertyValue('--rl-focus').trim();
      return { style: s.outlineStyle, width: s.outlineWidth, color: s.outlineColor, token };
    });
    expect(outline.style).toBe('solid');
    expect(outline.width).toBe('2px');
    expect(outline.color).toBe('rgb(31, 90, 168)');
    expect(outline.token).toBe('#1f5aa8');
  });

  test('theme switcher is a keyboard-operable radio group', async ({ page }) => {
    await page.goto('/#/');
    const light = page.getByRole('radio', { name: 'Light' });
    await light.focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('radio', { name: 'Dark' })).toBeChecked();
    await expect(page.locator('.sc-app')).toHaveAttribute('data-rl-theme', 'dark');
    const bg = await page.locator('.sc-app').evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bg).toBe('rgb(17, 24, 27)');
  });
});

test.describe('button behaviour in a real browser', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('loading keeps focus and blocks repeat activation', async ({ page }) => {
    await page.goto('/#/components/button');
    const button = page.getByRole('button', { name: '归档样本' });
    await button.focus();
    await page.keyboard.press('Enter');
    await expect(button).toHaveAttribute('aria-busy', 'true');
    await expect(button).toBeFocused();
    await page.keyboard.press('Enter');
    await page.keyboard.press(' ');
    await expect(page.getByRole('status').filter({ hasText: '正在归档' })).toBeVisible();
    await expect(page.getByRole('status').filter({ hasText: '已完成 1 次归档' })).toBeVisible({ timeout: 4000 });
    await expect(button).toBeFocused();
  });

  test('loading does not change button width', async ({ page }) => {
    await page.goto('/#/components/button');
    const button = page.getByRole('button', { name: '归档样本' });
    const before = await button.boundingBox();
    await button.click();
    await expect(button).toHaveAttribute('aria-busy', 'true');
    const during = await button.boundingBox();
    expect(during!.width).toBeCloseTo(before!.width, 0);
    expect(during!.height).toBeCloseTo(before!.height, 0);
  });

  test('disabled buttons are skipped by Tab', async ({ page }) => {
    await page.goto('/#/components/button');
    const disabled = page.locator('.sc-matrix button:disabled');
    await expect(disabled).toHaveCount(4);
    for (const el of await disabled.all()) {
      await expect(el).toBeDisabled();
    }
  });

  test('playground controls drive the preview', async ({ page }) => {
    await page.goto('/#/components/button');
    const playground = page.getByRole('region', { name: 'Button' }).first();
    await playground.getByRole('radio', { name: 'Accent' }).check();
    await playground.getByRole('checkbox', { name: 'disabled' }).check();
    const preview = playground.locator('.sc-playground__canvas .rl-button');
    await expect(preview).toHaveAttribute('data-variant', 'accent');
    await expect(preview).toBeDisabled();
    await expect(playground.locator('pre')).toContainText('variant="accent" disabled');
  });
});

test.describe('mobile drawer', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('opens, traps background with inert, closes on Escape and restores focus', async ({ page }) => {
    await page.goto('/#/');
    const open = page.getByRole('button', { name: '打开导航' });
    await open.click();
    await expect(open).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('.sc-frame')).toHaveAttribute('inert', '');
    await expect(page.locator('#sidebar a').first()).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('navigation', { name: '主导航' })).toBeHidden();
    await expect(open).toBeFocused();
  });

  test('navigating from the drawer closes it', async ({ page }) => {
    await page.goto('/#/');
    await page.getByRole('button', { name: '打开导航' }).click();
    await page.getByRole('link', { name: /^Motion/ }).click();
    await expect(page).toHaveURL(/#\/motion$/);
    await expect(page.getByRole('navigation', { name: '主导航' })).toBeHidden();
  });
});

test.describe('reduced motion', () => {
  test('OS preference disables press scale and spinner rotation', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/#/components/button');
    const duration = await page
      .locator('.rl-button')
      .first()
      .evaluate((el) => getComputedStyle(el).transitionDuration);
    expect(duration.split(',').every((d) => d.trim() === '0s')).toBe(true);
    const button = page.getByRole('button', { name: '归档样本' });
    await button.click();
    await expect(button.locator('.rl-spinner')).toHaveAttribute('data-reduced', 'true');
  });

  test('showcase "减少" setting forces reduced motion regardless of OS', async ({ page }) => {
    await setSettings(page, { motion: 'reduce' });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/#/components/button');
    await expect(page.locator('.sc-app')).toHaveAttribute('data-rl-motion', 'reduce');
    const button = page.getByRole('button', { name: '归档样本' });
    await button.click();
    await expect(button.locator('.rl-spinner')).toHaveAttribute('data-reduced', 'true');
  });

  test('interrupted indicator retargets without queueing', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/#/motion');
    const pane = page.locator('.sc-compare__pane').first();
    await pane.getByRole('button', { name: 'Notes' }).click();
    await pane.getByRole('button', { name: 'Records' }).click();
    await page.waitForTimeout(500);
    const indicator = pane.locator('.sc-interrupt__indicator');
    const track = pane.locator('.sc-interrupt__track');
    const [ib, tb] = [await indicator.boundingBox(), await track.boundingBox()];
    expect(Math.round(((ib!.x - tb!.x) / tb!.width) * 4)).toBe(1);
  });
});
