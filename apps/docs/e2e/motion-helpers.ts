import type { Page } from '@playwright/test';

/**
 * M10 motion helpers. Kept apart from helpers.ts (shared with other milestones) on purpose.
 * Motion assertions sample in the page on requestAnimationFrame: a Playwright round-trip per
 * frame is far slower than the animation and would only see the start and the end.
 */

/** Simulate the tab being hidden / shown again (`document.hidden`, `visibilityState`, event). */
export async function setPageHidden(page: Page, hidden: boolean) {
  await page.evaluate((h) => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => h });
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (h ? 'hidden' : 'visible') });
    document.dispatchEvent(new Event('visibilitychange'));
  }, hidden);
}

/** Resolve after `n` animation frames, so React commits and CSS/motion pick up the change. */
export async function frames(page: Page, n = 2) {
  await page.evaluate(
    (count) =>
      new Promise<void>((resolve) => {
        let left = count;
        const step = () => (--left <= 0 ? resolve() : requestAnimationFrame(step));
        requestAnimationFrame(step);
      }),
    n,
  );
}

export interface RunningAnimation {
  /** CSS animation / transition name, or the motion-driven WAAPI id. */
  name: string;
  kind: string;
  target: string;
  infinite: boolean;
  /** Properties the animation writes (from its keyframes). */
  properties: string[];
  /** Total active duration in ms (Infinity for infinite). */
  duration: number;
}

/**
 * Animations currently running in the document. `document.getAnimations()` covers CSS animations,
 * CSS transitions and WAAPI (motion/react uses WAAPI for opacity/transform where it can).
 */
export async function runningAnimations(page: Page): Promise<RunningAnimation[]> {
  return page.evaluate(() =>
    document
      .getAnimations()
      .filter((a) => a.playState === 'running')
      .map((a) => {
        const effect = a.effect as KeyframeEffect | null;
        const timing = effect?.getComputedTiming();
        const target = effect?.target as Element | null | undefined;
        const props = new Set<string>();
        for (const frame of effect?.getKeyframes() ?? []) {
          for (const key of Object.keys(frame)) {
            if (!['offset', 'computedOffset', 'easing', 'composite'].includes(key)) props.add(key);
          }
        }
        const name =
          (a as CSSAnimation).animationName ?? (a as CSSTransition).transitionProperty ?? (a.id || 'waapi');
        const kind = a.constructor.name;
        const describe = (el: Element | null | undefined) => {
          if (!el) return '(none)';
          const cls = typeof el.className === 'string' ? el.className.trim().split(/\s+/).slice(0, 2).join('.') : '';
          return `${el.tagName.toLowerCase()}${cls ? `.${cls}` : ''}`;
        };
        const iterations = timing?.iterations ?? 1;
        const end = Number(timing?.endTime ?? 0);
        return {
          name: String(name),
          kind,
          target: describe(target),
          infinite: iterations === Infinity || end === Infinity,
          properties: [...props],
          duration: end,
        };
      }),
  );
}

/**
 * Reduced-motion rule (ADR-0007 §3, motion-and-rendering-plan §5). Under reduce an animation is an
 * offender when it:
 * - loops forever (status pulse, shimmer, spinner, orbit, scan), or
 * - writes a movement property: transform / translate / scale / rotate, or layout (width, height,
 *   top, left, inset, margin), or
 * - is a colour / opacity fade longer than the `fast` token (120ms).
 * Allowed: finite opacity / colour / border / shadow transitions of at most 120ms.
 */
export const movementProperties = ['transform', 'translate', 'scale', 'rotate', 'width', 'height', 'top', 'left', 'right', 'bottom', 'inset', 'margin'];
export const reducedFadeBudgetMs = 120;

