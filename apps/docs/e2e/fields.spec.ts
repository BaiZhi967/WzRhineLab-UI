import { expect, test } from '@playwright/test';
import { setSettings } from './helpers';

test.use({ viewport: { width: 1280, height: 900 } });

test.describe('Field & Input in a real browser', () => {
  test('validation flow: blur error, fix, submit with loading, no double submit', async ({ page }) => {
    await page.goto('/#/components/field');
    const form = page.getByRole('form', { name: '新建样本记录（演示）' });
    const id = form.getByRole('textbox', { name: '档案编号' });
    const name = form.getByRole('textbox', { name: '样本名称' });

    await id.fill('abc');
    await id.press('Tab');
    await expect(id).toHaveAttribute('aria-invalid', 'true');
    await expect(id).toHaveAccessibleDescription(/格式应为 ARC 加四位数字/);
    await expect(form.locator('.rl-field__error').first()).toBeVisible();

    await id.fill('ARC-1024');
    await id.press('Tab');
    await expect(id).not.toHaveAttribute('aria-invalid');

    await name.fill('示例样本');
    const submit = form.getByRole('button', { name: '保存记录' });
    await submit.click();
    await expect(submit).toHaveAttribute('aria-busy', 'true');
    await submit.click();
    await expect(form.getByRole('status')).toContainText('ARC-1024', { timeout: 4000 });
  });

  test('required field reports valueMissing after edit-and-clear', async ({ page }) => {
    await page.goto('/#/components/field');
    const name = page.getByRole('form').getByRole('textbox', { name: '样本名称' });
    await name.fill('x');
    await name.fill('');
    await name.press('Tab');
    await expect(name).toHaveAttribute('aria-invalid', 'true');
    await expect(name).toHaveAccessibleDescription(/请填写样本名称/);
  });

  test('readOnly is focusable, disabled is skipped', async ({ page }) => {
    await page.goto('/#/components/field');
    const states = page.getByRole('region', { name: 'States' });
    const readonly = states.getByRole('textbox', { name: '只读' });
    await readonly.focus();
    await expect(readonly).toBeFocused();
    await expect(readonly).not.toBeEditable();
    await page.keyboard.press('Tab');
    await expect(states.getByRole('textbox', { name: '禁用' })).not.toBeFocused();
    await expect(states.getByRole('textbox', { name: '禁用' })).toBeDisabled();
  });

  test('focus ring wraps the input including adornments', async ({ page }) => {
    await page.goto('/#/components/field');
    const search = page.getByRole('searchbox', { name: '搜索档案' });
    await search.focus();
    const wrapper = search.locator('xpath=..');
    const outline = await wrapper.evaluate((el) => {
      const s = getComputedStyle(el);
      return `${s.outlineStyle} ${s.outlineWidth}`;
    });
    expect(outline).toBe('solid 2px');
  });

  test('suffix unit is part of the accessible description', async ({ page }) => {
    await page.goto('/#/components/field');
    await expect(page.getByRole('textbox', { name: '温度' })).toHaveAccessibleDescription(/°C/);
  });

  test('invalid field remains distinguishable in dark theme', async ({ page }) => {
    await setSettings(page, { theme: 'dark' });
    await page.goto('/#/components/field');
    const input = page.getByRole('region', { name: 'States' }).getByRole('textbox', { name: '无效' });
    const color = await input.locator('xpath=..').evaluate((el) => getComputedStyle(el).borderColor);
    expect(color).toBe('rgb(255, 156, 147)');
  });
});

test.describe('IconButton in a real browser', () => {
  test('toolbar toggle exposes aria-pressed and every button has a name', async ({ page }) => {
    await page.goto('/#/components/icon-button');
    const toolbar = page.getByRole('toolbar', { name: '档案列表工具' });
    const buttons = toolbar.getByRole('button');
    await expect(buttons).toHaveCount(4);
    for (const b of await buttons.all()) {
      expect((await b.getAttribute('aria-label'))?.length).toBeGreaterThan(0);
    }
    const grid = toolbar.getByRole('button', { name: '网格视图' });
    await expect(grid).toHaveAttribute('aria-pressed', 'true');
    await grid.focus();
    await page.keyboard.press('Enter');
    await expect(grid).toHaveAttribute('aria-pressed', 'false');
  });

  test('hit area matches control height, not icon size', async ({ page }) => {
    await page.goto('/#/components/icon-button');
    const sm = page.getByRole('button', { name: '导出（ghost sm）' });
    const box = await sm.boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(32);
    expect(box!.height).toBeGreaterThanOrEqual(32);
  });

  test('showcase menu button is a library IconButton on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/#/');
    await expect(page.getByRole('button', { name: '打开导航' })).toHaveClass(/rl-icon-button/);
  });
});
