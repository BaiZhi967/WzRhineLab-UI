import { expect, test } from '@playwright/test';
import { routes, setSettings } from './helpers';
import { recordAnimations, recordedAnimations, reducedMotionOffence } from './motion-helpers';

/**
 * M10 reduced-motion sweep over every Showcase route (ADR-0007 §3). The showcase "减少" setting
 * is applied while the OS reports no preference, so the provider path (`data-rl-motion="reduce"`
 * plus `MotionConfig reducedMotion="always"`) is what is under test, not only the media query.
 *
 * Rule (see `reducedMotionOffence`): nothing loops forever, nothing moves (transform / translate /
 * scale / rotate / layout), and fades stay within the `fast` token (120ms). Animations are logged
 * from the first frame (transitionrun, animationstart, Element.animate) so short ones that already
 * finished still count; JS-driven motion values are caught by sampling inline transforms per frame.
 */
test.use({ viewport: { width: 1280, height: 900 } });

for (const route of routes) {
  test(`reduced motion on load · ${route.name}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await setSettings(page, { motion: 'reduce' });
    await recordAnimations(page);
    await page.goto(route.hash);
    await expect(page.locator('.sc-page-title, .sc-hero__title').first()).toBeVisible();
    await expect(page.locator('.sc-app')).toHaveAttribute('data-rl-motion', 'reduce');
    // Lazy chunks (effects, lab) mount after the heading; give them time to start anything they would.
    await page.waitForTimeout(800);

    // JS-driven motion values (motion/react x/y/rotate) write inline transforms each frame.
    const moving = await page.evaluate(
      () =>
        new Promise<string[]>((resolve) => {
          const read = () =>
            new Map(
              Array.from(document.querySelectorAll<HTMLElement | SVGElement>('[style*="transform"], [style*="translate"], [style*="rotate"]')).map((el) => [
                el,
                `${el.style.transform}|${el.style.translate}|${el.style.rotate}`,
              ]),
            );
          const first = read();
          let n = 0;
          const step = () => {
            if (++n < 12) return requestAnimationFrame(step);
            const out: string[] = [];
            for (const [el, value] of read()) {
              const before = first.get(el);
              if (before !== undefined && before !== value) out.push(`${el.tagName.toLowerCase()}.${String(el.getAttribute('class') ?? '').split(' ')[0]}: ${before} → ${value}`);
            }
            resolve(out);
          };
          requestAnimationFrame(step);
        }),
    );

    const offenders = (await recordedAnimations(page))
      .map((a) => ({ a, why: reducedMotionOffence(a) }))
      .filter((o) => o.why !== null)
      .map(({ a, why }) => `${a.kind} ${a.name} on ${a.target}: ${why}`);
    expect([...new Set(offenders)], 'animations that ignore reduced motion').toEqual([]);
    expect(moving, 'inline transforms changing frame to frame').toEqual([]);
  });
}

// On load nothing has been triggered yet; the motion routes also play every comparison once.
for (const route of routes.filter((r) => r.name === 'motion' || r.name === 'effects')) {
  test(`reduced motion after playing every demo · ${route.name}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await setSettings(page, { motion: 'reduce' });
    await recordAnimations(page);
    await page.goto(route.hash);
    const play = page.locator('.rl-player button[data-primary]');
    await expect(play.first()).toBeVisible();
    const count = await play.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i += 1) await play.nth(i).click();
    await page.waitForTimeout(800);
    const offenders = (await recordedAnimations(page))
      .map((a) => ({ a, why: reducedMotionOffence(a) }))
      .filter((o) => o.why !== null)
      .map(({ a, why }) => `${a.kind} ${a.name} on ${a.target}: ${why}`);
    expect([...new Set(offenders)], 'animations that ignore reduced motion').toEqual([]);
  });
}
