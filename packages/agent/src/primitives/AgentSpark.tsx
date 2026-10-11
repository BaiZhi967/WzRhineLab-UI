'use client';

import * as React from 'react';
import type { SparkPhase } from '@wzrhine/agent-core';
import { cx } from '../utils/cx.js';
import { loopAttributes, useAgentLoop } from '../motion/agent-motion.js';

/**
 * AgentSpark (atlas 25): a 3 × 3 dot matrix hinting at what the agent is doing. Purely visual
 * (`aria-hidden`); the text next to it carries the status. Each phase has its own rhythm, all
 * driven by CSS keyframes over `--rl-motion-loop` multiples. The loop runs only while the phase
 * is active, the page is visible and the matrix is on screen (shared motion lifecycle); reduced
 * motion and settled phases render one static frame that still differs per phase.
 */
export type AgentSparkProps = Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> & {
  phase: SparkPhase;
  size?: 'sm' | 'md';
  /** Force the static frame (e.g. twelve sparks in a dense list). Default: animate when active. */
  animate?: boolean;
};

const ACTIVE: SparkPhase[] = ['thinking', 'responding', 'executing', 'waiting'];

export function AgentSpark({ phase, size = 'sm', animate = true, className, ...rest }: AgentSparkProps) {
  const active = animate && ACTIVE.includes(phase);
  const { ref, lifecycle } = useAgentLoop<HTMLSpanElement>(active);
  return (
    <span
      {...rest}
      ref={ref}
      className={cx('rl-agent-spark', className)}
      aria-hidden="true"
      data-phase={phase}
      data-size={size}
      {...loopAttributes(lifecycle)}
    >
      {Array.from({ length: 9 }, (_, i) => (
        <i key={i} className="rl-agent-spark__dot" data-row={Math.floor(i / 3)} data-col={i % 3} />
      ))}
    </span>
  );
}
