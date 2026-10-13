'use client';

import * as React from 'react';
import { useEffectTiming } from './clock.js';
import { scrambleCells, stepToward } from './scramble.js';
import { usePageVisible } from './usePageVisible.js';

/**
 * Decrypt-style reveal for short labels (IDs, titles). Showcase effect only (MOTION.md):
 * - The real text is always in the accessibility tree; the scramble is aria-hidden decoration.
 * - Toggling `revealed` mid-flight reverses from the current progress, never restarting.
 * - Reduced motion (OS, provider, or EffectClock) swaps instantly with no glyph cycling.
 * - The loop pauses while the page is hidden (shared `usePageVisible`, ADR-0007), resumes from the
 *   current progress, and stops once settled or unmounted. It is short and one-shot, so it does not
 *   track the viewport.
 * Never use it to delay business data: pass content that is already loaded.
 */

export type ArchiveRevealProps = Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> & {
  text: string;
  /** Target state. Changing it animates from the current position. */
  revealed: boolean;
  /** Full reveal duration at speed 1 (ms). */
  duration?: number;
  /** Called once the effect settles at the requested state. */
  onSettled?: (revealed: boolean) => void;
  /** Accessible text while concealed, e.g. "受限内容". Defaults to the text itself. */
  concealedLabel?: string;
  paused?: boolean;
};

const FRAME_MS = 48;

export const ArchiveReveal = React.forwardRef<HTMLSpanElement, ArchiveRevealProps>(function ArchiveReveal({ text, revealed, duration = 640, onSettled, concealedLabel, paused = false, className, ...rest }, ref) {
  const timing = useEffectTiming();
  const visible = usePageVisible();
  const viewportRef = React.useRef<HTMLSpanElement>(null);
  const [inViewport, setInViewport] = React.useState(true);
  React.useEffect(() => {
    const element = viewportRef.current;
    if (!element) return undefined;
    const onVisibility = () => { if (!document.hidden) setInViewport(true); };
    document.addEventListener('visibilitychange', onVisibility);
    if (typeof IntersectionObserver === 'undefined') return () => document.removeEventListener('visibilitychange', onVisibility);
    const observer = new IntersectionObserver(([entry]) => setInViewport(entry?.isIntersecting ?? false), { threshold: 0 });
    observer.observe(element);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', onVisibility); };
  }, []);
  const effectiveVisible = visible && inViewport && !paused;
  const target = revealed ? 1 : 0;
  const [progress, setProgress] = React.useState(target);
  const [frame, setFrame] = React.useState(0);
  const progressRef = React.useRef(progress);
  progressRef.current = progress;
  const settledRef = React.useRef(onSettled);
  settledRef.current = onSettled;

  React.useEffect(() => {
    if (timing.reduced) {
      setProgress(target);
      if (progressRef.current !== target) settledRef.current?.(revealed);
      return;
    }
    if (progressRef.current === target) return;
    if (!effectiveVisible) {
      // Paused: settle nothing now; the effect re-runs (and resumes from the current progress) on visibility.
      return;
    }
    const total = timing.scale(duration);
    // Baseline comes from the first frame's own timestamp: rAF time and performance.now()
    // do not share an origin in every environment.
    let last: number | null = null;
    let lastFrame = 0;
    let raf = 0;
    const tick = (now: number) => {
      if (last === null) {
        last = now;
        lastFrame = now;
        raf = requestAnimationFrame(tick);
        return;
      }
      const dt = Math.max(0, now - last);
      last = now;
      const next = stepToward(progressRef.current, target, dt / total);
      progressRef.current = next;
      setProgress(next);
      if (now - lastFrame >= FRAME_MS / timing.speed) {
        lastFrame = now;
        setFrame((f) => f + 1);
      }
      if (next === target) {
        settledRef.current?.(revealed);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, revealed, duration, timing, effectiveVisible]);

  const cells = scrambleCells(text, progress, frame);
  const settled = progress === target;
  const label = revealed ? text : (concealedLabel ?? text);

  return (
    <span
      {...rest}
      ref={(node) => { viewportRef.current = node; if (typeof ref === 'function') ref(node); else if (ref) ref.current = node; }}
      className={['rl-reveal', className].filter(Boolean).join(' ')}
      data-slot="archive-reveal"
      data-state={settled ? (revealed ? 'revealed' : 'concealed') : 'animating'}
      data-reduced={timing.reduced || undefined}
      data-paused={paused || !effectiveVisible || undefined}
      aria-label={rest['aria-label'] ?? label}
    >
      <span className="rl-effect-sr">{label}</span>
      <span className="rl-reveal__glyphs" aria-hidden="true">
        {cells.map((cell, i) => (
          <span key={i} className="rl-reveal__cell" data-resolved={cell.resolved || undefined}>
            {cell.char}
          </span>
        ))}
      </span>
    </span>
  );
});
