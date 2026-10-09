import type { Transition } from 'motion/react';
import { motionDurations, motionEasings, motionLoopMs } from '@wzrhine/tokens';
import type { MotionDurationName } from '@wzrhine/tokens';

/** Duration tokens in seconds, derived from the shared token manifest. */
export const duration = Object.fromEntries(
  Object.entries(motionDurations).map(([name, ms]) => [name, ms / 1000]),
) as Record<MotionDurationName, number>;

export const ease = {
  out: [...motionEasings.out] as [number, number, number, number],
  inOut: [...motionEasings.inOut] as [number, number, number, number],
  linear: 'linear',
} as const;

/** Named transitions. Components import these instead of writing their own numbers. */
export const transition = {
  press: { duration: duration.press, ease: ease.out },
  release: { duration: duration.fast, ease: ease.out },
  fast: { duration: duration.fast, ease: ease.out },
  base: { duration: duration.base, ease: ease.out },
  panel: { duration: duration.panel, ease: ease.out },
  scene: { duration: duration.scene, ease: ease.inOut },
  loop: { duration: motionLoopMs / 1000, ease: 'linear', repeat: Infinity },
  instant: { duration: 0 },
} as const satisfies Record<string, Transition>;

/** Press feedback: ≤1.5% scale, no layout shift, no hit-area change. */
export const pressScale = 0.985;

/** Short presence fade used by inline feedback (spinner, status swap). */
export const fadePresence = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
} as const;
