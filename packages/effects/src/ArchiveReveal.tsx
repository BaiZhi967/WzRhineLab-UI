import * as React from 'react';
import { useEffectTiming } from './clock.js';
import { scrambleCells, stepToward } from './scramble.js';
import { usePageVisible } from './usePageVisible.js';

/**
 * Decrypt-style reveal for short labels (IDs, titles). Showcase effect only (MOTION.md):
 * - The real text is always in the accessibility tree; the scramble is aria-hidden decoration.
 * - Toggling `revealed` mid-flight reverses from the current progress, never restarting.
 * - Reduced motion (OS, provider, or EffectClock) swaps instantly with no glyph cycling.
 * - The loop pauses while the page is hidden and stops once settled.
 * Never use it to delay business data: pass content that is already loaded.
 */

export type ArchiveRevealProps = {
  text: string;
  /** Target state. Changing it animates from the current position. */
  revealed: boolean;
  /** Full reveal duration at speed 1 (ms). */
  duration?: number;
  /** Called once the effect settles at the requested state. */
  onSettled?: (revealed: boolean) => void;
  /** Accessible text while concealed, e.g. "受限内容". Defaults to the text itself. */
  concealedLabel?: string;
  className?: string;
};

const FRAME_MS = 48;

export function ArchiveReveal({ text, revealed, duration = 640, onSettled, concealedLabel, className }: ArchiveRevealProps) {
  const timing = useEffectTiming();
  const visible = usePageVisible();
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
    if (!visible) {
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
  }, [target, revealed, duration, timing, visible]);

  const cells = scrambleCells(text, progress, frame);
  const settled = progress === target;
  const label = revealed ? text : (concealedLabel ?? text);

  return (
    <span
      className={['rl-reveal', className].filter(Boolean).join(' ')}
      data-slot="archive-reveal"
      data-state={settled ? (revealed ? 'revealed' : 'concealed') : 'animating'}
      data-reduced={timing.reduced || undefined}
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
}
