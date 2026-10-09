import { expect, test } from '@playwright/test';
import { findHorizontalOverflow, routes, setSettings, widths } from './helpers';

/**
 * Layout acceptance at 320/390/768/1280/1920. Screenshots are written to
 * test-results/screens for human visual review; they are not pixel-diffed baselines.
 */
for (const width of widths) {
  test.describe(`${width}px`, () => {
    test.use({ viewport: { width, height: width < 768 ? 844 : 1000 } });

    for (const route of routes) {
      test(`${route.name}: no horizontal page overflow`, async ({ page }) => {
        await setSettings(page, { motion: 'reduce' });
        await page.goto(route.hash);
        await expect(page.locator('h1')).toBeVisible();
        const result = await findHorizontalOverflow(page);
        expect(result.offenders, JSON.stringify(result)).toEqual([]);
        expect(result.scrollWidth).toBeLessThanOrEqual(result.clientWidth);
        await page.screenshot({
          path: `test-results/screens/${width}-${route.name}-light.png`,
          fullPage: true,
        });
      });
    }

    test('navigation is reachable', async ({ page }) => {
      await page.goto('/#/');
      if (width >= 1024) {
        await expect(page.getByRole('navigation', { name: '主导航' })).toBeVisible();
        await expect(page.getByRole('button', { name: '打开导航' })).toHaveCount(0);
      } else {
        await expect(page.getByRole('navigation', { name: '主导航' })).toBeHidden();
        await page.getByRole('button', { name: '打开导航' }).click();
        await expect(page.getByRole('navigation', { name: '主导航' })).toBeVisible();
      }
    });
  });
}

test.describe('dark theme screenshots', () => {
  for (const width of [390, 1280] as const) {
    test(`${width}px foundations + button`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 });
      await setSettings(page, { theme: 'dark', motion: 'reduce' });
      for (const name of ['overview', 'foundations', 'button'] as const) {
        const route = routes.find((r) => r.name === name)!;
        await page.goto(route.hash);
        await expect(page.locator('h1')).toBeVisible();
        await page.screenshot({ path: `test-results/screens/${width}-${name}-dark.png`, fullPage: true });
      }
    });
  }
});
