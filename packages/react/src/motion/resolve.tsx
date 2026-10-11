'use client';

import * as React from 'react';
import type { Transition } from 'motion/react';
import { duration, ease, transition } from './presets.js';

/** Named preset keys (`instant` … `showcase`, plus `press`/`release`/`loop`). */
export type RhineTransitionName = keyof typeof transition;

/**
 * What a transition animates. Reduced motion degrades by kind (ADR-0007):
 * - `color` / `opacity`: keep a short fade, never longer than `fast`;
 * - `transform` / `layout`: jump straight to the target;
 * - `loop`: stop (instant, no repeat).
 */
export type MotionPropertyKind = 'color' | 'opacity' | 'transform' | 'layout' | 'loop';

type TimedTransition = Transition & { duration?: number };

function scaleTransition(t: TimedTransition, speed: number): Transition {
  if (speed === 1 || !t.duration) return t;
  return { ...t, duration: t.duration / speed };
}

/**
 * Resolve a named preset for one kind of property. Pure: pass `reduced` from `useRhineMotion()`
 * (or use its `resolve`, which does this for you). `speed` < 1 slows the result down (showcase review only);
 * it never lengthens the reduced fallback, which stays within the `fast` token.
 */
export function resolveMotion(kind: MotionPropertyKind, name: RhineTransitionName, reduced: boolean, speed = 1): Transition {
  const preset: TimedTransition = transition[name];
  if (!reduced) return scaleTransition(preset, speed);
  if (kind === 'color' || kind === 'opacity') {
    const ms = Math.min(preset.duration ?? 0, duration.fast);
    if (ms === 0 || 'repeat' in preset) return transition.instant;
    // Review speed never stretches the reduced fallback: reduce wins over Slow ×0.25.
    return { duration: ms, ease: ease.out };
  }
  return transition.instant;
}

const MotionSpeedContext = React.createContext(1);

export interface MotionSpeedProps {
  /** 0.25 = four times slower. Values ≤ 0 are ignored. */
  speed: number;
  children: React.ReactNode;
}

/**
 * Slows every `useRhineMotion()` transition in this subtree. Review and showcase only
 * (e.g. the motion player's Slow ×0.25 lane); never ship it in a product view.
 */
export function MotionSpeed({ speed, children }: MotionSpeedProps) {
  return <MotionSpeedContext.Provider value={speed > 0 ? speed : 1}>{children}</MotionSpeedContext.Provider>;
}

/** Current review speed (1 outside a `MotionSpeed`). */
export function useMotionSpeed(): number {
  return React.useContext(MotionSpeedContext);
}
