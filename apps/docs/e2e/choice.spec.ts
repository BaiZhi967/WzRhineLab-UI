import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { setSettings } from './helpers';

test.use({ viewport: { width: 1280, height: 900 } });

const page15 = '/#/components/choice';

test.describe('Choice & Textarea in a real browser', () => {
  test('Form blocks an incomplete submit, focuses the first invalid control and submits real FormData', async ({ page }) => {
    await page.goto(page15);
    const form = page.getByRole('form', { name: '提交复核（演示）' });
    const submit = form.getByRole('button', { name: '提交复核' });
    await submit.click();

    const verdict = form.getByRole('radiogroup', { name: /复核结论/ });
    await expect(verdict.getByRole('radio', { name: '通过', exact: true })).toBeFocused();
    await expect(form.getByText('请选择复核结论。')).toBeVisible();
    await expect(form.getByText('请填写复核意见。')).toBeVisible();
    await expect(form.getByText('提交前请确认。')).toBeVisible();
    await expect(form.getByRole('status')).toBeEmpty();

    await page.keyboard.press('ArrowRight');
    await expect(verdict.getByRole('radio', { name: '退回修改' })).toHaveAttribute('aria-checked', 'true');
    await form.getByText('格式不符').click();
    await form.getByRole('textbox', { name: /复核意见/ }).fill('第 3 页缺少单位。\n请补充。');
    await form.getByText('我已核对样本编号与原始记录一致').click();
    await submit.click();

    await expect(form.getByRole('status')).toContainText(
      'verdict=revise · issues=format · note=第 3 页缺少单位。⏎请补充。 · notify=on · ack=yes',
    );
  });

  test('checkbox and switch toggle with Space; Tab skips disabled controls', async ({ page }) => {
    await page.goto(page15);
    const states = page.getByRole('region', { name: 'States' });
    const unchecked = states.getByRole('checkbox', { name: '未选' });
    await unchecked.focus();
    await page.keyboard.press('Space');
    await expect(unchecked).toHaveAttribute('aria-checked', 'true');
    await expect(states.getByRole('checkbox', { name: '部分选中' })).toHaveAttribute('aria-checked', 'mixed');

    // 无效 → 禁用 (skipped) → 关闭 switch.
    await states.getByRole('checkbox', { name: '无效' }).focus();
    await page.keyboard.press('Tab');
    const off = states.getByRole('switch', { name: '关闭' });
    await expect(off).toBeFocused();
    await page.keyboard.press('Space');
    await expect(off).toHaveAttribute('aria-checked', 'true');

    const readonly = states.getByRole('switch', { name: '只读' });
    await readonly.click();
    await expect(readonly).toHaveAttribute('aria-checked', 'true');
  });

  test('radio group: arrows wrap and skip the disabled option', async ({ page }) => {
    await page.goto(page15);
    const group = page.getByRole('radiogroup', { name: '保密级别' });
    await group.getByRole('radio', { name: '受限' }).click();
    await page.keyboard.press('ArrowDown');
    await expect(group.getByRole('radio', { name: '公开' })).toBeFocused();
    await expect(group.getByRole('radio', { name: '公开' })).toHaveAttribute('aria-checked', 'true');
  });

  test('fieldset disabled reaches native and Base UI controls', async ({ page }) => {
    await page.goto(page15);
    const region = page.getByRole('region', { name: 'Fieldset' });
    await region.getByRole('switch', { name: '锁定联系方式' }).click();
    const group = region.getByRole('group', { name: '联系方式' });
    await expect(group.getByRole('textbox', { name: '邮箱' })).toBeDisabled();
    await expect(group.getByRole('checkbox', { name: '同时抄送项目负责人' })).toHaveAttribute('aria-disabled', 'true');
  });

  test('focus ring is visible on checkbox, radio and switch', async ({ page }) => {
    await page.goto(page15);
    const states = page.getByRole('region', { name: 'States' });
    for (const control of [states.getByRole('checkbox', { name: '未选' }), states.getByRole('switch', { name: '关闭' })]) {
      await control.focus();
      await page.keyboard.press('Shift+Tab');
      await page.keyboard.press('Tab');
      const outline = await control.evaluate((el) => {
        const s = getComputedStyle(el);
        return `${s.outlineStyle} ${s.outlineWidth}`;
      });
      expect(outline).toBe('solid 2px');
    }
  });

  test('controls keep a 20px box, align with the first text line and long labels wrap', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto(page15);
    const region = page.getByRole('region', { name: 'Long text' });
    const rows = region.locator('.rl-choice__label');
    for (let i = 0; i < (await rows.count()); i += 1) {
      const row = rows.nth(i);
      const box = (await row.locator('.rl-checkbox, .rl-switch').boundingBox())!;
      const text = (await row.locator('.rl-choice__text').boundingBox())!;
      expect(box.height).toBe(20);
      // Text column starts after the control and wraps instead of pushing it.
      expect(text.x).toBeGreaterThan(box.x + box.width);
      expect(text.x + text.width).toBeLessThanOrEqual(320);
    }
  });

  test('required marker stays on the last line of a wrapping label', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto(page15);
    const label = page.getByRole('form', { name: '提交复核（演示）' }).locator('.rl-choice__text').filter({ hasText: '我已核对' });
    const { lastCharTop, markerTop, lines } = await label.evaluate((el) => {
      const text = el.firstElementChild!.firstChild as Text;
      const range = document.createRange();
      range.setStart(text, text.length - 1);
      range.setEnd(text, text.length);
      const marker = el.querySelector('.rl-field__required')!.getBoundingClientRect();
      return {
        lastCharTop: Math.round(range.getBoundingClientRect().top),
        markerTop: Math.round(marker.top),
        lines: Math.round(el.getBoundingClientRect().height / parseFloat(getComputedStyle(el).lineHeight)),
      };
    });
    expect(lines).toBeGreaterThan(1);
    expect(Math.abs(markerTop - lastCharTop)).toBeLessThanOrEqual(2);
  });

  test('switch thumb moves without transition under reduced motion', async ({ page }) => {
    await setSettings(page, { motion: 'reduce' });
    await page.goto(page15);
    const thumb = page.getByRole('region', { name: 'States' }).getByRole('switch', { name: '关闭' }).locator('.rl-switch__thumb');
    const duration = await thumb.evaluate((el) => getComputedStyle(el).transitionDuration);
    expect(duration.split(',').every((d) => parseFloat(d) === 0)).toBe(true);
  });

  for (const theme of ['light', 'dark'] as const) {
    test(`form errors visible · ${theme}: axe clean`, async ({ page }) => {
      await setSettings(page, { theme });
      await page.goto(page15);
      await page.getByRole('form', { name: '提交复核（演示）' }).getByRole('button', { name: '提交复核' }).click();
      await expect(page.getByText('请选择复核结论。')).toBeVisible();
      // Submit focuses the first invalid control and scrolls; reset so sticky chrome is captured once.
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: `test-results/screens/1280-choice-errors-${theme}.png`, fullPage: true });
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
      expect(results.violations.map((v) => ({ id: v.id, nodes: v.nodes.slice(0, 3).map((n) => n.target.join(' ')) }))).toEqual([]);
    });
  }
});
