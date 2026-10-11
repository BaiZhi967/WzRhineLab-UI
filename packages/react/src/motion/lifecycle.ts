'use client';

import * as React from 'react';
import { useReducedMotionConfig } from 'motion/react';
import { useInViewport, usePageVisible } from './visibility.js';

/*
 * Lifecycle contract for loops and long-running visuals (ADR-0007 §4). A loop runs only while it is
 * requested, not paused by the user, the page is visible, the element is on screen and motion is
 * not reduced. Everything else is a pause with a reason, so callers can show the right static state.
 */

export type MotionLifecycleState = 'idle' | 'running' | 'paused' | 'stopped';
export type MotionPauseReason = 'manual' | 'hidden' | 'offscreen' | 'reduced';

export interface MotionLifecycleOptions {
  /** Controlled request. When set, it overrides `start()` / `stop()`. */
  active?: boolean;
  /** Start on mount (uncontrolled only). */
  autoStart?: boolean;
  /** Pause while this element is outside the viewport. */
  viewportRef?: React.RefObject<Element | null>;
  /** Extra reduced-motion signal (e.g. an effect clock forcing reduce). OS / provider preference always applies. */
  reduced?: boolean;
}

export interface MotionLifecycle {
  state: MotionLifecycleState;
  /** True only in `running`; drive the loop from this. */
  running: boolean;
  /** Why a requested loop is not running; `null` when running, idle or stopped. */
  pauseReason: MotionPauseReason | null;
  start: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
}

const noRef: React.RefObject<Element | null> = { current: null };

export function useMotionLifecycle({ active, autoStart = false, viewportRef, reduced: forceReduced = false }: MotionLifecycleOptions = {}): MotionLifecycle {
  const [requested, setRequested] = React.useState(autoStart);
  const [everStarted, setEverStarted] = React.useState(autoStart);
  const [manualPause, setManualPause] = React.useState(false);
  const visible = usePageVisible();
  const inView = useInViewport(viewportRef ?? noRef);
  const reduced = useReducedMotionConfig() === true || forceReduced;

  const isRequested = active ?? requested;
  const started = active === undefined ? everStarted : everStarted || active;
  if (active && !everStarted) setEverStarted(true);

  let pauseReason: MotionPauseReason | null = null;
  if (isRequested) {
    if (reduced) pauseReason = 'reduced';
    else if (manualPause) pauseReason = 'manual';
    else if (!visible) pauseReason = 'hidden';
    else if (viewportRef && !inView) pauseReason = 'offscreen';
  }
  const state: MotionLifecycleState = !isRequested ? (started ? 'stopped' : 'idle') : pauseReason ? 'paused' : 'running';

  const start = React.useCallback(() => {
    setRequested(true);
    setEverStarted(true);
    setManualPause(false);
  }, []);
  const stop = React.useCallback(() => {
    setRequested(false);
    setManualPause(false);
  }, []);
  const pause = React.useCallback(() => setManualPause(true), []);
  const resume = React.useCallback(() => setManualPause(false), []);

  return { state, running: state === 'running', pauseReason, start, pause, resume, stop };
}

export interface LatestGuard {
  /** Begin a new async run; the returned check is true until a newer run begins, `cancel()` or unmount. */
  begin: () => () => boolean;
  /** Invalidate every pending run (e.g. when the dialog that started it closes). */
  cancel: () => void;
}

/**
 * Stale async result guard (MOTION.md lifecycle rule 2): a late response must not reopen a dialog
 * or overwrite newer state.
 *
 * ```ts
 * const guard = useLatestGuard();
 * const isCurrent = guard.begin();
 * const data = await load();
 * if (!isCurrent()) return;
 * ```
 */
export function useLatestGuard(): LatestGuard {
  const generation = React.useRef(0);
  React.useEffect(() => {
    // Re-arm after StrictMode's simulated unmount; invalidate on the real one.
    generation.current += 1;
    return () => {
      generation.current += 1;
    };
  }, []);
  return React.useMemo<LatestGuard>(
    () => ({
      begin: () => {
        generation.current += 1;
        const mine = generation.current;
        return () => generation.current === mine;
      },
      cancel: () => {
        generation.current += 1;
      },
    }),
    [],
  );
}
