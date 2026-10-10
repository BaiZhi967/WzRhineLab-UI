import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * SSR + hydration acceptance. The raw HTML is fetched without JavaScript to prove the server
 * output is complete and themed; then the page is loaded normally and must hydrate without
 * recoverable errors or console warnings, and every interactive component must work.
 */

test('server HTML is complete, themed and accessible before any JavaScript runs', async ({ request }) => {
  const res = await request.get('/?theme=dark');
  expect(res.status()).toBe(200);
  const html = await res.text();
  for (const needle of [
    'class="rl-theme ssr-root"',
    'data-rl-theme="dark"',
    '矿物样本含水率测定',
    'ARC-3104',
    '<table class="rl-table"',
    '<caption',
    'role="tablist"',
    'aria-selected="true"',
    'class="rl-portal"',
  ]) {
    expect(html, needle).toContain(needle);
  }
  // The record trail is a server-rendered breadcrumb landmark with the current page marked.
  expect(html).toMatch(/<nav[^>]*class="[^"]*\brl-record__trail\b[^"]*"[^>]*>/);
  expect(html).toMatch(/<nav[^>]*class="[^"]*\brl-breadcrumb\b/);
  expect(html).toContain('aria-current="page"');
  // The serialised state cannot break out of its script tag.
  expect(html).toMatch(/window\.__PAGE_DATA__=\{/);
});

test('JavaScript disabled: content is readable and styled', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: '矿物样本含水率测定' })).toBeVisible();
  await expect(page.getByRole('table', { name: '样本清单' }).getByRole('rowheader')).toHaveText(['S-01', 'S-02', 'S-03']);
  const bg = await page.locator('.ssr-root').evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(bg).toBe('rgb(243, 242, 237)');
  expect(await page.locator('main').getAttribute('data-hydrated')).toBeNull();
  await context.close();
});

for (const theme of ['light', 'dark'] as const) {
  test(`hydrates without mismatches or warnings · ${theme}`, async ({ page }) => {
    const messages: string[] = [];
    page.on('console', (m) => {
      if (m.type() === 'error' || m.type() === 'warning') messages.push(`${m.type()}: ${m.text()}`);
    });
    page.on('pageerror', (e) => messages.push(`pageerror: ${e.message}`));
    await page.goto(`/?theme=${theme}`);
    await expect(page.locator('main[data-hydrated]')).toBeVisible();
    expect(await page.evaluate(() => window.__hydrationErrors)).toEqual([]);
    expect(messages).toEqual([]);
    await expect(page.locator('.rl-theme').first()).toHaveAttribute('data-rl-theme', theme);
  });
}

test('after hydration: tabs, dialog with select, toast and tooltip all work', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('main[data-hydrated]')).toBeVisible();

  await page.getByRole('tab', { name: '处理记录' }).click();
  await expect(page.getByRole('list', { name: '处理记录' }).getByRole('listitem')).toHaveCount(3);
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: '元数据' })).toBeFocused();

  await page.getByRole('button', { name: '提交复核意见' }).click();
  const dialog = page.getByRole('dialog', { name: '提交复核意见' });
  await expect(dialog).toBeVisible();
  // Portal content mounts inside the hydrated provider, not at <body>.
  expect(await dialog.evaluate((el) => !!el.closest('.rl-theme'))).toBe(true);
  await dialog.getByRole('combobox', { name: '复核人' }).click();
  await page.getByRole('option', { name: '示例审核员 B' }).click();
  await expect(dialog.getByRole('combobox', { name: '复核人' })).toHaveText(/示例审核员 B/);
  await dialog.getByRole('textbox', { name: /意见/ }).fill('第三批需重新称量');
  await dialog.getByRole('button', { name: '提交', exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText('复核意见已提交')).toBeVisible();

  await page.getByRole('button', { name: '关于本页' }).hover();
  await expect(page.locator('.rl-tooltip')).toContainText('服务器渲染', { timeout: 2000 });
});

test('no WCAG 2.2 A/AA violations after hydration', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('main[data-hydrated]')).toBeVisible();
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  expect(results.violations.map((v) => v.id)).toEqual([]);
});
