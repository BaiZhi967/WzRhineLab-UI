import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { setSettings } from './helpers';

/** M9 Drawer (ADR-0006 §4) in real browsers: modality, focus, placement, close guard, motion. */
test.use({ viewport: { width: 1280, height: 900 } });

const axe = async (page: Page) => {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  return results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
};

/** Where focus settles after Base UI's focus guards hand it back (two frames). */
const settledInside = (dialog: Locator) =>
  dialog.evaluate(
    (el) =>
      new Promise<boolean>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve(el.contains(document.activeElement)))),
      ),
  );

/** Wait until enter transitions have finished (no running animations on the popup). */
const settled = (popup: Locator) =>
  expect.poll(() => popup.evaluate((el) => el.getAnimations().filter((a) => a.playState === 'running').length)).toBe(0);

const openDetail = async (page: Page) => {
  await page.goto('/#/components/drawer');
  const trigger = page.getByRole('button', { name: '查看详情' });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'ARC-1024' });
  await expect(dialog).toBeVisible();
  return { trigger, dialog };
};

test.describe('Drawer', () => {
  test('labelled dialog; focus enters, Tab loops, Escape closes and focus returns', async ({ page }) => {
    await page.goto('/#/components/drawer');
    const trigger = page.getByRole('button', { name: '查看详情' });
    await trigger.focus();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog', { name: 'ARC-1024' });
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAccessibleDescription(/记录详情/);
    await expect.poll(() => dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true);
    await expect(dialog.getByRole('button', { name: '关闭' })).toBeVisible();

    const inside: boolean[] = [];
    for (let i = 0; i < 8; i += 1) {
      await page.keyboard.press(i % 3 === 2 ? 'Shift+Tab' : 'Tab');
      inside.push(await settledInside(dialog));
    }
    expect(inside.every(Boolean)).toBe(true);

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('backdrop click closes; header close button closes', async ({ page }) => {
    const { trigger, dialog } = await openDetail(page);
    await settled(dialog);
    // Click the dimmed area away from the panel (left edge for an end-side drawer).
    await page.mouse.click(40, 450);
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    await trigger.click();
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: '关闭' }).click();
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('locks page scroll and makes the app inert while open', async ({ page }) => {
    await openDetail(page);
    const overflow = await page.evaluate(
      () => `${getComputedStyle(document.documentElement).overflow}|${getComputedStyle(document.body).overflow}`,
    );
    expect(overflow).toContain('hidden');
    await expect(page.getByRole('navigation', { name: '主导航' })).toHaveCount(0);
    const scrollBefore = await page.evaluate(() => window.scrollY);
    await page.mouse.wheel(0, 800);
    await page.waitForTimeout(100);
    expect(await page.evaluate(() => window.scrollY)).toBe(scrollBefore);
  });

  test('1280: side panel on the right edge, full height', async ({ page }) => {
    const { dialog } = await openDetail(page);
    await settled(dialog);
    const box = (await dialog.boundingBox())!;
    expect(Math.round(box.x + box.width)).toBe(1280);
    expect(Math.round(box.y)).toBe(0);
    expect(Math.round(box.height)).toBe(900);
    expect(box.width).toBeLessThan(1280);
    await expect(dialog).toHaveAttribute('data-swipe-direction', 'right');
    await page.screenshot({ path: 'test-results/screens/1280-drawer-open-light.png' });
  });

  test('start side: filter drawer attaches to the left edge', async ({ page }) => {
    await page.goto('/#/components/drawer');
    await page.getByRole('button', { name: '筛选…' }).click();
    const dialog = page.getByRole('dialog', { name: '筛选档案' });
    await expect(dialog).toBeVisible();
    await settled(dialog);
    const box = (await dialog.boundingBox())!;
    expect(Math.round(box.x)).toBe(0);
    await dialog.getByRole('textbox', { name: '关键词' }).fill('ARC');
    await dialog.getByRole('button', { name: '应用筛选' }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByRole('status').filter({ hasText: '已应用：ARC' })).toBeVisible();
  });

  test('390: bottom sheet, full width, bottom edge on the viewport, body scrolls independently', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/#/components/drawer');
    await page.getByRole('button', { name: '查看操作日志' }).click();
    const dialog = page.getByRole('dialog', { name: '操作日志' });
    await expect(dialog).toBeVisible();
    await settled(dialog);
    await expect(dialog).toHaveAttribute('data-swipe-direction', 'down');
    const box = (await dialog.boundingBox())!;
    expect(Math.round(box.x)).toBe(0);
    expect(Math.round(box.width)).toBe(390);
    expect(Math.round(box.y + box.height)).toBe(844);
    expect(box.height).toBeLessThanOrEqual(844 * 0.85 + 1);
    // Header and footer stay put while the body scrolls.
    const header = dialog.locator('.rl-drawer__header');
    const footer = dialog.locator('.rl-drawer__actions');
    const before = [(await header.boundingBox())!.y, (await footer.boundingBox())!.y];
    const body = dialog.getByRole('region', { name: '操作日志' });
    await body.evaluate((el) => el.scrollTo(0, el.scrollHeight));
    expect(await body.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
    expect([(await header.boundingBox())!.y, (await footer.boundingBox())!.y]).toEqual(before);
    await page.screenshot({ path: 'test-results/screens/390-drawer-open-light.png' });
  });

  test('close guard: refuses Escape, backdrop and close button while saving', async ({ page }) => {
    await page.goto('/#/components/drawer');
    await page.getByRole('button', { name: '编辑备注…' }).click();
    const dialog = page.getByRole('dialog', { name: '编辑记录备注' });
    const note = dialog.getByRole('textbox', { name: /备注/ });
    await expect(note).toBeFocused();
    await note.fill('复核完成');
    await settled(dialog);
    const save = dialog.getByRole('button', { name: '保存' });
    await save.click();
    await expect(save).toHaveAttribute('aria-busy', 'true');
    await page.keyboard.press('Escape');
    await page.mouse.click(40, 450);
    await dialog.getByRole('button', { name: '关闭' }).click();
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/已拒绝 3 次关闭请求/)).toBeVisible();
    await expect(dialog).toBeHidden({ timeout: 8000 });
    await expect(page.getByRole('status').filter({ hasText: '复核完成' })).toBeVisible();
  });

  test('rapid open / close leaves no stale popup; exit completes before unmount', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/#/components/drawer');
    const trigger = page.getByRole('button', { name: '查看详情' });
    for (let i = 0; i < 4; i += 1) {
      await trigger.click();
      await page.keyboard.press('Escape');
    }
    await expect(page.locator('.rl-drawer')).toHaveCount(0);
    await expect(page.locator('.rl-drawer__backdrop')).toHaveCount(0);
    await trigger.click();
    const popup = page.locator('.rl-drawer');
    await expect(popup).toHaveCount(1);
    await settled(popup);
    // Measured in-page so a fast engine finishing the exit between Playwright polls cannot hide
    // it: the panel must stay mounted for most of the panel transition (280ms) after Escape.
    const exitMs = popup.evaluate(
      (el) =>
        new Promise<number>((resolve) => {
          const start = performance.now();
          const observer = new MutationObserver(() => {
            if (!el.isConnected) {
              observer.disconnect();
              resolve(performance.now() - start);
            }
          });
          observer.observe(document.body, { childList: true, subtree: true });
        }),
    );
    await page.keyboard.press('Escape');
    expect(await exitMs).toBeGreaterThan(150);
    await expect(popup).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });

  test('reduced motion: no translate while entering, appears without delay', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/#/components/drawer');
    await page.getByRole('button', { name: '查看详情' }).click();
    const popup = page.locator('.rl-drawer');
    await expect(popup).toBeVisible();
    // Sample the first frames: the panel must never be translated off its resting position.
    const samples = await popup.evaluate(
      (el) =>
        new Promise<string[]>((resolve) => {
          const out: string[] = [];
          const tick = () => {
            out.push(`${getComputedStyle(el).transform}|${Math.round(el.getBoundingClientRect().right)}`);
            if (out.length < 4) requestAnimationFrame(tick);
            else resolve(out);
          };
          tick();
        }),
    );
    for (const sample of samples) {
      const [transform, right] = sample.split('|');
      expect(['none', 'matrix(1, 0, 0, 1, 0, 0)']).toContain(transform);
      expect(right).toBe('1280');
    }
    expect(await popup.evaluate((el) => el.getAnimations().length)).toBe(0);
  });

  for (const theme of ['light', 'dark'] as const) {
    test(`open state portals into the themed root; ${theme}: axe clean`, async ({ page }) => {
      await setSettings(page, { theme });
      const { dialog } = await openDetail(page);
      await settled(dialog);
      expect(await dialog.evaluate((el) => el.closest('.rl-theme')?.getAttribute('data-rl-theme'))).toBe(theme);
      if (theme === 'dark') {
        expect(await dialog.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe('rgb(35, 48, 53)');
      }
      expect(await axe(page)).toEqual([]);
    });
  }
});
