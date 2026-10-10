import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

/** Snapshot of host styling that the widget must never change. */
async function hostSnapshot(page: Page) {
  return page.evaluate(() => {
    const cs = (sel: string) => getComputedStyle(document.querySelector(sel)!);
    const root = getComputedStyle(document.documentElement);
    return {
      rootAccent: root.getPropertyValue('--rl-accent').trim(),
      rootCanvas: root.getPropertyValue('--rl-bg-canvas').trim(),
      rootFontSize: root.fontSize,
      bodyFont: cs('body').fontFamily,
      bodyBg: cs('body').backgroundColor,
      bodyLineHeight: cs('body').lineHeight,
      h1Transform: cs('h1').textTransform,
      h1Color: cs('h1').color,
      buttonBg: cs('#host-button').backgroundColor,
      buttonTransform: cs('#host-button').textTransform,
      buttonBorder: cs('#host-button').borderTopWidth,
      inputBorder: cs('#host-input').borderTopStyle,
      htmlClass: document.documentElement.className,
      bodyClass: document.body.className,
      htmlAttrs: [...document.documentElement.attributes].map((a) => a.name).sort(),
    };
  });
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

test('host styling is identical before mount, after mount and after unmount', async ({ page }) => {
  // Load the page with the widget unmounted first, to capture a clean host baseline.
  await page.goto('/');
  const widget = page.locator('#widget-a .rl-theme');
  await expect(widget).toBeVisible();
  await page.getByRole('button', { name: '卸载挂件' }).click();
  await expect(widget).toHaveCount(0);
  const before = await hostSnapshot(page);
  expect(before.rootAccent).toBe('#ff00ff');
  expect(before.buttonTransform).toBe('uppercase');

  await page.getByRole('button', { name: '挂载挂件' }).click();
  await expect(widget).toBeVisible();
  // Open popups too: their portals must also stay inside the widget.
  await page.locator('#widget-a').getByRole('button', { name: '提交调阅申请' }).click();
  await expect(page.getByRole('dialog', { name: '提交调阅申请' })).toBeVisible();
  expect(await hostSnapshot(page)).toEqual(before);
  await page.keyboard.press('Escape');

  await page.getByRole('button', { name: '卸载挂件' }).click();
  expect(await hostSnapshot(page)).toEqual(before);
});

test('host :root variables and global element rules do not leak into the widget', async ({ page }) => {
  await page.goto('/');
  const scope = page.locator('#widget-a .rl-theme');
  await expect(scope).toBeVisible();
  const styles = await scope.evaluate((el) => {
    const button = el.querySelector<HTMLElement>('.rl-button')!;
    const table = el.querySelector<HTMLElement>('.rl-table td')!;
    const title = el.querySelector<HTMLElement>('.rl-embed__title')!;
    const cs = (n: Element) => getComputedStyle(n);
    return {
      accent: cs(el).getPropertyValue('--rl-accent').trim(),
      canvas: cs(el).backgroundColor,
      fg: cs(el).color,
      font: cs(el).fontFamily,
      buttonTransform: cs(button).textTransform,
      buttonSpacing: cs(button).letterSpacing,
      buttonBg: cs(button).backgroundColor,
      buttonFont: cs(button).fontFamily,
      buttonBoxSizing: cs(button).boxSizing,
      buttonHeight: button.getBoundingClientRect().height,
      cellBorderTop: cs(table).borderTopWidth,
      titleTransform: cs(title).textTransform,
    };
  });
  expect(styles.accent).toBe('#e56a32');
  expect(styles.canvas).toBe('rgb(243, 242, 237)');
  expect(styles.fg).toBe('rgb(32, 37, 31)');
  expect(styles.font).toMatch(/^Inter/);
  expect(styles.buttonTransform).toBe('none');
  expect(styles.buttonSpacing).toBe('normal');
  expect(styles.buttonBg).toBe('rgb(32, 37, 31)');
  expect(styles.buttonFont).toMatch(/^Inter/);
  expect(styles.buttonBoxSizing).toBe('border-box');
  // sm control height (32px) regardless of the host's 20px root font and padded buttons.
  expect(styles.buttonHeight).toBe(32);
  expect(styles.cellBorderTop).toBe('0px');
  expect(styles.titleTransform).toBe('none');

  // M7 controls: the host's `svg { 48px }`, `input` and `* { content-box }` rules must not reach them.
  const sw = await scope.evaluate((el) => {
    const track = el.querySelector<HTMLElement>('.rl-switch')!.getBoundingClientRect();
    const thumb = el.querySelector<HTMLElement>('.rl-switch__thumb')!.getBoundingClientRect();
    return { track: [track.width, track.height], thumb: [thumb.width, thumb.height] };
  });
  expect(sw).toEqual({ track: [36, 20], thumb: [14, 14] });
});

test('worst case: host stylesheet loaded after the widget still cannot resize or restyle it', async ({ page }) => {
  await page.goto('/');
  const scope = page.locator('#widget-a .rl-theme');
  await expect(scope).toBeVisible();
  const measure = () =>
    scope.evaluate((el) => {
      const pick = (sel: string) => el.querySelector<HTMLElement>(sel)!;
      const box = (sel: string) => {
        const r = pick(sel).getBoundingClientRect();
        return `${Math.round(r.width)}x${Math.round(r.height)}`;
      };
      return {
        button: box('.rl-button'),
        badge: box('.rl-badge'),
        select: box('.rl-select'),
        tableRow: box('.rl-table tbody tr'),
        switch: box('.rl-switch'),
        switchThumb: box('.rl-switch__thumb'),
        buttonTransform: getComputedStyle(pick('.rl-button')).textTransform,
        cellBorder: getComputedStyle(pick('.rl-table td')).borderTopWidth,
      };
    });
  const normal = await measure();
  await page.evaluate(() => document.head.appendChild(document.querySelector('link[href="/host.css"]')!));
  expect(await measure()).toEqual(normal);
});

test('two instances keep separate themes, densities and portals', async ({ page }) => {
  await page.goto('/');
  const a = page.locator('#widget-a .rl-theme');
  const b = page.locator('#widget-b .rl-theme');
  await expect(a).toHaveAttribute('data-rl-theme', 'light');
  await expect(b).toHaveAttribute('data-rl-theme', 'dark');
  await expect(b).toHaveAttribute('data-rl-density', 'compact');

  await page.locator('#widget-b').getByRole('button', { name: '提交调阅申请' }).click();
  const dialog = page.getByRole('dialog', { name: '提交调阅申请' });
  await expect(dialog).toBeVisible();
  expect(await dialog.evaluate((el) => el.closest('#widget-b') !== null)).toBe(true);
  expect(await dialog.evaluate((el) => getComputedStyle(el).backgroundColor)).not.toBe('rgb(255, 255, 255)');
  await page.keyboard.press('Escape');

  await page.getByRole('button', { name: '切换挂件主题' }).click();
  await expect(a).toHaveAttribute('data-rl-theme', 'dark');
  await expect(b).toHaveAttribute('data-rl-theme', 'dark');
});

test('host callback and per-instance toast', async ({ page }) => {
  await page.goto('/');
  const a = page.locator('#widget-a');
  await a.getByRole('combobox', { name: '申请调阅' }).click();
  await page.getByRole('option', { name: /ARC-2002/ }).click();
  await a.getByRole('button', { name: '提交调阅申请' }).click();
  const dialog = page.getByRole('dialog', { name: '提交调阅申请' });
  await dialog.getByRole('textbox', { name: /事由/ }).fill('迁移复核');
  await dialog.getByRole('button', { name: '提交', exact: true }).click();
  await expect(dialog).toBeHidden();
  expect(await page.evaluate(() => window.__widgetEvents)).toEqual(['a:ARC-2002']);
  const toast = a.getByText('已提交 ARC-2002 的调阅申请');
  await expect(toast).toBeVisible();
  await expect(page.locator('#widget-b').getByText('已提交 ARC-2002 的调阅申请')).toHaveCount(0);
});

test('focus returns to the host page after closing a widget dialog', async ({ page }) => {
  await page.goto('/');
  const trigger = page.locator('#widget-a').getByRole('button', { name: '提交调阅申请' });
  await trigger.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
  // Tabbing continues through the host document normally.
  await page.locator('#host-input').focus();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: '挂载挂件' })).toBeFocused();
});

