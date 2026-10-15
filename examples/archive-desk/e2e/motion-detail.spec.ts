import { expect, test } from '@playwright/test';

for (const reducedMotion of ['no-preference', 'reduce'] as const) {
  test(`detail identity updates immediately without stealing focus · ${reducedMotion}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion });
    await page.goto('/');
    const detail = page.getByLabel('记录详情', { exact: true });
    const second = page.getByRole('button', { name: '查看 ARC-0002', exact: true });
    await second.focus();
    await page.keyboard.press('Enter');
    await expect(detail.getByRole('navigation', { name: '记录位置' })).toContainText('ARC-0002');
    await expect(second).toBeFocused();
    await page.getByRole('button', { name: '查看 ARC-0003', exact: true }).click();
    await page.getByRole('button', { name: '查看 ARC-0001', exact: true }).click();
    await expect(detail.getByRole('navigation', { name: '记录位置' })).toContainText('ARC-0001');
    await expect(detail.getByRole('heading', { level: 2 })).toHaveCount(1);
    await expect(detail.getByRole('button', { name: 'ARC-0001 的更多操作' })).toHaveCount(1);
    await expect(detail.getByRole('button', { name: 'ARC-0002 的更多操作' })).toHaveCount(0);
    await expect(detail.getByRole('button', { name: 'ARC-0003 的更多操作' })).toHaveCount(0);
    if (reducedMotion === 'reduce') {
      await expect.poll(async () => detail.evaluate((el) => el.getAnimations({ subtree: true }).filter((a) => a.playState === 'running').length), { timeout: 500 }).toBe(0);
    }
  });
}
