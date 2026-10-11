import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { setSettings } from './helpers';

/**
 * ADR-0009 in a real browser: the English column (nested RhineProvider messages={enUS}
 * locale="en-US" lang="en" toasts) exposes no CJK text: not in visible text, not in accessible
 * names, not in popups. The zh-CN column keeps the built-in copy.
 */
test.use({ viewport: { width: 1280, height: 900 } });

const url = '/#/foundations/locale';
const CJK = /[\u3000-\u303f\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af\uff00-\uffef]/;

const english = (page: Page) => page.locator('.rl-theme[lang="en"]');
const chinese = (page: Page) => page.getByRole('region', { name: 'zh-CN · 默认文案' });

/** All text in the subtree (incl. visually hidden) plus every naming / value attribute. */
async function exposed(root: Locator): Promise<string[]> {
  return root.evaluate((el) => {
    const out = [el.textContent ?? ''];
    for (const node of el.querySelectorAll('*')) {
      for (const name of ['aria-label', 'aria-valuetext', 'aria-roledescription', 'placeholder', 'title', 'alt']) {
        const value = node.getAttribute(name);
        if (value) out.push(`${node.tagName.toLowerCase()}[${name}]=${value}`);
      }
    }
    return out;
  });
}

async function expectNoCjk(page: Page) {
  const root = english(page);
  const offenders = (await exposed(root)).flatMap((s) => s.split('\n')).filter((s) => CJK.test(s));
  expect(offenders).toEqual([]);
  // Names as the browser computes them (accessibility tree), for everything that is exposed.
  const snapshot = await root.ariaSnapshot();
  expect(snapshot.split('\n').filter((line) => CJK.test(line))).toEqual([]);
}

/** Accessible names of every interactive element in the English column. */
async function interactiveNames(page: Page) {
  const root = english(page);
  const names: string[] = [];
  for (const role of ['button', 'checkbox', 'combobox', 'link', 'textbox'] as const) {
    for (const el of await root.getByRole(role).all()) {
      names.push(await el.evaluate((node) => node.getAttribute('aria-label') ?? node.textContent ?? ''));
    }
  }
  return names;
}

const axe = async (page: Page) => {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  return results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
};

