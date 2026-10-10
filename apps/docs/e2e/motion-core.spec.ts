import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { setSettings } from './helpers';
import { setPageHidden } from './motion-helpers';

/**
 * M10 interrupt and lifecycle guarantees in a real browser. Every assertion samples the page on
 * requestAnimationFrame, and the triggering clicks run inside the same evaluate, so the samples
 * see the animation mid-flight instead of only its start and end (a Playwright round-trip per
 * frame is slower than a 200ms transition).
 */
test.use({ viewport: { width: 1280, height: 900 } });
test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
});

const settle = (page: Page) => page.waitForTimeout(400);

test.describe('interrupts', () => {
  test('Dialog: open → Escape → reopen mid-exit keeps one popup, reverses from the current opacity, focus inside', async ({ page }) => {
    await page.goto('/#/components/dialog');
    const trigger = page.getByRole('button', { name: '归档记录…' });
    await expect(trigger).toBeVisible();
    await settle(page);
    const r = await trigger.evaluate(async (button) => {
      const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));
      const frames: { t: number; n: number; o: number }[] = [];
      let stop = false;
      const t0 = performance.now();
      const loop = () => {
        const pops = document.querySelectorAll('.rl-dialog');
        frames.push({ t: performance.now() - t0, n: pops.length, o: pops[0] ? Number(getComputedStyle(pops[0]).opacity) : -1 });
        if (!stop) requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
      (button as HTMLElement).click();
      await sleep(240);
      document.activeElement!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      // Wait until the exit is visibly under way, then reopen while it is still running.
      const exitStart = performance.now();
      while (performance.now() - exitStart < 1000) {
        const pop = document.querySelector('.rl-dialog');
        if (!pop || Number(getComputedStyle(pop).opacity) < 0.7) break;
        await new Promise((res) => requestAnimationFrame(res));
      }
      const pop = document.querySelector('.rl-dialog');
      const atReopen = pop ? Number(getComputedStyle(pop).opacity) : -1;
      const reopenT = performance.now() - t0;
      (button as HTMLElement).click();
      await sleep(700);
      stop = true;
      // The exiting popup is taken back, not replaced by a fresh one that starts from opacity 0.
      const sameNode = pop !== null && document.querySelector('.rl-dialog') === pop;
      return { frames, atReopen, reopenT, sameNode };
    });
    // Reopened while the old popup was still fading out (not after it was gone).
    expect(r.atReopen).toBeGreaterThan(0);
    expect(r.atReopen).toBeLessThan(1);
    // Never two popups on any frame.
    expect(Math.max(...r.frames.map((f) => f.n))).toBe(1);
    // After the reopen the popup is never unmounted: the same element reverses from its current
    // opacity (it may fade a little further for a frame before React commits under load) up to 1.
    const after = r.frames.filter((f) => f.t > r.reopenT);
    expect(after.every((f) => f.n === 1)).toBe(true);
    expect(r.sameNode).toBe(true);
    expect(Math.min(...after.map((f) => f.o))).toBeGreaterThan(0);
    expect(after.at(-1)!.o).toBe(1);
    const dialog = page.getByRole('dialog', { name: '确认归档' });
    await expect(dialog).toBeVisible();
    await expect.poll(() => dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true);
    await page.getByRole('button', { name: '取消' }).click();
    await expect(page.locator('.rl-dialog')).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });

  test('Popover: open → close → open in quick succession leaves one open popup with focus inside', async ({ page }) => {
    await page.goto('/#/components/popover');
    const trigger = page.getByRole('region', { name: 'Popover' }).first().getByRole('button', { name: '筛选…' });
    await expect(trigger).toBeVisible();
    await settle(page);
    const counts = await trigger.evaluate(async (button) => {
      const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));
      const n: number[] = [];
      let stop = false;
      const loop = () => {
        n.push(document.querySelectorAll('.rl-popover').length);
        if (!stop) requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
      (button as HTMLElement).click();
      await sleep(60);
      (button as HTMLElement).click();
      await sleep(30);
      (button as HTMLElement).click();
      await sleep(400);
      stop = true;
      return n;
    });
    expect(Math.max(...counts)).toBe(1);
    expect(counts.at(-1)).toBe(1);
    const popup = page.getByRole('dialog', { name: '筛选条件' });
    await expect(popup).toBeVisible();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect.poll(() => popup.evaluate((el) => el.contains(document.activeElement))).toBe(true);
    await page.keyboard.press('Escape');
    await expect(popup).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('Toast: dismissed mid-enter leaves from where it is (continuous, no jump) and leaves no ghost', async ({ page }) => {
    await page.goto('/#/components/toast');
    const show = page.getByRole('button', { name: '显示通知' });
    await expect(show).toBeVisible();
    await settle(page);
    // Precondition: the dismiss must land mid-enter. On a heavily loaded runner a frame can be longer
    // than the whole enter, so try again (after the previous toast is gone) until it does.
    const attempt = () => show.evaluate(async (button) => {
      const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));
      const ty = (el: Element) => new DOMMatrixReadOnly(getComputedStyle(el).transform).m42;
      const frames: { t: number; n: number; y: number }[] = [];
      let stop = false;
      const t0 = performance.now();
      const loop = () => {
        const toasts = document.querySelectorAll('.rl-toast');
        frames.push({ t: performance.now() - t0, n: toasts.length, y: toasts[0] ? ty(toasts[0]) : NaN });
        if (!stop) requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
      (button as HTMLElement).click();
      // Dismiss once the toast has visibly started to rise but is still well short of its rest position.
      let start = NaN;
      const begin = performance.now();
      while (performance.now() - begin < 1000) {
        await new Promise((res) => requestAnimationFrame(res));
        const toast = document.querySelector('.rl-toast');
        if (!toast) continue;
        const y = ty(toast);
        if (Number.isNaN(start)) start = y;
        if (y < start * 0.8 && y > 2) break;
      }
      const toast = document.querySelector('.rl-toast')!;
      const atClose = ty(toast);
      const closeT = performance.now() - t0;
      (toast.querySelector('.rl-toast__close') as HTMLElement).click();
      // The exit is a CSS transition on transform; read it directly once Base UI marks the toast ending.
      let exitTransition: { duration: number } | null = null;
      const waitExit = performance.now();
      while (performance.now() - waitExit < 300 && !exitTransition) {
        await new Promise((res) => requestAnimationFrame(res));
        const el = document.querySelector('.rl-toast[data-ending-style]');
        const anim = el
          ?.getAnimations()
          .find((a) => (a as CSSTransition).transitionProperty === 'transform') as CSSTransition | undefined;
        if (el && anim) {
          const timing = anim.effect!.getComputedTiming();
          exitTransition = { duration: Number(timing.duration) };
        }
      }
      await sleep(800);
      stop = true;
      return { frames, start, atClose, closeT, exitTransition, left: document.querySelectorAll('.rl-toast').length };
    });
    let r = await attempt();
    for (let i = 0; i < 4 && !(r.atClose > 2 && r.atClose < r.start); i += 1) {
      await expect(page.locator('.rl-toast')).toHaveCount(0, { timeout: 8000 });
      r = await attempt();
    }
    // Dismissed mid-enter: between the off-screen start and the rest position.
    expect(r.atClose).toBeGreaterThan(2);
    expect(r.atClose).toBeLessThan(r.start);
    const exit = r.frames.filter((f) => f.t > r.closeT && f.n > 0);
    // Base UI applies data-ending-style a frame after the click; Firefox can keep rising for a frame
    // or two before the exit takes over. From the reversal on, the exit is monotonic.
    const turn = Math.max(0, exit.findIndex((f, i) => i > 0 && f.y > exit[i - 1]!.y + 0.5) - 1);
    for (let i = turn + 1; i < exit.length; i += 1) expect(exit[i]!.y).toBeGreaterThanOrEqual(exit[i - 1]!.y - 0.5);
    // It leaves from where it was: it never first settles at rest (0) and never restarts off-screen.
    expect(Math.min(...exit.map((f) => f.y))).toBeGreaterThan(r.atClose * 0.6);
    // It travels rather than jumping: a real (non-zero) transform transition carries the exit, and it
    // starts from a mid-flight position. Frame counts alone are unreliable here: Firefox under
    // parallel load renders at ~30fps and the ease-out curve covers most of the distance in a frame.
    // (A reversed CSS transition is legitimately shorter than the token: browsers shorten it in
    // proportion to how far the enter had got, which is itself the "continue from here" behaviour.)
    expect(r.exitTransition, 'exit runs as a transform transition').not.toBeNull();
    expect(r.exitTransition!.duration).toBeGreaterThan(0);
    expect(Math.max(...r.frames.map((f) => f.n))).toBe(1);
    expect(r.left).toBe(0);
    // The queue keeps working afterwards.
    await show.click();
    await expect(page.locator('.rl-toast')).toHaveCount(1);
  });

  test('Tabs: the indicator retargets from its mid-flight position, without jumping back', async ({ page }) => {
    await page.goto('/#/components/tabs');
    const line = page.getByRole('region', { name: 'Line' });
    await expect(line.getByRole('tab').first()).toBeVisible();
    await settle(page);
    // Precondition: the retarget must land mid-flight; retry from the first tab if a slow frame overshot it.
    const attempt = () => line.evaluate(async (root) => {
      const tabs = Array.from(root.querySelectorAll<HTMLElement>('[role="tab"]'));
      const list = root.querySelector('[role="tablist"]')!;
      const ind = root.querySelector('.rl-tabs__indicator')!;
      const x = () => ind.getBoundingClientRect().left - list.getBoundingClientRect().left;
      const stopX = (i: number) => tabs[i]!.getBoundingClientRect().left - list.getBoundingClientRect().left;
      const from = x();
      const far = stopX(3);
      const near = stopX(1);
      const frames: { t: number; x: number }[] = [];
      let stop = false;
      const t0 = performance.now();
      const loop = () => {
        frames.push({ t: performance.now() - t0, x: x() });
        if (!stop) requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
      tabs[3]!.click();
      // Retarget once the indicator is past the second stop but has not arrived.
      const begin = performance.now();
      while (performance.now() - begin < 1000 && x() < near + (far - near) * 0.3) {
        await new Promise((res) => requestAnimationFrame(res));
      }
      const atRetarget = x();
      const retargetT = performance.now() - t0;
      tabs[1]!.click();
      await new Promise((res) => setTimeout(res, 600));
      stop = true;
      return { from, far, near, atRetarget, retargetT, frames };
    });
    let r = await attempt();
    for (let i = 0; i < 4 && !(r.atRetarget > r.near + 2 && r.atRetarget < r.far - 2); i += 1) {
      await line.getByRole('tab').first().click();
      await settle(page);
      r = await attempt();
    }
    // Mid-flight at retarget time: strictly between the stops.
    expect(r.atRetarget).toBeGreaterThan(r.near + 2);
    expect(r.atRetarget).toBeLessThan(r.far - 2);
    const after = r.frames.filter((f) => f.t > r.retargetT);
    // Heads straight back toward the new stop: never past where it was, never back to the start.
    for (let i = 1; i < after.length; i += 1) expect(after[i]!.x).toBeLessThanOrEqual(after[i - 1]!.x + 0.5);
    expect(Math.max(...after.map((f) => f.x))).toBeLessThanOrEqual(r.atRetarget + 0.5);
    expect(Math.min(...after.map((f) => f.x))).toBeGreaterThan(r.near - 1);
    expect(Math.abs(after.at(-1)!.x - r.near)).toBeLessThan(1);
    await expect(line.getByRole('tab', { name: /元数据/ })).toHaveAttribute('aria-selected', 'true');
  });
});

