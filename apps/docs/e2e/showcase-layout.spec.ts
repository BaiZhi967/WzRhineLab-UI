import { expect, test } from '@playwright/test';
import { findHorizontalOverflow, setSettings } from './helpers';

const sweepRoutes = ['/#/', '/#/foundations', '/#/agent/adoption'] as const;
const sweepWidths = [390, 768, 1280, 1920] as const;

test.describe('Showcase rail geometry', () => {
  test.use({ viewport: { width: 1920, height: 1000 } });

  test('aligns desktop chrome to the content rail', async ({ page }) => {
    await setSettings(page, { motion: 'reduce' });
    await page.goto('/#/');
    await expect(page.locator('h1')).toBeVisible();

    const metrics = await page.evaluate(() => {
      const read = (selector: string) => {
        const element = document.querySelector<HTMLElement>(selector);
        if (!element) throw new Error('Missing ' + selector);
        const rect = element.getBoundingClientRect();
        return { left: rect.left, right: rect.right };
      };
      return {
        page: read('.sc-page'),
        crumb: read('.sc-topbar__crumb'),
        settings: read('.sc-topbar__settings'),
        footerEnd: read('.sc-footer span:last-child'),
      };
    });

    expect(Math.abs(metrics.page.left - metrics.crumb.left)).toBeLessThanOrEqual(1);
    expect(Math.abs(metrics.page.right - metrics.settings.right)).toBeLessThanOrEqual(1);
    expect(Math.abs(metrics.page.right - metrics.footerEnd.right)).toBeLessThanOrEqual(1);
    await page.screenshot({ path: 'test-results/screens/rail-1920.png' });
  });

  for (const width of sweepWidths) {
    test.describe(String(width) + 'px', () => {
      test.use({ viewport: { width, height: width < 768 ? 844 : 1000 } });

      for (const route of sweepRoutes) {
        test(String(route) + ': no horizontal overflow', async ({ page }) => {
          await setSettings(page, { motion: 'reduce' });
          await page.goto(route);
          await expect(page.locator('h1')).toBeVisible();
          const result = await findHorizontalOverflow(page);
          expect(result.offenders, JSON.stringify(result)).toEqual([]);
          expect(result.scrollWidth).toBeLessThanOrEqual(result.clientWidth);
        });
      }
    });
  }
});
