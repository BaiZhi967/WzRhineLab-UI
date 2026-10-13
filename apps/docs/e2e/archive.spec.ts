import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { setSettings } from './helpers';

/** M3: archive patterns and the three ROADMAP acceptance scenarios, in a real browser. */
test.use({ viewport: { width: 1280, height: 900 } });

const axe = async (page: Page) => {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  return results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
};

test.describe('Archive patterns page', () => {
  test('record header: breadcrumb nav, heading, status text, meta as a description list', async ({ page }) => {
    await page.goto('/#/archive');
    const card = page.getByRole('region', { name: 'RecordHeader' });
    const nav = card.getByRole('navigation', { name: '档案位置' });
    await expect(nav.getByRole('link', { name: '档案' })).toHaveAttribute('href', '#/archive');
    await expect(nav.getByText('ARC-1024')).toHaveAttribute('aria-current', 'page');
    await expect(card.getByRole('heading', { level: 2, name: '晶体结构观测流程' })).toBeVisible();
    await expect(card.getByText('审核中')).toBeVisible();
    await expect(card.locator('dl dt')).toHaveText(['创建', '更新', '负责人']);
  });

  test('metadata playground hides empty values unless placeholder mode is on', async ({ page }) => {
    await page.goto('/#/archive');
    const pg = page.getByRole('region', { name: 'MetadataList' }).first();
    const list = pg.locator('.sc-playground__canvas dl');
    await expect(list.getByText('访问级别')).toHaveCount(0);
    await pg.getByRole('checkbox', { name: 'empty="placeholder"' }).check();
    await expect(list.getByText('访问级别')).toBeVisible();
    await expect(list.locator('dd[data-empty]')).toContainText('未记录');
  });

  test('metadata columns: never more than requested, never narrower than a readable minimum', async ({ page }) => {
    await page.goto('/#/archive');
    const pg = page.getByRole('region', { name: 'MetadataList' }).first();
    const list = pg.locator('.sc-playground__canvas dl');
    const measure = () =>
      list.evaluate((el) => {
        const tracks = getComputedStyle(el).gridTemplateColumns.split(' ').map(parseFloat);
        return { count: tracks.length, min: Math.min(...tracks), width: el.getBoundingClientRect().width };
      });
    await pg.getByRole('radio', { name: 'stacked' }).check();
    await pg.getByRole('radio', { name: '3', exact: true }).check();
    const wide = await measure();
    expect(wide.count).toBeGreaterThan(1);
    expect(wide.count).toBeLessThanOrEqual(3);
    expect(wide.min).toBeGreaterThanOrEqual(200);
    await pg.getByRole('radio', { name: '1', exact: true }).check();
    expect((await measure()).count).toBe(1);
    await pg.getByRole('radio', { name: '3', exact: true }).check();
    await pg.getByRole('radio', { name: '320' }).check();
    expect((await measure()).count).toBe(1);
    await pg.getByRole('radio', { name: 'inline' }).check();
    await pg.getByRole('radio', { name: '自适应' }).check();
    const inline = await measure();
    expect(inline.min).toBeGreaterThanOrEqual(Math.min(320, inline.width));
  });

  test('archive cards: one named control each, selection via aria-pressed', async ({ page }) => {
    await page.goto('/#/archive');
    const list = page.getByRole('list', { name: '档案卡片示例' });
    const card = list.getByRole('button', { name: '北坡采样外勤报告' });
    await expect(card).toHaveAccessibleDescription(/2026-10-09/);
    await expect(card).toHaveAccessibleDescription(/需复核/);
    await card.focus();
    await page.keyboard.press('Enter');
    await expect(card).toHaveAttribute('aria-pressed', 'true');
    await expect(list.getByRole('article', { name: '仅有编号与标题的记录' })).toBeVisible();
  });

  test('status pulse animation is off under reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/#/archive/scenarios');
    await expect(page.locator('.rl-theme')).toBeVisible();
    await page.evaluate(() => {
      const el = document.createElement('span');
      el.className = 'rl-status';
      el.dataset.pulse = 'true';
      el.innerHTML = '<span class="rl-status__marker"></span>';
      document.querySelector('.rl-theme')!.appendChild(el);
    });
    const anim = await page.locator('.rl-status[data-pulse] .rl-status__marker').last().evaluate((el) => getComputedStyle(el, '::after').animationName);
    expect(anim).toBe('none');
  });
});