/** Positions of the shared ID in each lane of the ArchiveCard identity player, sampled per frame after Play. */
async function sampleIdentity(player: Locator, lanes: readonly string[], ms: number) {
  return player.evaluate(
    async (root, { lanes: names, ms: total }) => {
      const read = (lane: string) => {
        const el = root.querySelector(`[data-lane="${lane}"] [data-rl-identity]`);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: r.left, y: r.top, inDetail: !el.closest('.rl-archive-card') };
      };
      const start = Object.fromEntries(names.map((l) => [l, read(l)!]));
      const frames: Record<string, { t: number; x: number; y: number; inDetail: boolean }[]> = Object.fromEntries(names.map((l) => [l, []]));
      let stop = false;
      const t0 = performance.now();
      const loop = () => {
        for (const l of names) {
          const p = read(l);
          if (p) frames[l]!.push({ t: performance.now() - t0, ...p });
        }
        if (!stop) requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
      root.querySelector<HTMLElement>('button[data-primary]')!.click();
      await new Promise((res) => setTimeout(res, total));
      stop = true;
      return { start, frames };
    },
    { lanes, ms },
  );
}

const between = (v: number, a: number, b: number) => v > Math.min(a, b) + 1 && v < Math.max(a, b) - 1;

test.describe('ArchiveCard shared identity', () => {
  test('default: the ID travels continuously from the card into the detail; reduced lane jumps', async ({ page }) => {
    await page.goto('/#/motion');
    const player = page.getByRole('region', { name: 'ArchiveCard · 身份连续' });
    await player.scrollIntoViewIfNeeded();
    await expect(player.locator('[data-lane="default"] .rl-archive-card')).toBeVisible();
    await settle(page);
    const { start, frames } = await sampleIdentity(player, ['default', 'reduced'], 900);
    for (const lane of ['default', 'reduced']) {
      const end = frames[lane]!.at(-1)!;
      expect(end.inDetail, lane).toBe(true);
      // The detail places the ID somewhere else, so there is a real distance to travel.
      expect(Math.abs(end.y - start[lane]!.y), lane).toBeGreaterThan(8);
    }
    const travel = (lane: string) => {
      const s = start[lane]!;
      const e = frames[lane]!.at(-1)!;
      return frames[lane]!.filter((f) => between(f.y, s.y, e.y)).length;
    };
    // Seen between the two places: a continuous move. A jump never produces such a frame (reverse
    // validated by removing layoutId); under heavy parallel load WebKit may only paint one or two.
    expect(travel('default')).toBeGreaterThanOrEqual(1);
    // Reduced: never seen between the two places.
    expect(travel('reduced')).toBe(0);
  });

  test('page-level reduced motion: every lane jumps, including Default', async ({ page }) => {
    await setSettings(page, { motion: 'reduce' });
    await page.goto('/#/motion');
    const player = page.getByRole('region', { name: 'ArchiveCard · 身份连续' });
    await player.scrollIntoViewIfNeeded();
    await expect(player.locator('[data-lane="default"] .rl-archive-card')).toBeVisible();
    await settle(page);
    const lanes = ['default', 'slow', 'interrupt'] as const;
    const { start, frames } = await sampleIdentity(player, lanes, 600);
    for (const lane of lanes) {
      const s = start[lane]!;
      const e = frames[lane]!.at(-1)!;
      expect(frames[lane]!.filter((f) => between(f.y, s.y, e.y)).length, lane).toBe(0);
    }
  });
});

