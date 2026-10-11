'use client';

import * as React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { Transition, Variants } from 'motion/react';
import { duration } from './presets.js';
import { resolveMotion } from './resolve.js';
import type { RhineTransitionName } from './resolve.js';
import { useRhineMotion } from './useRhineMotion.js';

/*
 * Rhine presence and stagger (ADR-0007). Callers pick a named preset; offsets, durations and the
 * reduced-motion fallback come from here, so pages never hand-write variants or transitions.
 */

// motion components redefine these handlers with gesture/animation signatures.
type MotionConflictingProps =
  | 'onDrag'
  | 'onDragStart'
  | 'onDragEnd'
  | 'onAnimationStart'
  | 'onAnimationEnd'
  | 'onAnimationIteration';

type ElementProps = Omit<React.HTMLAttributes<HTMLElement>, MotionConflictingProps | 'children'>;

const tags = {
  div: motion.div,
  section: motion.section,
  span: motion.span,
  ul: motion.ul,
  ol: motion.ol,
  li: motion.li,
} as const;

/**
 * - `fade`: opacity only, `fast` — tooltips, inline status swaps.
 * - `panel`: opacity + 8px rise, `panel` — detail layers, dialogs, sheets.
 * - `rise`: opacity + 4px rise, `base` — list items, inline feedback.
 */
export type MotionPresencePreset = 'fade' | 'panel' | 'rise';

const presenceSpec: Record<MotionPresencePreset, { name: RhineTransitionName; offset: number }> = {
  fade: { name: 'fast', offset: 0 },
  panel: { name: 'panel', offset: 8 },
  rise: { name: 'base', offset: 4 },
};

/** Variants for one preset. Reduced motion drops the offset and keeps a short opacity fade. */
export function presenceVariants(preset: MotionPresencePreset, reduced: boolean, speed = 1): Variants {
  const { name, offset } = presenceSpec[preset];
  const y = reduced ? 0 : offset;
  const opacity = resolveMotion('opacity', name, reduced, speed);
  const move = resolveMotion('transform', name, reduced, speed);
  const both: Transition = { opacity, y: move };
  return {
    hidden: { opacity: 0, y, transition: both },
    visible: { opacity: 1, y: 0, transition: both },
  };
}

export type MotionPresenceProps = ElementProps & {
  /** Mount (true) or animate out and unmount (false). */
  show: boolean;
  preset?: MotionPresencePreset;
  /** Animate on first render too. Off by default: content present at load just appears. */
  initial?: boolean;
  /** Element rendered for the animated wrapper. */
  as?: keyof typeof tags;
  /** Fires after the exit animation, once the content has unmounted. */
  onExitComplete?: () => void;
  children?: React.ReactNode;
};

/**
 * Enter / exit wrapper over `AnimatePresence`. Toggling `show` mid-flight reverses from the
 * current visual state (no queued animations). Hidden content is unmounted, so it never lingers
 * in the accessibility tree.
 */
export function MotionPresence({
  show,
  preset = 'fade',
  initial = false,
  as = 'div',
  onExitComplete,
  children,
  ...rest
}: MotionPresenceProps) {
  const { reduced, speed } = useRhineMotion();
  const variants = presenceVariants(preset, reduced, speed);
  const Comp = tags[as] as typeof motion.div;
  return (
    <AnimatePresence initial={initial} onExitComplete={onExitComplete}>
      {show && (
        <Comp
          {...rest}
          key="rl-presence"
          data-rl-presence={preset}
          variants={variants}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          {children}
        </Comp>
      )}
    </AnimatePresence>
  );
}

/** Per-item stagger step and total cap (MOTION.md: 20–30ms per item, capped). */
export const staggerStepMs = 24;
export const staggerMaxMs = duration.fast * 1000;

/** Delay (seconds) for the item at `index`. Zero under reduced motion. */
export function staggerDelay(index: number, reduced: boolean, speed = 1): number {
  if (reduced || index <= 0) return 0;
  return Math.min(index * staggerStepMs, staggerMaxMs) / 1000 / speed;
}

const GroupContext = React.createContext<{ preset: Exclude<MotionPresencePreset, 'panel'> } | null>(null);
const ItemIndexContext = React.createContext(0);

export type RhineMotionGroupProps = ElementProps & {
  /** Mount (true) with staggered items, or fade the whole group out and unmount (false). */
  show?: boolean;
  /** Item preset. */
  preset?: 'fade' | 'rise';
  /** Animate on first render too. Off by default. */
  initial?: boolean;
  as?: 'div' | 'section' | 'ul' | 'ol';
  onExitComplete?: () => void;
  /** `RhineMotionItem` children; their order sets the stagger. */
  children?: React.ReactNode;
};

/**
 * Staggered entrance for a short group (≤ ~8 items). Item n waits n × 24ms, capped at the
 * `fast` token (120ms) so long lists never trickle in; reduced motion removes the stagger and
 * the offset. Exit is one group fade, never a reverse cascade.
 */
export function RhineMotionGroup({
  show = true,
  preset = 'rise',
  initial = false,
  as = 'div',
  onExitComplete,
  children,
  ...rest
}: RhineMotionGroupProps) {
  const { reduced, speed } = useRhineMotion();
  const Comp = tags[as] as typeof motion.div;
  const fadeOut = resolveMotion('opacity', 'fast', reduced, speed);
  const container: Variants = {
    hidden: { opacity: 1 },
    visible: { opacity: 1 },
    exit: { opacity: 0, transition: fadeOut },
  };
  const value = React.useMemo(() => ({ preset }), [preset]);
  let index = 0;
  const items = React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) return child;
    const i = index++;
    return <ItemIndexContext.Provider value={i}>{child}</ItemIndexContext.Provider>;
  });
  return (
    <AnimatePresence initial={initial} onExitComplete={onExitComplete}>
      {show && (
        <Comp {...rest} key="rl-group" data-rl-motion-group="" variants={container} initial="hidden" animate="visible" exit="exit">
          <GroupContext.Provider value={value}>{items}</GroupContext.Provider>
        </Comp>
      )}
    </AnimatePresence>
  );
}

export type RhineMotionItemProps = ElementProps & {
  as?: 'div' | 'li' | 'span';
  children?: React.ReactNode;
};

/** One staggered item; must be a direct child of `RhineMotionGroup`. */
export function RhineMotionItem({ as = 'div', children, ...rest }: RhineMotionItemProps) {
  const group = React.useContext(GroupContext);
  const index = React.useContext(ItemIndexContext);
  const { reduced, speed } = useRhineMotion();
  const Comp = tags[as] as typeof motion.div;
  const base = presenceVariants(group?.preset ?? 'rise', reduced, speed);
  const delay = staggerDelay(index, reduced, speed);
  const visible = base.visible as { opacity: number; y: number; transition: Record<string, Transition> };
  const variants: Variants = {
    hidden: base.hidden!,
    visible: {
      ...visible,
      transition: {
        opacity: { ...visible.transition.opacity, delay },
        y: { ...visible.transition.y, delay },
      },
    },
    exit: {},
  };
  return (
    <Comp {...rest} data-rl-motion-item={index} variants={variants}>
      {children}
    </Comp>
  );
}
