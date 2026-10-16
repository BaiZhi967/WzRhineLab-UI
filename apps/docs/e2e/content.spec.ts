import { expect, test } from '@playwright/test';
import { setSettings } from './helpers';

test.describe('Markdown content page', () => {
  test('renders Markdown, GFM, headings, links and code blocks', async ({ page }) => {
    await page.goto('/#/archive/content');
    await expect(page.getByRole('heading', { level: 1, name: 'Markdown 内容层' })).toBeVisible();
    const markdown = page.getByRole('region', { name: 'MarkdownRenderer' });
    await expect(markdown.getByRole('heading', { level: 2, name: '研究记录' }).first()).toHaveAttribute('id', '研究记录');
    await expect(markdown.getByRole('table')).toBeVisible();
    await expect(markdown.getByRole('checkbox')).toBeChecked();
    await expect(markdown.getByRole('link', { name: '安全链接' })).toHaveAttribute('href', 'https://example.com');
    await expect(markdown.getByRole('link', { name: '危险链接' })).toHaveCount(0);
    await page.getByRole('radio', { name: 'Dark' }).check();
    await expect(page.locator('.rl-theme')).toHaveAttribute('data-rl-theme', 'dark');
    await page.getByRole('radio', { name: '紧凑' }).check();
    await expect(page.locator('.rl-theme')).toHaveAttribute('data-rl-density', 'compact');
    const code = page.getByRole('region', { name: 'CodeBlock' });
    await expect(code.getByText('const answer = 42;')).toBeVisible();
    await code.getByRole('button', { name: /复制代码|Copy code|已复制代码|Code copied/ }).click();
    await expect(code.getByRole('status')).toContainText(/已复制代码|复制失败|Code copied|Copy failed/);
  });

  test('shows explicit loading, empty and error states', async ({ page }) => {
    await page.goto('/#/archive/content');
    const states = page.getByRole('region', { name: 'Markdown states' });
    await expect(states.getByRole('status')).toHaveAttribute('aria-busy', 'true');
    await expect(states.getByTestId('rl-content-empty')).toBeVisible();
    await expect(states.getByRole('alert')).toContainText('读取失败');
    await states.getByRole('button', { name: '重试' }).click();
    await expect(states.getByText('已重试')).toBeVisible();
  });

  test('remains within the viewport on a narrow screen', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 844 });
    await setSettings(page, { motion: 'reduce' });
    await page.goto('/#/archive/content');
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
    await expect(page.locator('.rl-theme')).toBeVisible();
  });
});
