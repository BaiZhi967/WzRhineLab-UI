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

test.describe('Showcase specimen rhythm', () => {
  test.use({ viewport: { width: 1920, height: 1000 } });

  test('keeps independent short specimens content-sized', async ({ page }) => {
    await setSettings(page, { motion: 'reduce' });
    await page.goto('/#/foundations');
    await expect(page.locator('h1')).toBeVisible();

    const spacing = page.locator('.sc-specimen[aria-labelledby="space-title"]');
    const typography = page.locator('.sc-specimen[aria-labelledby="type-title"]');
    const focus = page.locator('.sc-specimen[aria-labelledby="focus-title"]');
    await expect(spacing).toHaveAttribute('data-align', 'start');
    await expect(focus).toHaveAttribute('data-align', 'start');
    expect(await spacing.evaluate((element) => element.getBoundingClientRect().height)).toBeLessThan(
      await typography.evaluate((element) => element.getBoundingClientRect().height),
    );

    await page.goto('/#/components/button');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.sc-specimen[aria-labelledby="button-sizes-title"]')).toHaveAttribute('data-align', 'start');
    await expect(page.locator('.sc-specimen[aria-labelledby="button-icons-title"]')).toHaveAttribute('data-align', 'start');
  });
});

test.describe('Adoption workbench states', () => {
  test('enters compact before squeezing the reading column', async ({ page }) => {
    test.setTimeout(30_000);
    await page.setViewportSize({ width: 1280, height: 900 });
    await setSettings(page, { motion: 'reduce' });
    await page.goto('/#/agent/adoption');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.rl-agent-shell')).toHaveAttribute('data-layout', 'compact');
    const width = await page.locator('.rl-agent-shell__main').evaluate((element) => element.getBoundingClientRect().width);
    expect(width).toBeGreaterThanOrEqual(320);
  });

  test('uses sheets for side columns on narrow screens', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await setSettings(page, { motion: 'reduce' });
    await page.goto('/#/agent/adoption');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.rl-agent-shell')).toHaveAttribute('data-layout', 'narrow');
    await expect(page.locator('.rl-agent-shell__rail')).toHaveCount(0);
    await expect(page.locator('.rl-agent-shell__index')).toHaveCount(0);
    await expect(page.locator('.rl-agent-shell__context[data-open]')).toHaveCount(0);
  });

  test('keeps the context pane inline on wide screens', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 900 });
    await setSettings(page, { motion: 'reduce' });
    await page.goto('/#/agent/adoption');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.rl-agent-shell')).toHaveAttribute('data-layout', 'wide');
    await expect(page.locator('.rl-agent-shell__context[data-open]')).toBeVisible();
  });
});
