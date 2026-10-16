import { expect, test } from '@playwright/test';
import { findHorizontalOverflow, setSettings } from './helpers';

test.describe('Markdown editor Showcase', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('loads the fixture workbench and keeps source and preview on one Markdown value', async ({ page }) => {
    await setSettings(page, { motion: 'reduce' });
    await page.goto('/#/archive/editor');
    await expect(page.getByRole('heading', { level: 1, name: 'Markdown writing workbench' })).toBeVisible();
    await expect(page.getByRole('tab', { name: '写作工作台.md' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByTestId('editor-preview-pane').getByRole('heading', { name: '写作工作台' })).toBeVisible();
    await expect(page.getByTestId('editor-preview-pane').getByText('Markdown 原文是唯一事实源')).toBeVisible();
    await expect(page.getByText('WYSIWYM 暂不接入。')).toBeVisible();
  });

  test('source typing updates the preview and mode switching preserves the text', async ({ page }) => {
    await page.goto('/#/archive/editor');
    const editor = page.locator('.cm-content').first();
    await editor.click();
    await page.keyboard.press('Control+End');
    await page.keyboard.type('\n\n## 浏览器验收');
    await expect(page.getByRole('heading', { name: '浏览器验收' })).toBeVisible();
    await page.getByRole('tab', { name: '源码' }).click();
    await expect(page.getByRole('textbox', { name: 'Markdown source' })).toBeVisible();
    await page.getByRole('tab', { name: '预览' }).click();
    await expect(page.getByRole('heading', { name: '浏览器验收' })).toBeVisible();
    await page.getByRole('tab', { name: '分栏' }).click();
    await expect(page.locator('.rl-editor__split-view')).toBeVisible();
    await expect(page.getByRole('heading', { name: '浏览器验收' })).toBeVisible();
  });

  test('toolbar commands, save error/retry, conflict recovery and tab close are caller-owned fixture actions', async ({ page }) => {
    await page.goto('/#/archive/editor');
    const editor = page.locator('.cm-content').first();
    await editor.click();
    await page.keyboard.press('Control+End');
    await page.keyboard.type('\n\n尾部');
    await expect(page.locator('.rl-editor__save-status').getByText('有未保存的更改')).toBeVisible();
    await page.getByRole('button', { name: '模拟保存失败' }).click();
    await expect(page.locator('.rl-editor__save-status').getByText('保存失败', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: '重试保存' }).click();
    await expect(page.locator('.rl-editor__save-status').getByText('有未保存的更改')).toBeVisible();
    await page.getByRole('button', { name: '模拟冲突' }).click();
    await expect(page.locator('.rl-editor__save-status').getByText('存在冲突')).toBeVisible();
    await page.getByRole('button', { name: '处理冲突' }).click();
    await expect(page.getByText('冲突保留本地 Markdown 原文')).toBeVisible();
    await expect(page.locator('.rl-editor__save-status').getByText('有未保存的更改')).toBeVisible();

    await page.getByRole('tab', { name: '田野笔记.md' }).click();
    await page.getByRole('button', { name: '关闭 田野笔记.md' }).click();
    await expect(page.getByRole('tab', { name: '田野笔记.md' })).toHaveCount(0);
    await expect(page.getByRole('tab', { name: '写作工作台.md' })).toHaveAttribute('aria-selected', 'true');
  });

  test('keeps narrow editor layouts inside the viewport', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 844 });
    await page.goto('/#/archive/editor');
    await expect(page.getByRole('heading', { level: 1, name: 'Markdown writing workbench' })).toBeVisible();
    const result = await findHorizontalOverflow(page);
    expect(result.offenders, JSON.stringify(result)).toEqual([]);
    expect(result.scrollWidth).toBeLessThanOrEqual(result.clientWidth);
  });
});