test('unmount removes every widget node, including portals and toasts', async ({ page }) => {
  await page.goto('/');
  await page.locator('#widget-a').getByRole('button', { name: '提交调阅申请' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('dialog').getByRole('button', { name: '取消' }).click();
  await page.getByRole('button', { name: '卸载挂件' }).click();
  expect(await page.locator('.rl-theme, .rl-portal, .rl-toast-viewport, [data-base-ui-portal]').count()).toBe(0);
  // Nothing was appended to <body> (the build moves the module script into <head>).
  expect(await page.locator('body > *').evaluateAll((els) => els.map((e) => e.tagName.toLowerCase()))).toEqual(['header', 'main']);
});

test('the widget has no WCAG 2.2 A/AA violations (host page excluded)', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#widget-a .rl-theme')).toBeVisible();
  const results = await new AxeBuilder({ page })
    .include('#widget-a')
    .include('#widget-b')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(results.violations.map((v) => ({ id: v.id, nodes: v.nodes.slice(0, 3).map((n) => n.target.join(' ')) }))).toEqual([]);
});

test('320px wide host: the narrow widget does not overflow its slot', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto('/');
  const slot = page.locator('#widget-b');
  await expect(slot.locator('.rl-theme')).toBeVisible();
  const { slotRight, widest } = await slot.evaluate((el) => {
    const right = el.getBoundingClientRect().right;
    let max = 0;
    for (const n of el.querySelectorAll<HTMLElement>('*')) {
      if (n.closest('.rl-table-scroll') && !n.classList.contains('rl-table-scroll')) continue;
      const r = n.getBoundingClientRect();
      if (r.width && r.height) max = Math.max(max, r.right);
    }
    return { slotRight: right, widest: max };
  });
  expect(widest).toBeLessThanOrEqual(slotRight + 1);
  await page.screenshot({ path: 'test-results/screens/host-embed-390.png', fullPage: true });
});
