'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import type { Transition } from 'motion/react';
import { useMotionLifecycle, useRhineMotion } from '@wzrhine/react';
import type { MotionLifecycle } from '@wzrhine/react';

/*
 * Agent motion layer (ADR-0012). Agent-specific choreography built only from the Rhine motion
 * core: named presets, `resolve()` for reduced motion, the shared lifecycle for loops.
 *
 * Ownership (one owner per element × property):
 * - motion/react owns `opacity` / `y` / `scale` of entering items (AgentEntrance, MessageSettle),
 *   the send/stop icon swap and the selection ghost (`layoutId`).
 * - CSS owns disclosure height (Collapsible), colour transitions, the AgentSpark keyframes and the
 *   breathing halo. Under reduced motion the CSS duration tokens are already 0ms and every
 *   keyframe is switched off by `agent.css`.
 * - Nothing animates layout across a whole message list.
 */

/** First-entrance kinds. `message` = new message; `row` = tool / ledger row; `card` = intervention card. */
export type AgentEntranceKind = 'message' | 'row' | 'card';

const entranceSpec: Record<AgentEntranceKind, { y: number; scale: number; name: 'base' | 'panel' | 'fast' }> = {
  message: { y: 6, scale: 1, name: 'base' },
  row: { y: 4, scale: 1, name: 'fast' },
  card: { y: 8, scale: 0.985, name: 'panel' },
};

/** Stagger step and cap for rows that arrive together (MOTION.md: 20–30ms per item, capped). */
export const AGENT_STAGGER_MS = 24;
export const AGENT_STAGGER_CAP_MS = 120;

export function agentStaggerDelay(index: number, reduced: boolean, speed = 1): number {
  if (reduced || index <= 0) return 0;
  return Math.min(index * AGENT_STAGGER_MS, AGENT_STAGGER_CAP_MS) / 1000 / speed;
}

type MotionConflictingProps = 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration';

const tags = { div: motion.div, li: motion.li, article: motion.article, section: motion.section } as const;

export type AgentEntranceProps = Omit<React.HTMLAttributes<HTMLElement>, MotionConflictingProps> & {
  kind?: AgentEntranceKind;
  /** Animate this mount. Pass `false` for items present on first render or restored from history. */
  animate?: boolean;
  /** Position among items that arrived together (stagger). */
  index?: number;
  as?: keyof typeof tags;
};

/**
 * Plays a single first entrance and never again: later re-renders (streaming text, status changes)
 * do not replay it, because the decision is frozen at mount. Content is visible from the first
 * frame under reduced motion (no transform, ≤ fast opacity fade).
 */
export const AgentEntrance = React.forwardRef<HTMLElement, AgentEntranceProps>(function AgentEntrance(
  { kind = 'row', animate = true, index = 0, as = 'div', children, ...rest },
  ref,
) {
  const { reduced, speed, resolve } = useRhineMotion();
  const [play] = React.useState(animate);
  const spec = entranceSpec[kind];
  const Comp = tags[as] as typeof motion.div;
  const delay = agentStaggerDelay(index, reduced, speed);
  const opacity: Transition = { ...resolve('opacity', spec.name), delay };
  const move: Transition = { ...resolve('transform', spec.name), delay };
  return (
    <Comp
      {...rest}
      ref={ref as React.Ref<HTMLDivElement>}
      data-agent-entrance={kind}
      initial={play ? { opacity: 0, y: reduced ? 0 : spec.y, scale: reduced ? 1 : spec.scale } : false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ opacity, y: move, scale: move }}
    >
      {children}
    </Comp>
  );
});

/**
 * Loop lifecycle for agent activity indicators (AgentSpark, breathing dots, shimmer). Runs only
 * while `active`, the page is visible, the element is on screen and motion is not reduced.
 * Returns the lifecycle plus a ref to attach to the animated element.
 */
export function useAgentLoop<T extends Element>(active: boolean): { ref: React.RefObject<T | null>; lifecycle: MotionLifecycle } {
  const ref = React.useRef<T | null>(null);
  const lifecycle = useMotionLifecycle({ active, viewportRef: ref });
  return { ref, lifecycle };
}

/**
 * Data attributes that drive CSS loops: `data-loop="running" | "paused"` and the pause reason.
 * CSS only animates `[data-loop='running']`, so hidden pages and off-screen items cost nothing.
 */
export function loopAttributes(lifecycle: MotionLifecycle): { 'data-loop': 'running' | 'paused' | 'idle'; 'data-loop-paused'?: string } {
  if (lifecycle.running) return { 'data-loop': 'running' };
  if (lifecycle.pauseReason) return { 'data-loop': 'paused', 'data-loop-paused': lifecycle.pauseReason };
  return { 'data-loop': 'idle' };
}

/** Cross-fade transition for two stacked icons (send ↔ stop). Reduced: instant swap. */
export function useSwapTransition(): { enter: Transition; exit: Transition; reduced: boolean } {
  const { reduced, resolve } = useRhineMotion();
  return { enter: resolve('opacity', 'base'), exit: resolve('opacity', 'fast'), reduced };
}
