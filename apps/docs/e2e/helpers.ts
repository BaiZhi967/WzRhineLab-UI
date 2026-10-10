import type { Page } from '@playwright/test';

export const routes = [
  { name: 'overview', hash: '/#/' },
  { name: 'foundations', hash: '/#/foundations' },
  { name: 'button', hash: '/#/components/button' },
  { name: 'icon-button', hash: '/#/components/icon-button' },
  { name: 'surface', hash: '/#/components/surface' },
  { name: 'status-badge', hash: '/#/components/status-badge' },
  { name: 'text', hash: '/#/components/text' },
  { name: 'field', hash: '/#/components/field' },
  { name: 'choice', hash: '/#/components/choice' },
  { name: 'motion', hash: '/#/motion' },
  { name: 'effects', hash: '/#/motion/effects' },
  { name: 'tabs', hash: '/#/components/tabs' },
  { name: 'tooltip', hash: '/#/components/tooltip' },
  { name: 'dialog', hash: '/#/components/dialog' },
  { name: 'select', hash: '/#/components/select' },
  { name: 'popover', hash: '/#/components/popover' },
  { name: 'menu', hash: '/#/components/menu' },
  { name: 'toast', hash: '/#/components/toast' },
  { name: 'archive', hash: '/#/archive' },
  { name: 'scenarios', hash: '/#/archive/scenarios' },
] as const;

export const widths = [320, 390, 768, 1280, 1920] as const;

export interface ShowcaseSettings {
  theme?: 'light' | 'dark' | 'system';
  density?: 'comfortable' | 'compact';
  motion?: 'user' | 'reduce';
}

/** Seed persisted showcase settings before the app boots. */
export async function setSettings(page: Page, settings: ShowcaseSettings) {
  const value = JSON.stringify({ theme: 'light', density: 'comfortable', motion: 'user', ...settings });
  await page.addInitScript((v) => window.localStorage.setItem('wzrhine-showcase:settings', v), value);
}

/** Elements wider than the viewport, excluding intentional horizontal scrollers. */
export async function findHorizontalOverflow(page: Page) {
  return page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const offenders: string[] = [];
    for (const el of Array.from(document.querySelectorAll<HTMLElement>('body *'))) {
      // Intentional inner scrollers: tables, code, overflowing tab lists, and the closed drawer.
      if (el.closest('.sc-table-wrap, .rl-table-scroll, .sc-code pre, .rl-tabs__list, .sc-sidebar[data-hidden]')) continue;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      if (rect.right > vw + 1 || rect.left < -1) {
        offenders.push(`${el.tagName.toLowerCase()}.${[...el.classList].join('.')} → ${Math.round(rect.left)}..${Math.round(rect.right)}`);
      }
    }
    return {
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: vw,
      offenders: offenders.slice(0, 10),
    };
  });
}
