import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { setSettings } from '../helpers';

/**
 * Visual regression baseline (M6). Pixel comparison against committed PNGs in
 * `__screenshots__/<platform>/`. Run `pnpm test:visual`; after an intended visual change run
 * `pnpm test:visual:update` and review the PNG diff in the PR like any other change.
 *
 * Kept deliberately small and stable: component specimens and closed/open overlays at the
 * widths where layout changes, in both themes. Viewport-only shots (no fullPage) so unrelated
 * content further down a page cannot invalidate a baseline.
 */

const pages = [
  { name: 'foundations', hash: '/#/foundations' },
  { name: 'button', hash: '/#/components/button' },
  { name: 'field', hash: '/#/components/field' },
  { name: 'choice', hash: '/#/components/choice' },
  { name: 'archive', hash: '/#/archive' },
  { name: 'scenarios', hash: '/#/archive/scenarios' },
] as const;

async function open(page: Page, hash: string) {
  await page.goto(hash);
  await expect(page.locator('h1')).toBeVisible();
  // Web fonts are not bundled; wait for the system stack to settle before capturing.
  await page.evaluate(() => document.fonts.ready);
}

for (const theme of ['light', 'dark'] as const) {
  for (const width of [390, 1280] as const) {
    test.describe(`${theme} · ${width}px`, () => {
      test.use({ viewport: { width, height: width < 768 ? 844 : 900 } });

      for (const route of pages) {
        test(route.name, async ({ page }) => {
          await setSettings(page, { theme, motion: 'reduce' });
          await open(page, route.hash);
          await expect(page).toHaveScreenshot(`${route.name}-${theme}-${width}.png`);
        });
      }

      test('dialog open', async ({ page }) => {
        await setSettings(page, { theme, motion: 'reduce' });
        await open(page, '/#/components/dialog');
        await page.getByRole('button', { name: '归档记录…' }).click();
        await expect(page.getByRole('dialog')).toBeVisible();
        await expect(page).toHaveScreenshot(`dialog-open-${theme}-${width}.png`);
      });

      test('select open', async ({ page }) => {
        await setSettings(page, { theme, motion: 'reduce' });
        await open(page, '/#/components/select');
        await page.getByRole('combobox', { name: '记录类别' }).first().click();
        await expect(page.getByRole('listbox')).toBeVisible();
        await expect(page).toHaveScreenshot(`select-open-${theme}-${width}.png`);
      });
    });
  }
}

test.describe('component close-ups', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('button matrix', async ({ page }) => {
    await setSettings(page, { motion: 'reduce' });
    await open(page, '/#/components/button');
    const specimen = page.locator('.sc-specimen').first();
    await expect(specimen).toHaveScreenshot('button-specimen-light.png');
  });

  test('compact density · data table', async ({ page }) => {
    await setSettings(page, { density: 'compact', motion: 'reduce' });
    await open(page, '/#/archive');
    const table = page.locator('.rl-table-scroll').first();
    await table.scrollIntoViewIfNeeded();
    await expect(table).toHaveScreenshot('table-compact-light.png');
  });

  test('forced colors · button and field', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await setSettings(page, { motion: 'reduce' });
    await open(page, '/#/components/field');
    await expect(page).toHaveScreenshot('field-forced-colors.png');
  });

  for (const theme of ['light', 'dark'] as const) {
    test(`choice states · ${theme}`, async ({ page }) => {
      await setSettings(page, { theme, motion: 'reduce' });
      await open(page, '/#/components/choice');
      const specimen = page.getByRole('region', { name: 'States' });
      await specimen.scrollIntoViewIfNeeded();
      await expect(specimen).toHaveScreenshot(`choice-states-${theme}.png`);
    });
  }

  test('forced colors · choice states', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await setSettings(page, { motion: 'reduce' });
    await open(page, '/#/components/choice');
    const specimen = page.getByRole('region', { name: 'States' });
    await specimen.scrollIntoViewIfNeeded();
    await expect(specimen).toHaveScreenshot('choice-states-forced-colors.png');
  });
});