test.describe('Locale & messages', () => {
  test('English column: lang, English copy and locale-formatted numbers, no CJK anywhere', async ({ page }) => {
    await page.goto(url);
    await expect(english(page)).toHaveCount(1);
    await expect(english(page)).toHaveClass(/rl-theme/);
    // The app root keeps inheriting the document language.
    expect(await page.locator('.sc-app').getAttribute('lang')).toBeNull();

    const en = english(page);
    await expect(en.getByRole('navigation', { name: 'Pagination' })).toBeVisible();
    await expect(en.getByRole('navigation', { name: 'Pagination' }).getByRole('status')).toHaveText('51–75 of 1,000 items');
    // The half-width column is narrow enough for the compact pager (container query).
    await expect(en.locator('.rl-pagination__compact')).toHaveText('Page 3 of 40');
    await expect(en.locator('.rl-pagination__page[aria-current="page"]')).toHaveAttribute('aria-label', 'Page 3');
    await expect(en.getByRole('checkbox', { name: 'Select REC-001' })).toBeChecked();
    await expect(en.locator('.rl-table__selection')).toHaveText('2 selected (1 on other pages)');
    await expect(en.getByText('No matching records')).toBeVisible();
    await expect(en.locator('.rl-stat__number').first()).toHaveText('12,480');
    await expect(en.getByRole('progressbar').first()).toHaveAttribute('aria-valuetext', 'In progress');
    await expect(en.getByRole('meter')).toHaveAttribute('aria-valuetext', '86%, high');
    await expect(en.locator('.rl-field__optional').first()).toHaveText('(optional)');
    await expect(en.locator('.rl-textarea__count')).toHaveText('12 / 200 characters');
    await expect(en.getByRole('combobox')).toContainText('Select…');

    const names = await interactiveNames(page);
    expect(names.length).toBeGreaterThan(10);
    expect(names.filter((n) => CJK.test(n))).toEqual([]);
    await expectNoCjk(page);
  });

  test('English column: expanded breadcrumb, select popup, dialogs, drawer and toast stay English', async ({ page }) => {
    await page.goto(url);
    const en = english(page);

    await en.getByRole('button', { name: 'Show all 5 levels' }).click();
    await expect(en.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('listitem')).toHaveCount(5);

    await en.getByRole('checkbox', { name: 'Select all' }).check();
    await expect(en.getByRole('checkbox', { name: 'Deselect all' })).toBeChecked();
    await expectNoCjk(page);

    await en.getByRole('combobox').click();
    const listbox = page.getByRole('listbox');
    await expect(listbox).toBeVisible();
    // The popup portals into the English provider, so it inherits lang="en".
    expect(await listbox.evaluate((el) => el.closest('[lang]')?.getAttribute('lang'))).toBe('en');
    await expectNoCjk(page);
    await page.keyboard.press('Escape');
    await expect(listbox).toBeHidden();

    await en.getByRole('button', { name: 'Dismiss alert' }).click();
    await expect(en.getByRole('button', { name: 'Show the alert again' })).toBeFocused();

    await en.getByRole('button', { name: 'Delete record…' }).click();
    const dialog = page.getByRole('alertdialog', { name: 'Delete REC-001?' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Delete' }).click();
    await expect(dialog.getByRole('alert')).toHaveText('The action did not complete. Please try again.');
    await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeVisible();
    await expectNoCjk(page);
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog).toBeHidden();

    await en.getByRole('button', { name: 'View details' }).click();
    const drawer = page.getByRole('dialog', { name: 'REC-001' });
    await expect(drawer).toBeVisible();
    await expect(drawer.getByRole('button', { name: 'Close' })).toBeVisible();
    await expect(drawer.locator('.rl-meta__empty')).toHaveText(/Not recorded/);
    await expectNoCjk(page);
    await drawer.getByRole('button', { name: 'Close' }).click();
    await expect(drawer).toBeHidden();

    await en.getByRole('button', { name: 'Show toast' }).click();
    const toast = en.locator('.rl-toast');
    await expect(toast).toContainText('Record archived (sample)');
    // The English provider mounts its own queue (toasts), so the toast lives inside it.
    await expect(toast.locator('.rl-toast__close')).toHaveAttribute('aria-label', 'Dismiss notification');
    await expectNoCjk(page);
  });

  test('zh-CN column keeps the built-in copy', async ({ page }) => {
    await page.goto(url);
    const zh = chinese(page);
    await expect(zh.getByRole('navigation', { name: '分页' }).getByRole('status')).toHaveText('第 51–75 条，共 1000 条');
    await expect(zh.locator('.rl-pagination__compact')).toHaveText('第 3 / 40 页');
    await expect(zh.locator('.rl-pagination__page[aria-current="page"]')).toHaveAttribute('aria-label', '第 3 页');
    await expect(zh.getByRole('checkbox', { name: '选择 REC-001' })).toBeChecked();
    await expect(zh.getByRole('checkbox', { name: '全选' })).toBeVisible();
    await expect(zh.locator('.rl-table__selection')).toHaveText('已选 2 条（其中 1 条在其他页）');
    await expect(zh.getByText('没有符合条件的记录')).toBeVisible();
    await expect(zh.getByRole('button', { name: '显示全部 5 级路径' })).toBeVisible();
    await expect(zh.getByRole('navigation', { name: '路径' })).toBeVisible();
    await expect(zh.getByRole('progressbar').first()).toHaveAttribute('aria-valuetext', '进行中');
    await expect(zh.getByRole('meter')).toHaveAttribute('aria-valuetext', '86%，偏高');
    await expect(zh.locator('.rl-field__optional').first()).toHaveText('（可选）');
    await expect(zh.locator('.rl-textarea__count')).toHaveText('已输入 5 / 200');
    await expect(zh.getByRole('combobox')).toContainText('请选择');
    await expect(zh.getByRole('button', { name: '关闭提示' })).toBeVisible();

    // Its toast goes to the app's queue, with the Chinese close label.
    await zh.getByRole('button', { name: '显示通知' }).click();
    const appToast = page.locator('.sc-app > .rl-portal .rl-toast');
    await expect(appToast).toContainText('记录已归档（示例）');
    await expect(appToast.locator('.rl-toast__close')).toHaveAttribute('aria-label', '关闭通知');
  });

  for (const theme of ['light', 'dark'] as const) {
    test(`axe · ${theme}: no WCAG 2.2 A/AA violations, incl. the English drawer and toast`, async ({ page }) => {
      await setSettings(page, { theme });
      await page.goto(url);
      await expect(page.locator('h1')).toBeVisible();
      expect(await axe(page)).toEqual([]);

      const en = english(page);
      await en.getByRole('button', { name: 'Show toast' }).click();
      await expect(en.locator('.rl-toast')).toBeVisible();
      expect(await axe(page)).toEqual([]);

      await en.getByRole('button', { name: 'View details' }).click();
      await expect(page.getByRole('dialog', { name: 'REC-001' })).toBeVisible();
      expect(await axe(page)).toEqual([]);
    });
  }
});
