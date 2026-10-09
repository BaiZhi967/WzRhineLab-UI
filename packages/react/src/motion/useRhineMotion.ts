import { useReducedMotionConfig } from 'motion/react';
import type { Transition } from 'motion/react';
import { transition } from './presets';

export type RhineTransitionName = keyof typeof transition;

export interface RhineMotion {
  /** True when the OS preference or the nearest `<MotionConfig reducedMotion>` asks for reduced motion. */
  reduced: boolean;
  /** Returns the named preset, or an instant transition when motion is reduced. */
  get: (name: RhineTransitionName) => Transition;
}

/**
 * Single entry point for component motion. Honours `<MotionConfig reducedMotion="user" | "always" | "never">`
 * so apps (and the showcase) can force either mode.
 */
export function useRhineMotion(): RhineMotion {
  const reduced = useReducedMotionConfig() === true;
  return {
    reduced,
    get: (name) => (reduced ? transition.instant : transition[name]),
  };
}
