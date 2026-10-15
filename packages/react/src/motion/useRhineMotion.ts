'use client';

import { useMemo } from 'react';
import { useMotionPreference } from './preference.js';
import type { Transition } from 'motion/react';
import { transition } from './presets.js';
import { resolveMotion, useMotionSpeed } from './resolve.js';
import type { MotionPropertyKind, RhineTransitionName } from './resolve.js';

export type { RhineTransitionName } from './resolve.js';

export interface RhineMotion {
  /** True when the OS preference or the nearest `<MotionConfig reducedMotion>` asks for reduced motion. */
  reduced: boolean;
  /** Review speed from the nearest `MotionSpeed` (1 by default). */
  speed: number;
  /** Returns the named preset, or an instant transition when motion is reduced. */
  get: (name: RhineTransitionName) => Transition;
  /** Returns the named preset degraded for one property kind (ADR-0007): colour / opacity keep a short fade. */
  resolve: (kind: MotionPropertyKind, name: RhineTransitionName) => Transition;
}

/**
 * Single entry point for component motion. Honours `<MotionConfig reducedMotion="user" | "always" | "never">`
 * so apps (and the showcase) can force either mode.
 */
export function useRhineMotion(): RhineMotion {
  const reduced = useMotionPreference();
  const speed = useMotionSpeed();
  return useMemo(() => ({
    reduced,
    speed,
    get: (name: RhineTransitionName) => (reduced ? transition.instant : resolveMotion('transform', name, false, speed)),
    resolve: (kind: MotionPropertyKind, name: RhineTransitionName) => resolveMotion(kind, name, reduced, speed),
  }), [reduced, speed]);
}