test.describe('MotionPresence and RhineMotionGroup (lab)', () => {
  test('group: items stagger in order, the delay caps at 120ms; reduced lane has no transform and no stagger', async ({ page }) => {
    await page.goto('/#/motion');
    const player = page.getByRole('region', { name: 'RhineMotionGroup · rise' });
    await player.scrollIntoViewIfNeeded();
    await expect(player.getByRole('button', { name: '播放' })).toBeVisible();
    await settle(page);
    const r = await player.evaluate(async (root) => {
      const lanes = ['default', 'reduced'] as const;
      // Scheduled opacity delay per item, read from the running WAAPI animation. Frame sampling alone
      // cannot resolve a 24ms step when a loaded runner paints every 50–100ms.
      const delays: Record<string, (number | undefined)[]> = { default: [], reduced: [] };
      const firstVisible: Record<string, number[]> = { default: [], reduced: [] };
      const transformed: Record<string, boolean> = { default: false, reduced: false };
      let frame = 0;
      let stop = false;
      const loop = () => {
        frame += 1;
        for (const lane of lanes) {
          root.querySelectorAll(`[data-lane="${lane}"] [data-rl-motion-item]`).forEach((el, i) => {
            const cs = getComputedStyle(el);
            if (firstVisible[lane]![i] === undefined && Number(cs.opacity) > 0.02) firstVisible[lane]![i] = frame;
            if (cs.transform !== 'none' && new DOMMatrixReadOnly(cs.transform).m42 !== 0) transformed[lane] = true;
            if (delays[lane]![i] === undefined) {
              const anim = el.getAnimations().find((a) => {
                const kf = (a.effect as KeyframeEffect | null)?.getKeyframes() ?? [];
                return kf.some((k) => 'opacity' in k);
              });
              if (anim) delays[lane]![i] = Number(anim.effect!.getTiming().delay ?? 0);
            }
          });
        }
        if (!stop) requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
      root.querySelector<HTMLElement>('button[data-primary]')!.click();
      await new Promise((res) => setTimeout(res, 700));
      stop = true;
      const count = root.querySelectorAll('[data-lane="default"] [data-rl-motion-item]').length;
      return { firstVisible, transformed, count, delays };
    });
    expect(r.count).toBe(7);
    // Schedule: 24ms per item, capped at the fast token (120ms): items 5 and 6 share the cap.
    expect(r.delays.default!.map((v) => Math.round(v ?? -1))).toEqual([0, 24, 48, 72, 96, 120, 120]);
    // And on screen: no item appears before the one above it.
    const d = r.firstVisible.default!;
    expect(d).toHaveLength(7);
    for (let i = 1; i < d.length; i += 1) expect(d[i]!).toBeGreaterThanOrEqual(d[i - 1]!);
    expect(r.transformed.default).toBe(true);
    // Reduced: no stagger, no offset.
    expect(r.delays.reduced!.every((v) => (v ?? 0) === 0)).toBe(true);
    expect(new Set(r.firstVisible.reduced!).size).toBe(1);
    expect(r.transformed.reduced).toBe(false);
  });

  test('presence: default rises, reduced only fades; the interrupt lane never shows two panels', async ({ page }) => {
    await page.goto('/#/motion');
    const player = page.getByRole('region', { name: 'MotionPresence · panel' });
    await player.scrollIntoViewIfNeeded();
    await expect(player.getByRole('button', { name: '播放' })).toBeVisible();
    await settle(page);
    const r = await player.evaluate(async (root) => {
      const rose: Record<string, boolean> = { default: false, reduced: false };
      let maxInterrupt = 0;
      let stop = false;
      const loop = () => {
        for (const lane of ['default', 'reduced']) {
          const el = root.querySelector(`[data-lane="${lane}"] [data-rl-presence]`);
          if (el) {
            const t = getComputedStyle(el).transform;
            if (t !== 'none' && new DOMMatrixReadOnly(t).m42 > 0.5) rose[lane] = true;
          }
        }
        maxInterrupt = Math.max(maxInterrupt, root.querySelectorAll('[data-lane="interrupt"] [data-rl-presence]').length);
        if (!stop) requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
      root.querySelector<HTMLElement>('button[data-primary]')!.click();
      await new Promise((res) => setTimeout(res, 900));
      stop = true;
      return { rose, maxInterrupt };
    });
    expect(r.rose.default).toBe(true);
    expect(r.rose.reduced).toBe(false);
    expect(r.maxInterrupt).toBe(1);
    // The interrupt lane reversed mid-enter and ends collapsed; the others end open.
    await expect(player.locator('[data-lane="interrupt"] [data-rl-presence]')).toHaveCount(0);
    await expect(player.locator('[data-lane="default"] [data-rl-presence]')).toHaveCount(1);
  });
});

test.describe('effects stop while the page is hidden', () => {
  test('OrbitalDiagram holds its angle while hidden and resumes from it', async ({ page }) => {
    await page.goto('/#/motion/effects');
    const card = page.getByRole('region', { name: 'OrbitalDiagram · 轨道' });
    await card.getByRole('button', { name: '缓慢旋转' }).click();
    const orbit = card.locator('.rl-orbit');
    await expect(orbit).toHaveAttribute('data-lifecycle', 'running');
    const rotor = card.locator('.rl-orbit__rotor');
    const angle = () => rotor.evaluate((el) => Number(/rotate\(([-\d.]+)deg\)/.exec((el as SVGElement).style.transform)?.[1] ?? 0));
    await expect.poll(angle).toBeGreaterThan(0.5);
    const before = await angle();
    await setPageHidden(page, true);
    await expect(orbit).toHaveAttribute('data-lifecycle', 'paused');
    await expect(orbit).toHaveAttribute('data-paused', 'hidden');
    await expect(orbit).not.toHaveAttribute('data-spinning');
    const held = await angle();
    // Paused, not reset: the angle is kept where it was when the page was hidden.
    expect(held).toBeGreaterThanOrEqual(before);
    await page.waitForTimeout(700);
    expect(await angle()).toBe(held);
    await setPageHidden(page, false);
    await expect(orbit).toHaveAttribute('data-lifecycle', 'running');
    // Resumes from the held angle: moves on, but not reset to 0 and not jumped ahead.
    await expect.poll(angle).toBeGreaterThan(held);
    expect((await angle()) - held).toBeLessThan(30);
  });

  test('ArchiveReveal freezes mid-flight while hidden and finishes when shown again', async ({ page }) => {
    await page.goto('/#/motion/effects');
    const card = page.getByRole('region', { name: 'In context' });
    const reveal = card.locator('.rl-reveal');
    await expect(reveal).toHaveAttribute('data-state', 'concealed');
    // Click and hide two frames later in one evaluate: a Playwright round-trip between them can be
    // longer than the whole 640ms reveal on a loaded runner.
    await card.getByRole('button', { name: '显示位置' }).evaluate(
      (button) =>
        new Promise<void>((resolve) => {
          (button as HTMLElement).click();
          requestAnimationFrame(() =>
            requestAnimationFrame(() => {
              Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
              Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
              document.dispatchEvent(new Event('visibilitychange'));
              resolve();
            }),
          );
        }),
    );
    const glyphs = card.locator('.rl-reveal__glyphs');
    const frozen = await glyphs.textContent();
    await page.waitForTimeout(900);
    await expect(reveal).toHaveAttribute('data-state', 'animating');
    expect(await glyphs.textContent()).toBe(frozen);
    // The accessible text is never held back by the pause.
    await expect(card.locator('.rl-effect-sr')).toHaveText('实验楼 2F · 观测室');
    await setPageHidden(page, false);
    await expect(reveal).toHaveAttribute('data-state', 'revealed', { timeout: 2000 });
  });

  test('ScanSurface ends a sweep as soon as the page is hidden', async ({ page }) => {
    await page.goto('/#/motion/effects');
    const player = page.getByRole('region', { name: 'ScanSurface' });
    const lane = player.locator('[data-lane="slow"]');
    await player.getByRole('button', { name: '播放' }).click();
    await expect(lane.locator('.rl-scan__line')).toHaveCount(1);
    await setPageHidden(page, true);
    await expect(lane.locator('.rl-scan__line')).toHaveCount(0, { timeout: 300 });
    await expect(lane.locator('.rl-scan')).not.toHaveAttribute('data-scanning');
  });
});

test.describe('Motion page accessibility', () => {
  for (const theme of ['light', 'dark'] as const) {
    test(`axe clean with the lab loaded and every comparison played · ${theme}`, async ({ page }) => {
      await setSettings(page, { theme });
      await page.goto('/#/motion');
      const play = page.locator('.rl-player button[data-primary]');
      await expect(play).toHaveCount(3);
      for (let i = 0; i < 3; i += 1) await play.nth(i).click();
      await page.waitForTimeout(1200);
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
      expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
    });
  }
});
