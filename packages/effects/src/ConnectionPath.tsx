'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import { createEffectPath } from './geometry.js';
import type { EffectAnchorSide, EffectPathKind } from './geometry.js';
import { useElementAnchors } from './useElementAnchors.js';
import { useEffectProgress } from './useEffectProgress.js';

export interface ConnectionPathProps {
  containerRef: React.RefObject<HTMLElement | null>;
  fromRef: React.RefObject<HTMLElement | null>;
  toRef: React.RefObject<HTMLElement | null>;
  fromAnchor?: EffectAnchorSide;
  toAnchor?: EffectAnchorSide;
  route?: EffectPathKind;
  bend?: number;
  active?: boolean;
  tracking?: boolean;
  className?: string;
  onSettled?: (active: boolean) => void;
}

export function ConnectionPath({
  containerRef, fromRef, toRef, fromAnchor = 'bottom', toAnchor = 'bottom', route = 'rail', bend,
  active = false, tracking = false, className, onSettled, annotation = false,
}: ConnectionPathProps & { annotation?: boolean }) {
  const anchors = React.useMemo(() => ({ from: { ref: fromRef, side: fromAnchor }, to: { ref: toRef, side: toAnchor } }), [fromRef, toRef, fromAnchor, toAnchor]);
  const { width, height, points } = useElementAnchors({ containerRef, anchors, tracking });
  const { progress, state, reduced } = useEffectProgress({ active, viewportRef: containerRef, onSettled });
  const from = points.from;
  const to = points.to;
  const d = from && to ? createEffectPath(from, to, { route, bend }) : '';
  return (
    <svg className={['rl-effect-connection', annotation ? 'rl-annotation-trace' : 'rl-signal-path', className].filter(Boolean).join(' ')}
      viewBox={width > 0 && height > 0 ? `0 0 ${width} ${height}` : undefined}
      preserveAspectRatio="none" aria-hidden="true" focusable="false"
      data-state={state} data-active={active} data-reduced={reduced}>
      {d && width > 0 && height > 0 && <>
        <path className="rl-effect-connection__track" d={d} />
        <motion.path className="rl-effect-connection__signal" d={d} style={{ pathLength: progress, opacity: progress }} />
        {annotation && to && <motion.circle className="rl-effect-connection__endpoint" cx={to.x} cy={to.y} r={3} style={{ opacity: progress }} />}
      </>}
    </svg>
  );
}