test.describe('Scenario · 档案检索', () => {
  test('search and filters narrow results; count is derived from data', async ({ page }) => {
    await page.goto('/#/archive/scenarios');
    const pane = page.getByRole('region', { name: '档案检索' });
    await expect(pane.getByText('7 / 7 条')).toBeVisible();
    await pane.getByRole('searchbox', { name: /搜索编号/ }).fill('地质');
    await expect(pane.getByText('2 / 7 条')).toBeVisible();
    await pane.getByRole('combobox', { name: '状态' }).click();
    await page.getByRole('option', { name: '需复核' }).click();
    await expect(pane.getByText('1 / 7 条')).toBeVisible();
    await expect(pane.getByRole('list', { name: '检索结果' }).getByRole('button')).toHaveText(/北坡采样外勤报告/);
    await pane.getByRole('searchbox', { name: /搜索编号/ }).fill('不存在的记录');
    await expect(pane.getByText('没有符合条件的记录。')).toBeVisible();
  });

  test('selecting a card updates the detail pane header and metadata', async ({ page }) => {
    await page.goto('/#/archive/scenarios');
    await page.getByRole('list', { name: '检索结果' }).getByRole('button', { name: '沉积岩样本 #7' }).click();
    const detail = page.getByRole('region', { name: '记录详情' });
    await expect(detail.getByRole('heading', { level: 2, name: '沉积岩样本 #7' })).toBeVisible();
    await expect(detail.getByRole('navigation', { name: '档案位置' })).toContainText('ARC-1031');
    await expect(detail.locator('dl')).toContainText('样本库 · B 区');
    await expect(detail.getByRole('button', { name: '更多操作' })).toBeVisible();
  });

  test('table view: sort by id, select rows, export reports the count', async ({ page }) => {
    await page.goto('/#/archive/scenarios');
    const pane = page.getByRole('region', { name: '档案检索' });
    await pane.getByRole('tab', { name: /表格/ }).click();
    const table = pane.getByRole('table', { name: '检索结果' });
    await expect(table).toBeVisible();
    const updated = table.getByRole('columnheader', { name: '更新' });
    await expect(updated).toHaveAttribute('aria-sort', 'descending');
    await table.getByRole('button', { name: '编号' }).click();
    await expect(table.getByRole('columnheader', { name: '编号' })).toHaveAttribute('aria-sort', 'ascending');
    await expect(table.getByRole('rowheader').first()).toHaveText('ARC-1024');
    const exportBtn = pane.getByRole('button', { name: /导出所选/ });
    await expect(exportBtn).toBeDisabled();
    await table.getByRole('checkbox', { name: '选择 沉积岩样本 #7' }).check();
    await table.getByRole('checkbox', { name: '选择 低温保存操作规程' }).check();
    await expect(exportBtn).toHaveText('导出所选（2）');
    await exportBtn.click();
    await expect(page.locator('.rl-toast').filter({ hasText: '已导出 2 条记录' })).toBeVisible();
  });

  test('table scrolls inside its region at 390px; page does not overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/#/archive/scenarios');
    await page.getByRole('region', { name: '档案检索' }).getByRole('tab', { name: /表格/ }).click();
    const region = page.getByRole('region', { name: '检索结果' });
    const { sw, cw } = await region.evaluate((el) => ({ sw: el.scrollWidth, cw: el.clientWidth }));
    expect(sw).toBeGreaterThan(cw);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    await page.screenshot({ path: 'test-results/screens/390-scenario-search-table.png', fullPage: true });
  });

  test('narrow layout: a card opens the detail in a Drawer; closing returns focus to the card', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/#/archive/scenarios');
    // No stacked detail pane under the list in the one-column layout.
    await expect(page.getByRole('region', { name: '记录详情' })).toHaveCount(0);
    const card = page.getByRole('list', { name: '检索结果' }).getByRole('button', { name: '沉积岩样本 #7' });
    await card.click();
    const drawer = page.getByRole('dialog', { name: '沉积岩样本 #7' });
    await expect(drawer).toBeVisible();
    await expect(drawer.getByRole('navigation', { name: '档案位置' })).toContainText('ARC-1031');
    await expect(drawer.locator('dl')).toContainText('样本库 · B 区');
    await expect(drawer.getByRole('button', { name: '更多操作' })).toBeVisible();
    // Bottom sheet below 40rem.
    await expect(drawer).toHaveAttribute('data-swipe-direction', 'down');
    await expect.poll(() => drawer.evaluate((el) => el.contains(document.activeElement))).toBe(true);
    await page.screenshot({ path: 'test-results/screens/390-scenario-search-drawer.png' });
    await drawer.getByRole('button', { name: '关闭' }).click();
    await expect(drawer).toBeHidden();
    await expect(card).toBeFocused();
    await expect(card).toHaveAttribute('aria-pressed', 'true');
  });

  test('narrow table view: 查看 opens the drawer; Escape returns focus to that button', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 900 });
    await page.goto('/#/archive/scenarios');
    await page.getByRole('region', { name: '档案检索' }).getByRole('tab', { name: /表格/ }).click();
    const row = page.getByRole('table', { name: '检索结果' }).getByRole('row').filter({ hasText: '低温保存操作规程' });
    const view = row.getByRole('button', { name: '查看' });
    await view.click();
    const drawer = page.getByRole('dialog', { name: '低温保存操作规程' });
    await expect(drawer).toBeVisible();
    // 768 is above 40rem: a side panel on the right edge.
    await expect(drawer).toHaveAttribute('data-swipe-direction', 'right');
    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden();
    await expect(view).toBeFocused();
  });
});