export function reducedMotionOffence(a: RunningAnimation): string | null {
  if (a.infinite) return 'infinite';
  const written = [...a.properties, a.name].map((p) => p.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`));
  const moving = written.filter((p) => movementProperties.some((m) => p === m || p.startsWith(`${m}-`)));
  if (moving.length > 0) return `moves ${[...new Set(moving)].join(',')}`;
  if (a.duration > reducedFadeBudgetMs + 1) return `fade ${Math.round(a.duration)}ms > ${reducedFadeBudgetMs}ms`;
  return null;
}

/**
 * Record every animation the page starts from the very first frame: CSS transitions
 * (`transitionrun`), CSS animations (`animationstart`) and WAAPI calls (`Element.animate`, which
 * motion/react uses). A snapshot of `getAnimations()` at the end would miss short ones that
 * already finished. Call before `page.goto`.
 */
export async function recordAnimations(page: Page) {
  await page.addInitScript(() => {
    type Entry = { name: string; kind: string; target: string; infinite: boolean; properties: string[]; duration: number };
    const log: Entry[] = [];
    (window as unknown as { __rlAnimations: Entry[] }).__rlAnimations = log;
    const describe = (el: Element | null) => {
      if (!el) return '(none)';
      const cls = typeof el.className === 'string' ? el.className.trim().split(/\s+/).slice(0, 2).join('.') : '';
      return `${el.tagName.toLowerCase()}${cls ? `.${cls}` : ''}`;
    };
    const ms = (v: string) => Math.max(...v.split(',').map((s) => (s.trim().endsWith('ms') ? parseFloat(s) : parseFloat(s) * 1000)));
    document.addEventListener(
      'transitionrun',
      (e) => {
        const el = e.target as Element;
        const cs = getComputedStyle(el);
        const names = cs.transitionProperty.split(',').map((s) => s.trim());
        const durations = cs.transitionDuration.split(',').map((s) => s.trim());
        const i = Math.max(0, names.indexOf(e.propertyName));
        log.push({ name: e.propertyName, kind: 'CSSTransition', target: describe(el), infinite: false, properties: [e.propertyName], duration: ms(durations[i % durations.length] ?? '0s') });
      },
      true,
    );
    document.addEventListener(
      'animationstart',
      (e) => {
        const el = e.target as Element;
        const cs = getComputedStyle(el);
        const anim = el.getAnimations().find((a) => (a as CSSAnimation).animationName === e.animationName);
        const props = new Set<string>();
        for (const f of (anim?.effect as KeyframeEffect | undefined)?.getKeyframes() ?? []) {
          for (const k of Object.keys(f)) if (!['offset', 'computedOffset', 'easing', 'composite'].includes(k)) props.add(k);
        }
        log.push({ name: e.animationName, kind: 'CSSAnimation', target: describe(el), infinite: cs.animationIterationCount.includes('infinite'), properties: [...props], duration: ms(cs.animationDuration) });
      },
      true,
    );
    const original = Element.prototype.animate;
    Element.prototype.animate = function (this: Element, keyframes: Keyframe[] | PropertyIndexedKeyframes | null, options?: number | KeyframeAnimationOptions) {
      const frames = Array.isArray(keyframes) ? keyframes : keyframes ? [keyframes] : [];
      const props = new Set<string>();
      for (const f of frames) for (const k of Object.keys(f)) if (!['offset', 'easing', 'composite'].includes(k)) props.add(k);
      const o = typeof options === 'number' ? { duration: options } : options ?? {};
      const duration = Number(o.duration ?? 0) * (o.iterations === Infinity ? Infinity : Number(o.iterations ?? 1));
      log.push({ name: 'waapi', kind: 'WAAPI', target: describe(this), infinite: o.iterations === Infinity, properties: [...props], duration });
      return original.call(this, keyframes, options);
    };
  });
}

/** Everything recorded by `recordAnimations` so far, plus what `getAnimations()` still reports as running. */
export async function recordedAnimations(page: Page): Promise<RunningAnimation[]> {
  const logged = await page.evaluate(() => (window as unknown as { __rlAnimations?: RunningAnimation[] }).__rlAnimations ?? []);
  return [...logged, ...(await runningAnimations(page))];
}
