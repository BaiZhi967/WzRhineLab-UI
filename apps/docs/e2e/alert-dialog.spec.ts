import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { setSettings } from './helpers';

/** ADR-0006 §2 / §3: AlertDialog and the Dialog close guard in real browsers. */
test.use({ viewport: { width: 1280, height: 900 } });

const route = '/#/components/alert-dialog';

const axe = async (page: Page) => {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  return results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
};

const isFocused = (locator: Locator) => locator.evaluate((el) => el === document.activeElement);

/** Base UI focus guards hand focus back a frame or two late; judge where focus settles. */
const containsFocusAfterFrames = (locator: Locator) =>
  locator.evaluate(
    (el) =>
      new Promise<boolean>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve(el.contains(document.activeElement)))),
      ),
  );

const asyncRegion = (page: Page) => page.getByRole('region', { name: 'Async confirm' });

test.describe('AlertDialog', () => {
  test('alertdialog semantics, initial focus on cancel, Tab loop, Escape cancels and returns focus', async ({ page }) => {
    await page.goto(route);
    const trigger = page.getByRole('button', { name: '删除记录…' });
    await trigger.focus();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('alertdialog', { name: '删除 REC-0101？' });
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAccessibleDescription(/删除后无法恢复/);
    const cancel = dialog.getByRole('button', { name: '取消' });
    await expect.poll(() => isFocused(cancel)).toBe(true);

    const inside: boolean[] = [];
    for (let i = 0; i < 8; i += 1) {
      await page.keyboard.press(i % 3 === 2 ? 'Shift+Tab' : 'Tab');
      inside.push(await containsFocusAfterFrames(dialog));
    }
    expect(inside.every(Boolean)).toBe(true);

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    await expect(page.getByRole('status').filter({ hasText: '尚未确认' })).toBeVisible();
  });

  test('outside click does not close; confirm runs and closes', async ({ page }) => {
    await page.goto(route);
    await page.getByRole('button', { name: '删除记录…' }).click();
    const dialog = page.getByRole('alertdialog', { name: '删除 REC-0101？' });
    await expect(dialog).toBeVisible();
    await page.mouse.click(10, 10);
    await page.waitForTimeout(400);
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: '删除记录' }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByRole('status').filter({ hasText: '已确认删除 1 次' })).toBeVisible();
  });

  test('danger confirm uses the danger fill', async ({ page }) => {
    await page.goto(route);
    await page.getByRole('button', { name: '删除记录…' }).click();
    const confirm = page.getByRole('alertdialog').getByRole('button', { name: '删除记录' });
    await expect(confirm).toBeVisible();
    const colours = await confirm.evaluate((el) => {
      const probe = document.createElement('span');
      probe.style.color = 'var(--rl-danger)';
      el.appendChild(probe);
      const danger = getComputedStyle(probe).color;
      probe.remove();
      return { bg: getComputedStyle(el).backgroundColor, danger };
    });
    expect(colours.bg).toBe(colours.danger);
  });

  test('async confirm: busy confirm keeps focus, Escape and cancel ignored, closes on resolve', async ({ page }) => {
    // Instant exit, so a wrongly accepted Escape would remove the panel within the wait below.
    await setSettings(page, { motion: 'reduce' });
    await page.goto(route);
    const trigger = asyncRegion(page).getByRole('button', { name: '清空回收站…' });
    await trigger.click();
    const dialog = page.getByRole('alertdialog', { name: '清空回收站？' });
    await expect(dialog).toBeVisible();
    const confirm = dialog.getByRole('button', { name: '清空' });
    // Wait for Base UI's (one frame late) initial focus, then confirm from the keyboard.
    await expect.poll(() => isFocused(dialog.getByRole('button', { name: '取消' }))).toBe(true);
    await page.keyboard.press('Tab');
    await expect(confirm).toBeFocused();
    // Record what the page says at the moment the panel unmounts: it must only go away once the
    // (sample, 1.2s) request has resolved, not because of the Escape below. Timing-independent.
    await page.evaluate(() => {
      const w = window as unknown as { __rlClosedWith?: string };
      const observer = new MutationObserver(() => {
        if (document.querySelector('.rl-alert-dialog')) return;
        observer.disconnect();
        w.__rlClosedWith = document.querySelector('[aria-labelledby="alert-dialog-async-title"] [role="status"]')?.textContent ?? '';
      });
      observer.observe(document.body, { childList: true, subtree: true });
    });
    await page.keyboard.press('Enter');
    await expect(confirm).toHaveAttribute('aria-busy', 'true');
    await expect(confirm).toBeFocused();
    await expect(dialog.getByRole('button', { name: '取消' })).toBeDisabled();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden({ timeout: 4000 });
    expect(await page.evaluate(() => (window as unknown as { __rlClosedWith?: string }).__rlClosedWith)).toContain('已清空回收站');
    await expect(page.getByRole('status').filter({ hasText: '已清空回收站' })).toBeVisible();
    await expect(trigger).toBeFocused();
  });

  test('async confirm rejects: stays open with role=alert error and focus on confirm', async ({ page }) => {
    await page.goto(route);
    const region = asyncRegion(page);
    await region.getByRole('checkbox', { name: '模拟请求失败' }).check();
    await region.getByRole('button', { name: '清空回收站…' }).click();
    const dialog = page.getByRole('alertdialog', { name: '清空回收站？' });
    const confirm = dialog.getByRole('button', { name: '清空' });
    await confirm.click();
    await expect(confirm).toHaveAttribute('aria-busy', 'true');
    const alert = dialog.getByRole('alert');
    await expect(alert).toHaveText(/清空未完成/, { timeout: 4000 });
    await expect(dialog).toBeVisible();
    await expect(confirm).not.toHaveAttribute('aria-busy');
    await expect.poll(() => isFocused(confirm)).toBe(true);
    await expect(dialog.getByRole('button', { name: '取消' })).toBeEnabled();
    expect(await axe(page)).toEqual([]);
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });

  test('opened from a menu item: focus returns to the menu trigger', async ({ page }) => {
    await page.goto(route);
    const menuTrigger = page.getByRole('button', { name: 'REC-0102 的操作' });
    await menuTrigger.click();
    await page.getByRole('menuitem', { name: '归档…' }).click();
    const dialog = page.getByRole('alertdialog', { name: '归档 REC-0102？' });
    await expect(dialog).toBeVisible();
    await expect.poll(() => isFocused(dialog.getByRole('button', { name: '取消' }))).toBe(true);
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(menuTrigger).toBeFocused();

    await menuTrigger.click();
    await page.getByRole('menuitem', { name: '归档…' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: '归档' }).click();
    await expect(page.getByRole('alertdialog')).toHaveCount(0);
    await expect(menuTrigger).toBeFocused();
    await expect(page.getByRole('region', { name: 'Opened from a menu' }).getByText('已归档')).toBeVisible();
  });

  test('rapid open / close leaves exactly one popup, then none', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto(route);
    const trigger = page.getByRole('button', { name: '删除记录…' });
    for (let i = 0; i < 3; i += 1) {
      await trigger.click();
      await page.keyboard.press('Escape');
    }
    await trigger.click();
    const popup = page.locator('.rl-alert-dialog');
    await expect(popup).toHaveCount(1);
    await page.getByRole('alertdialog').getByRole('button', { name: '取消' }).click();
    await expect(popup).toHaveCount(0);
    await expect(page.locator('.rl-dialog__backdrop')).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });

  test('reduced motion setting: popup has no translate offset while entering', async ({ page }) => {
    await setSettings(page, { motion: 'reduce' });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto(route);
    // Sample the panel's transform from the moment it mounts: an instant transition would hide a
    // single late read of a wrongly applied 8px offset.
    await page.evaluate(() => {
      const samples: string[] = [];
      (window as unknown as { __rlSamples: string[] }).__rlSamples = samples;
      const observer = new MutationObserver(() => {
        const el = document.querySelector<HTMLElement>('.rl-alert-dialog');
        if (!el) return;
        observer.disconnect();
        samples.push(`${el.style.transform}|${getComputedStyle(el).transform}`);
        let frames = 0;
        const tick = () => {
          samples.push(`${el.style.transform}|${getComputedStyle(el).transform}`);
          if ((frames += 1) < 10) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
      observer.observe(document.body, { childList: true, subtree: true });
    });
    await page.getByRole('button', { name: '删除记录…' }).click();
    await expect(page.locator('.rl-alert-dialog')).toBeVisible();
    await expect.poll(() => page.evaluate(() => (window as unknown as { __rlSamples: string[] }).__rlSamples.length)).toBeGreaterThan(5);
    const samples = await page.evaluate(() => (window as unknown as { __rlSamples: string[] }).__rlSamples);
    for (const sample of samples) {
      const [inline, computed] = sample.split('|');
      expect(inline ?? '', sample).not.toMatch(/translateY\((?!0(px)?\))/);
      expect(['none', 'matrix(1, 0, 0, 1, 0, 0)'], sample).toContain(computed);
    }
  });

  for (const theme of ['light', 'dark'] as const) {
    test(`open state · ${theme}: themed portal, no axe violations`, async ({ page }) => {
      await setSettings(page, { theme });
      await page.goto(route);
      await page.getByRole('button', { name: '删除记录…' }).click();
      const popup = page.locator('.rl-alert-dialog');
      await expect(popup).toBeVisible();
      expect(await popup.evaluate((el) => el.closest('.rl-theme')?.getAttribute('data-rl-theme'))).toBe(theme);
      await page.screenshot({ path: `test-results/screens/1280-alert-dialog-open-${theme}.png` });
      expect(await axe(page)).toEqual([]);
    });
  }

  test('fits a 320px viewport', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto(route);
    await page.getByRole('button', { name: '删除记录…' }).click();
    const popup = page.locator('.rl-alert-dialog');
    await expect(popup).toBeVisible();
    const box = await popup.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(320);
    await page.screenshot({ path: 'test-results/screens/320-alert-dialog-open-light.png' });
  });
});

