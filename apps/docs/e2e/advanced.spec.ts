import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { findHorizontalOverflow, setSettings } from './helpers';

test.use({ viewport: { width: 1280, height: 900 } });

const url = '/#/components/advanced';
const axeTags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

test.describe('Advanced interaction (M12 group 1) in a real browser', () => {
  test.beforeEach(async ({ page }) => {
    await setSettings(page, {});
  });

  test('accordion: Enter / Space toggle, aria-expanded follows, single mode closes the other item', async ({ page }) => {
    await page.goto(url);
    const region = page.getByRole('region', { name: 'Accordion · single' });
    const scope = region.getByRole('button', { name: /适用范围/ });
    const method = region.getByRole('button', { name: /采样方法/ });
    await expect(scope).toHaveAttribute('aria-expanded', 'true');
    await expect(region.getByRole('heading', { level: 3, name: /适用范围/ })).toBeVisible();

    await scope.focus();
    await page.keyboard.press('Tab');
    await expect(method).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(method).toHaveAttribute('aria-expanded', 'true');
    await expect(scope).toHaveAttribute('aria-expanded', 'false');
    await expect(region.getByRole('region', { name: /采样方法/ })).toBeVisible();
    await page.keyboard.press('Space');
    await expect(method).toHaveAttribute('aria-expanded', 'false');

    // Disabled item is skipped by Tab.
    await region.getByRole('button', { name: /长标题/ }).focus();
    await page.keyboard.press('Tab');
    await expect(region.getByRole('button', { name: /审批记录/ })).not.toBeFocused();
    await expect(region.getByRole('button', { name: /审批记录/ })).toBeDisabled();
  });

  test('slider: arrow keys change aria-valuenow and the spoken / shown value', async ({ page }) => {
    await page.goto(url);
    const region = page.getByRole('region', { name: 'Slider · discrete marks' });
    const slider = region.getByRole('slider', { name: '执行强度（示例）' });
    await expect(slider).toHaveAttribute('aria-valuenow', '2');
    await expect(slider).toHaveAttribute('aria-valuetext', '中');
    await slider.focus();
    await page.keyboard.press('ArrowRight');
    await expect(slider).toHaveAttribute('aria-valuenow', '3');
    await expect(slider).toHaveAttribute('aria-valuetext', '高');
    await expect(region.locator('output')).toHaveText('高');
    await page.keyboard.press('End');
    await expect(slider).toHaveAttribute('aria-valuetext', '最高');
    await page.keyboard.press('Home');
    await expect(slider).toHaveAttribute('aria-valuetext', '关闭');

    // Focus ring is visible on the thumb.
    const outline = await region.locator('.rl-slider__thumb').evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(outline).toBe('solid');
  });

  test('number field: increment button and ArrowUp step and clamp at max', async ({ page }) => {
    await page.goto(url);
    const region = page.getByRole('region', { name: 'NumberField', exact: true });
    const input = region.getByRole('textbox', { name: '并发上限' });
    const increment = region.getByRole('button', { name: '增加' });
    await expect(input).toHaveValue('4');
    await increment.click();
    await expect(input).toHaveValue('5');
    await input.focus();
    await page.keyboard.press('ArrowUp');
    await expect(input).toHaveValue('6');
    for (let i = 0; i < 4; i += 1) await page.keyboard.press('ArrowUp');
    await expect(input).toHaveValue('8');
    await expect(increment).toBeDisabled();
    await expect(region.getByText('当前值：8')).toBeVisible();
    await page.keyboard.press('ArrowDown');
    await expect(input).toHaveValue('7');
  });

  test('context menu: Shift+F10 on the focused row opens it; Escape closes and returns focus', async ({ page }) => {
    await page.goto(url);
    const row = page.getByRole('group', { name: '档案行 REC-0142' });
    await row.focus();
    await page.keyboard.press('Shift+F10');
    const menu = page.getByRole('menu');
    await expect(menu).toBeVisible();
    await expect(menu.getByRole('menuitem', { name: '复制编号' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    await expect(row).toBeFocused();
  });

  test('context menu: right click opens at the pointer; checkbox items stay open, plain items run and close', async ({ page }) => {
    await page.goto(url);
    const row = page.getByRole('group', { name: '档案行 REC-0142' });
    await row.click({ button: 'right' });
    const menu = page.getByRole('menu');
    await expect(menu).toBeVisible();
    // Checkbox items toggle in place and keep the menu open (Base UI default).
    const pin = menu.getByRole('menuitemcheckbox', { name: '固定到顶部' });
    await pin.click();
    await expect(pin).toHaveAttribute('aria-checked', 'true');
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    await expect(row).toBeFocused();
    // Outside content is hidden from assistive tech while the menu is open, so check it afterwards.
    await expect(row.getByText('已固定')).toBeVisible();

    // A plain item closes the menu after running.
    await row.click({ button: 'right' });
    await menu.getByRole('menuitem', { name: '复制编号' }).click();
    await expect(menu).toBeHidden();
    await expect(page.getByText('已复制 REC-0142（示例）')).toBeVisible();

    await row.click({ button: 'right' });
    await expect(menu).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    await expect(row).toBeFocused();
  });

  test('accordion panel and chevron have no transition under reduced motion', async ({ page }) => {
    await setSettings(page, { motion: 'reduce' });
    await page.goto(url);
    const panel = page.getByRole('region', { name: 'Accordion · single' }).locator('.rl-accordion__panel').first();
    const duration = await panel.evaluate((el) => getComputedStyle(el).transitionDuration);
    expect(duration.split(',').every((d) => parseFloat(d) === 0)).toBe(true);
  });

  test('no horizontal overflow at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto(url);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const result = await findHorizontalOverflow(page);
    expect(result.offenders).toEqual([]);
    expect(result.scrollWidth).toBeLessThanOrEqual(result.clientWidth);
  });

  for (const theme of ['light', 'dark'] as const) {
    test(`axe clean · ${theme}`, async ({ page }) => {
      await setSettings(page, { theme });
      await page.goto(url);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      const results = await new AxeBuilder({ page }).withTags(axeTags).analyze();
      expect(results.violations.map((v) => ({ id: v.id, nodes: v.nodes.slice(0, 3).map((n) => n.target.join(' ')) }))).toEqual([]);
    });
  }

  test('axe clean with the context menu open', async ({ page }) => {
    await page.goto(url);
    await page.getByRole('group', { name: '档案行 REC-0142' }).click({ button: 'right' });
    await expect(page.getByRole('menu')).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(axeTags).analyze();
    expect(results.violations.map((v) => ({ id: v.id, nodes: v.nodes.slice(0, 3).map((n) => n.target.join(' ')) }))).toEqual([]);
  });
});
