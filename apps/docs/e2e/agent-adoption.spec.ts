import { expect, test } from '@playwright/test';
import { findHorizontalOverflow, setSettings, widths } from './helpers';

test.describe('Wpi adoption readiness showcase', () => {
  test('renders the complete public-entry workbench and effect states', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 900 });
    await setSettings(page, { motion: 'reduce' });
    await page.goto('/#/agent/adoption');
    await expect(page.getByRole('heading', { name: 'Wpi adoption readiness' })).toBeVisible();
    await expect(page.getByText('Wpi 接入验收工作台')).toBeVisible();
    await expect(page.locator('.rl-agent-run-overview').locator('strong', { hasText: '运行概览' })).toBeVisible();
    await expect(page.getByText('契约')).toBeVisible();
    await page.getByRole('button', { name: '添加引用' }).click();
    await expect(page.getByRole('dialog', { name: '添加文件引用' })).toBeVisible();
    await page.getByRole('button', { name: '切换选中节点' }).click();
    await expect(page.locator('.rl-orbit__node[data-selected="true"]')).toHaveCount(1);
    await page.getByRole('button', { name: '收起索引' }).click();
    await expect(page.getByRole('button', { name: '打开索引' })).toBeVisible();
    expect((await findHorizontalOverflow(page)).offenders).toEqual([]);
  });

  for (const width of widths) {
    test(`fits at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await setSettings(page, { motion: 'reduce' });
      await page.goto('/#/agent/adoption');
      await expect(page.getByRole('heading', { name: 'Wpi adoption readiness' })).toBeVisible();
      await expect(page.locator('.rl-agent-shell')).toHaveAttribute('data-layout', /^(narrow|compact|wide)$/);
      expect((await findHorizontalOverflow(page)).offenders).toEqual([]);
    });
  }
});