test.describe('Dialog close guard', () => {
  test('dirty field: Escape opens a nested alertdialog; 继续编辑 keeps text, 放弃 closes both', async ({ page }) => {
    await page.goto(route);
    const trigger = page.getByRole('button', { name: '编辑备注…' });
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: '编辑样本备注' });
    const field = dialog.getByRole('textbox', { name: /备注/ });
    await expect(field).toBeFocused();

    // Clean form: Escape closes straight away.
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();

    await trigger.click();
    await expect(field).toBeFocused();
    await field.fill('复核完成');
    await page.keyboard.press('Escape');
    const nested = page.getByRole('alertdialog', { name: '放弃未保存的更改？' });
    await expect(nested).toBeVisible();
    // The parent stays mounted but leaves the accessibility tree while the nested modal is on top.
    const parentPanel = page.locator('[data-slot="dialog"]');
    await expect(parentPanel).toBeVisible();
    await expect(dialog).toHaveCount(0);
    const keep = nested.getByRole('button', { name: '继续编辑' });
    await expect.poll(() => isFocused(keep)).toBe(true);
    await keep.click();
    await expect(nested).toBeHidden();
    await expect(dialog).toBeVisible();
    await expect(field).toHaveValue('复核完成');

    // The close button is guarded the same way.
    await dialog.getByRole('button', { name: '取消' }).click();
    await expect(nested).toBeVisible();
    await nested.getByRole('button', { name: '放弃' }).click();
    await expect(nested).toBeHidden();
    await expect(dialog).toBeHidden();
    await expect(page.getByRole('alertdialog')).toHaveCount(0);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByRole('status').filter({ hasText: '尚无备注' })).toBeVisible();
  });

  test('outside click on a dirty dialog is guarded too; save closes without asking', async ({ page }) => {
    await page.goto(route);
    await page.getByRole('button', { name: '编辑备注…' }).click();
    const dialog = page.getByRole('dialog', { name: '编辑样本备注' });
    const field = dialog.getByRole('textbox', { name: /备注/ });
    await field.fill('样本已入库');
    await page.mouse.click(10, 10);
    const nested = page.getByRole('alertdialog', { name: '放弃未保存的更改？' });
    await expect(nested).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(nested).toBeHidden();
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: '保存' }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByRole('alertdialog')).toHaveCount(0);
    await expect(page.getByRole('status').filter({ hasText: '已保存备注：样本已入库' })).toBeVisible();
  });

  // --rl-danger-hover used to be an undefined token, which made the hover background transparent.
  for (const theme of ['light', 'dark'] as const) {
    test(`danger confirm keeps its fill on hover · ${theme}`, async ({ page }) => {
      await setSettings(page, { theme, motion: 'reduce' });
      await page.goto(route);
      await page.getByRole('button', { name: '删除记录…' }).click();
      const confirm = page.getByRole('alertdialog', { name: '删除 REC-0101？' }).getByRole('button', { name: '删除' });
      await expect(confirm).toBeVisible();
      const before = await confirm.evaluate((el) => getComputedStyle(el).backgroundColor);
      await confirm.hover();
      await expect
        .poll(() => confirm.evaluate((el) => getComputedStyle(el).backgroundColor))
        .not.toBe(before);
      const hovered = await confirm.evaluate((el) => getComputedStyle(el).backgroundColor);
      expect(hovered.endsWith(', 0)')).toBe(false);
    });
  }
});
