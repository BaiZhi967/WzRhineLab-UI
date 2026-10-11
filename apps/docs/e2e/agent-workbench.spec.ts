import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { findHorizontalOverflow, setSettings } from './helpers';

/**
 * Integrated Agent workbench (ADR-0010 §5): one scripted adapter drives every family. Covers the
 * full loop — send, tool activity, approval gate, approve, run summary — plus the motion page.
 */

const axe = async (page: Page) => {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  return results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
};

const open = async (page: Page, width = 1440) => {
  await page.setViewportSize({ width, height: 960 });
  await setSettings(page, {});
  await page.goto('/#/agent');
  const bench = page.locator('section[aria-labelledby="agent-workbench-title"]');
  await expect(bench).toBeVisible();
  return bench;
};

test.describe('Agent workbench', () => {
  test('send → tools → approval → approve → summary', async ({ page }) => {
    const bench = await open(page);
    const input = bench.getByRole('combobox').first();
    await input.click();
    await page.keyboard.type('关闭调试开关');
    await page.keyboard.press('Enter');

    // The user message lands in the list and the run starts.
    await expect(bench.getByText('关闭调试开关').first()).toBeVisible();
    await expect(bench.getByRole('status').filter({ hasText: '演示阶段' })).toContainText(/思考中|执行工具/);

    // Approval gate: the dock shows the panel, the composer is blocked, reject is always possible.
    const allow = bench.getByRole('button', { name: /允许/ }).first();
    await expect(allow).toBeVisible({ timeout: 8000 });
    await expect(bench.getByRole('button', { name: /拒绝/ }).first()).toBeEnabled();
    await allow.click();

    await expect(bench.getByRole('status').filter({ hasText: '演示阶段' })).toContainText('本轮已结束', { timeout: 8000 });
    await expect(bench.getByText('已关闭').first()).toBeVisible();
  });

  test('context pane toggles from the header', async ({ page }) => {
    const bench = await open(page);
    const toggle = bench.locator('button[aria-pressed]').first();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  });

  test('atlas index lists all 46 concept components', async ({ page }) => {
    await open(page);
    await expect(page.locator('.sc-agent-atlas tbody tr')).toHaveCount(46);
  });

  test('axe is clean and nothing overflows at 320', async ({ page }) => {
    await open(page);
    expect(await axe(page)).toEqual([]);
    await open(page, 320);
    const overflow = await findHorizontalOverflow(page);
    expect(overflow.offenders).toEqual([]);
  });

  test('motion page renders every pattern and is clean under reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await setSettings(page, { motion: 'reduce' });
    await page.goto('/#/agent/motion');
    await expect(page.locator('.sc-agent-motion-grid .rl-agent-spark')).toHaveCount(7);
    // Reduced motion: no spark loop is running.
    await expect(page.locator('.rl-agent-spark[data-loop="running"]')).toHaveCount(0);
    expect(await axe(page)).toEqual([]);
  });
});
