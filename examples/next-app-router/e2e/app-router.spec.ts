import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * Next.js App Router acceptance (ADR-0008 §2). The page is a Server Component that imports
 * @wzrhine/react directly; the raw HTML must already contain the component markup, the page
 * must hydrate without console noise, and the client island (AlertDialog + toast) must work.
 */

function collectConsole(page: Page) {
  const messages: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') messages.push(`${m.type()}: ${m.text()}`);
  });
  page.on('pageerror', (e) => messages.push(`pageerror: ${e.message}`));
  return messages;
}

/** Next has no public "hydrated" signal; the trigger only opens the dialog once React is attached. */
async function openConfirm(page: Page) {
  const dialog = page.getByRole('alertdialog', { name: '撤回审核申请？' });
  await expect(async () => {
    if (!(await dialog.isVisible())) await page.getByRole('button', { name: '撤回审核' }).click();
    await expect(dialog).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 15_000 });
  return dialog;
}

test('server HTML already contains the component markup before any JavaScript runs', async ({ request }) => {
  const res = await request.get('/');
  expect(res.status()).toBe(200);
  const html = await res.text();
  for (const needle of [
    '<html lang="zh-CN"',
    'class="rl-theme next-root"',
    'data-rl-theme="light"',
    'class="rl-portal"',
    '沉积岩芯分层记录',
    'ARC-5207',
    'role="tablist"',
    'aria-selected="true"',
    '<table class="rl-table"',
    '样本清单（示例）· 第 1 / 3 页',
    '示例数据',
  ]) {
    expect(html, needle).toContain(needle);
  }
  expect(html).toMatch(/<header[^>]*class="[^"]*\brl-record\b/);
  expect(html).toMatch(/<caption[^>]*>/);
  // paginate() ran on the server: only page 1 (C-01…C-05) is in the HTML.
  for (const id of ['C-01', 'C-05']) expect(html).toContain(`>${id}<`);
  for (const id of ['C-06', 'C-12']) expect(html).not.toContain(`>${id}<`);
});

test('server-side paging works without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: '沉积岩芯分层记录' })).toBeVisible();
  const table = page.getByRole('table', { name: /样本清单/ });
  await expect(table.getByRole('rowheader')).toHaveText(['C-01', 'C-02', 'C-03', 'C-04', 'C-05']);
  await page.getByRole('button', { name: '下一页' }).click();
  await expect(page).toHaveURL(/\?page=2$/);
  await expect(table.getByRole('rowheader')).toHaveText(['C-06', 'C-07', 'C-08', 'C-09', 'C-10']);
  const bg = await page.locator('.next-root').evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(bg).toBe('rgb(243, 242, 237)');
  await context.close();
});

test('hydrates with zero console errors or warnings', async ({ page }) => {
  const messages = collectConsole(page);
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  // Prove React is attached: the client island responds.
  const dialog = await openConfirm(page);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  expect(messages).toEqual([]);
});

test('client island: AlertDialog focus management and toast inside the theme scope', async ({ page }) => {
  const messages = collectConsole(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const trigger = page.getByRole('button', { name: '撤回审核' });

  const dialog = await openConfirm(page);
  await expect(dialog.getByRole('button', { name: '取消' })).toBeFocused();
  expect(await dialog.evaluate((el) => !!el.closest('.rl-theme'))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();

  await trigger.click();
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: '撤回审核' }).click();
  await expect(dialog).toBeHidden();
  const toast = page.locator('.rl-toast').filter({ hasText: '已撤回审核' });
  await expect(toast).toBeVisible();
  expect(await toast.evaluate((el) => !!el.closest('.rl-theme'))).toBe(true);

  // Server-rendered Tabs hydrate too.
  await page.getByRole('tab', { name: '元数据' }).click();
  await expect(page.getByRole('tabpanel', { name: '元数据' })).toContainText('ARC-5207');
  expect(messages).toEqual([]);
});

test('no WCAG 2.2 A/AA violations (light)', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  expect(results.violations.map((v) => v.id)).toEqual([]);
});
