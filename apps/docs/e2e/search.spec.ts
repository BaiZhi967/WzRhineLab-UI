import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/** Docs search (M9.5): generated index of pages, specimens, Markdown headings and API exports. */
test.use({ viewport: { width: 1280, height: 900 } });

test('finds a page, a specimen, a doc heading and an API export; Enter-free link navigation', async ({ page }) => {
  await page.goto('/#/');
  const search = page.getByRole('search', { name: '搜索文档' });
  const input = search.getByRole('searchbox', { name: '搜索组件、文档与 API' });
  await input.fill('drawer');
  const results = search.getByRole('list', { name: '搜索结果' });
  await expect(results).toBeVisible();
  // Pages rank first: the Drawer page link leads the list.
  await expect(results.getByRole('link').first()).toHaveAccessibleName(/^Drawer.*页面/);
  await expect(search.getByRole('status')).toHaveText(/共 \d+ 条结果/);
  await expect(results.getByRole('link', { name: /^DrawerProps.*API/ })).toHaveAttribute('href', /docs\/api\/react\.md#drawerprops$/);
  await expect(results.getByRole('link', { name: /Drawer.*文档/ }).first()).toHaveAttribute('target', '_blank');

  await results.getByRole('link').first().click();
  await expect(page).toHaveURL(/#\/components\/drawer$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Drawer' })).toBeVisible();
  // The query clears after navigating, and the list disappears.
  await expect(input).toHaveValue('');
  await expect(search.getByRole('list')).toHaveCount(0);
});

test('Chinese query, no-result state and Escape to clear', async ({ page }) => {
  await page.goto('/#/');
  const search = page.getByRole('search', { name: '搜索文档' });
  const input = search.getByRole('searchbox');
  await input.fill('分页');
  await expect(search.getByRole('list', { name: '搜索结果' }).getByRole('link').first()).toBeVisible();
  await input.fill('zzzz-不存在');
  await expect(search.getByText('没有匹配的结果', { exact: true }).first()).toBeVisible();
  await expect(search.getByRole('status')).toHaveText('没有匹配的结果');
  await input.press('Escape');
  await expect(input).toHaveValue('');
  await expect(search.getByRole('list')).toHaveCount(0);
});

test('keyboard: Tab from the field reaches the first result', async ({ page }) => {
  await page.goto('/#/');
  const input = page.getByRole('searchbox', { name: '搜索组件、文档与 API' });
  await input.focus();
  await page.keyboard.type('Tabs');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('list', { name: '搜索结果' }).getByRole('link').first()).toBeFocused();
});

test('search with results open has no axe violations', async ({ page }) => {
  await page.goto('/#/');
  await page.getByRole('searchbox', { name: '搜索组件、文档与 API' }).fill('toast');
  await expect(page.getByRole('list', { name: '搜索结果' })).toBeVisible();
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(results.violations.map((v) => v.id)).toEqual([]);
});

test('narrow layout: search lives in the navigation drawer', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#/');
  await page.getByRole('button', { name: '打开导航' }).click();
  const input = page.getByRole('searchbox', { name: '搜索组件、文档与 API' });
  await expect(input).toBeVisible();
  await input.fill('alert');
  await page.getByRole('list', { name: '搜索结果' }).getByRole('link').first().click();
  // Choosing a result closes the drawer.
  await expect(page.getByRole('button', { name: '打开导航' })).toHaveAttribute('aria-expanded', 'false');
});
