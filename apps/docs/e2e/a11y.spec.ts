import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { routes, setSettings } from './helpers';

for (const theme of ['light', 'dark'] as const) {
  test.describe(`axe · ${theme}`, () => {
    for (const route of routes) {
      test(`${route.name} has no WCAG 2.2 A/AA violations`, async ({ page }) => {
        await setSettings(page, { theme });
        await page.goto(route.hash);
        await expect(page.locator('h1')).toBeVisible();
        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
          .analyze();
        const summary = results.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          nodes: v.nodes.slice(0, 3).map((n) => n.target.join(' ')),
        }));
        expect(summary).toEqual([]);
      });
    }
  });
}
