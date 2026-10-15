import { expect, test } from '@playwright/test';
import { setSettings } from '../helpers';

for (const width of [320, 390, 768, 1280, 1920]) {
  for (const theme of ['light', 'dark'] as const) {
    test(`signature relationship · ${theme} · ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 });
      await setSettings(page, { theme, motion: 'reduce' });
      await page.goto('/#/motion/effects');
      const fixture = page.getByTestId('signal-geometry');
      await expect(fixture.locator('.rl-effect-connection__track')).toHaveCount(2);
      await fixture.scrollIntoViewIfNeeded();
      await page.evaluate(() => document.fonts.ready);
      await expect(fixture).toHaveScreenshot(`signature-relationship-${theme}-${width}.png`);
    });

    test(`research instrument · ${theme} · ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 });
      await setSettings(page, { theme, motion: 'reduce' });
      await page.goto('/#/');
      const scene = page.getByRole('region', { name: 'Research instrument', exact: true });
      await expect(scene.locator('.rl-calibration')).toBeVisible();
      await scene.scrollIntoViewIfNeeded();
      await page.evaluate(() => document.fonts.ready);
      await expect(scene).toHaveScreenshot(`research-instrument-${theme}-${width}.png`);
    });
  }
}
