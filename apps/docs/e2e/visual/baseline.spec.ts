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
  { name: 'data', hash: '/#/archive/data' },
  { name: 'feedback', hash: '/#/components/feedback' },
  { name: 'locale', hash: '/#/foundations/locale' },
  { name: 'scenarios', hash: '/#/archive/scenarios' },
  { name: 'patterns', hash: '/#/patterns' },
  { name: 'recipes', hash: '/#/recipes' },
  // M12: advanced interaction and the Agent UI pages (lazy chunk).
  { name: 'advanced', hash: '/#/components/advanced' },
  { name: 'command', hash: '/#/components/command' },
  { name: 'agent-overview', hash: '/#/agent' },
  { name: 'agent-adoption', hash: '/#/agent/adoption' },
  { name: 'agent-shell', hash: '/#/agent/shell' },
  { name: 'agent-message', hash: '/#/agent/messages' },
  { name: 'agent-tools', hash: '/#/agent/tools' },
  { name: 'agent-composer', hash: '/#/agent/composer' },
  { name: 'agent-intervention', hash: '/#/agent/intervention' },
  { name: 'agent-workspace', hash: '/#/agent/workspace' },
] as const;

async function open(page: Page, hash: string) {
  await page.goto(hash);
  await expect(page.locator('h1')).toBeVisible();
  if (hash === '/#/') await expect(page.getByRole('region', { name: 'Research instrument', exact: true })).toBeVisible();
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

      test('alert dialog open', async ({ page }) => {
        await setSettings(page, { theme, motion: 'reduce' });
        await open(page, '/#/components/alert-dialog');
        await page.getByRole('button', { name: '删除记录…' }).first().click();
        await expect(page.getByRole('alertdialog')).toBeVisible();
        await expect(page).toHaveScreenshot(`alert-dialog-open-${theme}-${width}.png`);
      });

      test('drawer open', async ({ page }) => {
        await setSettings(page, { theme, motion: 'reduce' });
        await open(page, '/#/components/drawer');
        await page.getByRole('button', { name: '查看详情' }).first().click();
        await expect(page.getByRole('dialog')).toBeVisible();
        await expect(page).toHaveScreenshot(`drawer-open-${theme}-${width}.png`);
      });

      test('docs search open', async ({ page }) => {
        await setSettings(page, { theme, motion: 'reduce' });
        await open(page, '/#/');
        if (width < 1024) await page.getByRole('button', { name: '打开导航' }).click();
        await page.getByRole('searchbox', { name: '搜索组件、文档与 API' }).fill('drawer');
        await expect(page.getByRole('list', { name: '搜索结果' })).toBeVisible();
        await expect(page).toHaveScreenshot(`search-open-${theme}-${width}.png`);
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

test.describe('wide rail evidence', () => {
  test.use({ viewport: { width: 1920, height: 1000 } });

  test('overview content rail · light', async ({ page }) => {
    await setSettings(page, { motion: 'reduce' });
    await open(page, '/#/');
    await expect(page).toHaveScreenshot('overview-light-1920.png');
  });

  test('locale side-by-side columns · light', async ({ page }) => {
    await setSettings(page, { motion: 'reduce' });
    await open(page, '/#/foundations/locale');
    await expect(page).toHaveScreenshot('locale-light-1920.png');
  });
});

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

  for (const theme of ['light', 'dark'] as const) {
    test(`data navigation specimens · ${theme}`, async ({ page }) => {
      await setSettings(page, { theme, motion: 'reduce' });
      await open(page, '/#/archive/data');
      for (const name of ['Pagination', 'Breadcrumb', 'Progress & Meter', 'Stat'] as const) {
        const region = page.getByRole('region', { name, exact: true });
        await region.scrollIntoViewIfNeeded();
        await expect(region).toHaveScreenshot(`data-${name.replace(/[^a-z]+/gi, '-').toLowerCase()}-${theme}.png`);
      }
    });
  }

  for (const theme of ['light', 'dark'] as const) {
    test(`feedback specimens · ${theme}`, async ({ page }) => {
      await setSettings(page, { theme, motion: 'reduce' });
      await open(page, '/#/components/feedback');
      for (const name of ['Alert tones', 'Callout', 'EmptyState', 'Skeleton', 'Spinner'] as const) {
        const region = page.getByRole('region', { name, exact: true });
        await region.scrollIntoViewIfNeeded();
        await expect(region).toHaveScreenshot(`feedback-${name.replace(/[^a-z]+/gi, '-').toLowerCase()}-${theme}.png`);
      }
    });
  }

  test('forced colors · feedback', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await setSettings(page, { motion: 'reduce' });
    await open(page, '/#/components/feedback');
    const region = page.getByRole('region', { name: 'Alert tones', exact: true });
    await region.scrollIntoViewIfNeeded();
    await expect(region).toHaveScreenshot('feedback-alert-tones-forced-colors.png');
  });

  test('forced colors · data navigation', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await setSettings(page, { motion: 'reduce' });
    await open(page, '/#/archive/data');
    const region = page.getByRole('region', { name: 'Pagination' });
    await region.scrollIntoViewIfNeeded();
    await expect(region).toHaveScreenshot('data-pagination-forced-colors.png');
  });

  test('forced colors · choice states', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await setSettings(page, { motion: 'reduce' });
    await open(page, '/#/components/choice');
    const specimen = page.getByRole('region', { name: 'States' });
    await specimen.scrollIntoViewIfNeeded();
    await expect(specimen).toHaveScreenshot('choice-states-forced-colors.png');
  });
});

// P030-02/03 layout line: the new Page-patterns interface records all five regulatory widths
// (320/390/768/1280/1920). 390 and 1280 in both themes come from the standard loop above; this
// block covers the remaining widths so overlay (320/390) and split (768+) modes are all baselined.
test.describe('patterns five-width record', () => {
  for (const width of [320, 768, 1920] as const) {
    test.describe(`light ${width}`, () => {
      test.use({ viewport: { width, height: width < 768 ? 844 : 900 } });

      test('patterns page', async ({ page }) => {
        await setSettings(page, { motion: 'reduce' });
        await open(page, '/#/patterns');
        await expect(page).toHaveScreenshot(`patterns-record-light-${width}.png`);
      });
    });
  }
});