test.describe('Scenario · 实验监测', () => {
  test('steps advance only by operator action; status and timeline follow', async ({ page }) => {
    await page.goto('/#/archive/scenarios');
    await page.getByRole('tab', { name: '实验监测' }).click();
    const steps = page.getByRole('region', { name: '规程步骤' });
    await expect(steps.getByRole('status')).toContainText('未开始');
    await expect(page.getByText('尚未完成任何步骤。')).toBeVisible();
    await page.waitForTimeout(1500);
    await expect(steps.getByRole('status')).toContainText('0 / 5 步');

    await steps.getByRole('textbox', { name: /步骤备注/ }).fill('编号核对无误');
    await steps.getByRole('button', { name: '完成「样本登记」' }).click();
    await expect(steps.getByRole('status')).toContainText('进行中');
    await expect(steps.getByRole('status')).toContainText('1 / 5 步');
    await expect(steps.locator('[aria-current="step"]')).toContainText('预处理');
    const timeline = page.getByRole('list', { name: '操作时间线' });
    await expect(timeline.getByRole('listitem')).toHaveCount(1);
    await expect(timeline).toContainText('编号核对无误');
    const dt = await timeline.locator('time').first().getAttribute('datetime');
    expect(dt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
  });

  test('completing all steps finishes the flow; reset asks for confirmation', async ({ page }) => {
    await page.goto('/#/archive/scenarios');
    await page.getByRole('tab', { name: '实验监测' }).click();
    const steps = page.getByRole('region', { name: '规程步骤' });
    for (let i = 0; i < 5; i += 1) await steps.getByRole('button', { name: /^完成「/ }).click();
    await expect(steps.getByRole('status')).toContainText('已完成');
    await expect(steps.getByRole('button', { name: '流程已完成' })).toBeDisabled();
    await expect(page.locator('.rl-toast').filter({ hasText: '流程已完成' })).toBeVisible();
    await steps.getByRole('button', { name: '重置' }).click();
    const dialog = page.getByRole('alertdialog', { name: '重置演示流程？' });
    await expect(dialog).toHaveAccessibleDescription('将清空已完成的步骤与时间线。');
    // Destructive confirmation: focus starts on the safe choice.
    await expect.poll(() => dialog.getByRole('button', { name: '取消' }).evaluate((el) => el === document.activeElement)).toBe(true);
    await dialog.getByRole('button', { name: '重置' }).click();
    await expect(steps.getByRole('status')).toContainText('未开始');
    await expect(page.getByText('尚未完成任何步骤。')).toBeVisible();
  });
});

test.describe('Scenario · 设置表单', () => {
  test('invalid submit shows field errors, jumps to the failing tab and announces the count', async ({ page }) => {
    await page.goto('/#/archive/scenarios');
    await page.getByRole('tab', { name: '设置表单' }).click();
    const form = page.getByRole('form', { name: '档案设置' });
    const save = form.getByRole('button', { name: '保存设置' });
    await expect(save).toBeDisabled();
    await form.getByRole('tab', { name: '档案规则' }).click();
    const prefix = form.getByRole('textbox', { name: /编号前缀/ });
    await prefix.fill('a1');
    await expect(prefix).toHaveValue('A1');
    await form.getByRole('tab', { name: '常规' }).click();
    await save.click();
    await expect(form.getByRole('tab', { name: /档案规则/ })).toHaveAttribute('aria-selected', 'true');
    await expect(prefix).toHaveAttribute('aria-invalid', 'true');
    await expect(prefix).toHaveAccessibleDescription(/2–5 个大写字母/);
    await expect(form.getByRole('status').first()).toContainText('1 项错误');
    await expect(page.getByRole('alert').filter({ hasText: '有 1 项需要修正' })).toBeAttached();
  });

  test('valid change saves with loading, updates the summary and clears dirty state', async ({ page }) => {
    await page.goto('/#/archive/scenarios');
    await page.getByRole('tab', { name: '设置表单' }).click();
    const form = page.getByRole('form', { name: '档案设置' });
    await form.getByRole('tab', { name: '档案规则' }).click();
    await form.getByRole('textbox', { name: /编号前缀/ }).fill('LAB');
    await expect(form.getByRole('status').first()).toContainText('有未保存的更改');
    const save = form.getByRole('button', { name: '保存设置' });
    await save.click();
    await expect(save).toHaveAttribute('aria-busy', 'true');
    await expect(page.locator('.rl-toast').filter({ hasText: '设置已保存' })).toBeVisible({ timeout: 4000 });
    await expect(form.getByRole('status').first()).toContainText('已保存');
    await form.getByRole('tab', { name: '概览' }).click();
    await expect(form.locator('dl')).toContainText('LAB-0001');
    await expect(form.locator('dl dd[data-empty]').first()).toContainText('未记录');
  });

  test('choice controls: switch, radio, checkbox group cross-validation and textarea reach the summary', async ({ page }) => {
    await page.goto('/#/archive/scenarios');
    await page.getByRole('tab', { name: '设置表单' }).click();
    const form = page.getByRole('form', { name: '档案设置' });
    const reminders = form.getByRole('group', { name: /邮件提醒/ });
    await reminders.getByRole('checkbox', { name: '每周摘要' }).click();
    await form.getByRole('textbox', { name: /记录页脚/ }).fill('示例机构\n仅供演示');
    await form.getByRole('button', { name: '保存设置' }).click();
    // Reminders need a contact address: the group shows its error and the save is blocked.
    await expect(reminders).toHaveAttribute('data-invalid', '');
    await expect(reminders).toHaveAccessibleDescription(/开启提醒需要先填写联系邮箱/);
    await expect(reminders.getByRole('checkbox', { name: '每周摘要' })).toHaveAttribute('aria-invalid', 'true');
    await form.getByRole('textbox', { name: /联系邮箱/ }).fill('lab@example.org');

    await form.getByRole('tab', { name: '档案规则' }).click();
    const visibility = form.getByRole('radiogroup', { name: '新建记录默认可见范围' });
    await visibility.getByRole('radio', { name: '内部' }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(visibility.getByRole('radio', { name: '受限' })).toHaveAttribute('aria-checked', 'true');
    const review = form.getByRole('switch', { name: '启用双人复核' });
    await expect(review).toHaveAttribute('aria-checked', 'true');
    await review.press('Space');
    await expect(review).toHaveAttribute('aria-checked', 'false');

    await form.getByRole('button', { name: '保存设置' }).click();
    await expect(page.locator('.rl-toast').filter({ hasText: '设置已保存' })).toBeVisible({ timeout: 4000 });
    await form.getByRole('tab', { name: '概览' }).click();
    const summary = form.locator('dl');
    await expect(summary).toContainText('受限');
    await expect(summary).toContainText('关闭');
    await expect(summary).toContainText('每周摘要');
    await expect(summary).toContainText('仅供演示');
  });

  test('discard asks for confirmation and restores saved values', async ({ page }) => {
    await page.goto('/#/archive/scenarios');
    await page.getByRole('tab', { name: '设置表单' }).click();
    const form = page.getByRole('form', { name: '档案设置' });
    const name = form.getByRole('textbox', { name: /实验室名称/ });
    await name.fill('临时名称');
    await form.getByRole('button', { name: '放弃更改' }).click();
    const dialog = page.getByRole('alertdialog', { name: '放弃未保存的更改？' });
    await expect.poll(() => dialog.getByRole('button', { name: '继续编辑' }).evaluate((el) => el === document.activeElement)).toBe(true);
    await dialog.getByRole('button', { name: '继续编辑' }).click();
    await expect(name).toHaveValue('临时名称');
    await form.getByRole('button', { name: '放弃更改' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: '放弃更改' }).click();
    await expect(name).toHaveValue('示例实验室');
  });
});

test.describe('Archive accessibility', () => {
  for (const theme of ['light', 'dark'] as const) {
    for (const scenario of ['档案检索', '实验监测', '设置表单'] as const) {
      test(`${scenario} · ${theme}: axe clean`, async ({ page }) => {
        await setSettings(page, { theme });
        await page.goto('/#/archive/scenarios');
        await page.getByRole('tab', { name: scenario }).click();
        await expect(page.getByRole('tabpanel', { name: scenario })).toBeVisible();
        if (scenario === '档案检索') await page.getByRole('region', { name: '档案检索' }).getByRole('tab', { name: /表格/ }).click();
        await page.screenshot({ path: `test-results/screens/1280-scenario-${scenario}-${theme}.png`, fullPage: true });
        expect(await axe(page)).toEqual([]);
      });
    }
  }
});
