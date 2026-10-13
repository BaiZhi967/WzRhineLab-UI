'use client';

import * as React from 'react';
import { animate as animateValue, motion, useMotionValue } from 'motion/react';
import { useMotionLifecycle } from '@wzrhine/react';
import { useEffectTiming } from './clock.js';

/**
 * Instrument-style orbital diagram (DESIGN.md "Instrument Accent"): concentric rings with labelled
 * nodes. Decorative structure around real labels, not a data visualisation:
 * - Labels are real text in an accessible list; the SVG is aria-hidden.
 * - Rotation is opt-in (`animate`), stops when off-screen, on hidden tabs and under reduced motion
 *   (shared lifecycle, ADR-0007); `data-lifecycle` / `data-paused` expose the current state.
 * - Positions are fixed by `angle` props; nothing is random.
 */

export interface OrbitNode {
  id: string;
  label: string;
  /** Ring index, 0 = innermost. */
  ring: number;
  /** Position on the ring in degrees, 0 = top, clockwise. */
  angle: number;
  /** Highlight one node (e.g. the current subject). */
  active?: boolean;
  selected?: boolean;
  tone?: 'accent' | 'info' | 'warning' | 'success' | 'neutral';
}

export type OrbitalDiagramProps = {
  nodes: readonly OrbitNode[];
  size?: number;
  rings?: number;
  /** Centre caption, e.g. a record ID. */
  center?: string;
  /** Slow ambient rotation. Off by default; disabled by reduced motion. */
  animate?: boolean;
  /** Seconds per revolution of the outer ring at speed 1. */
  period?: number;
  /** Accessible name of the node list. */
  label: string;
  className?: string;
};

const SIZE = 240;
const C = SIZE / 2;

export function OrbitalDiagram({ nodes, rings = 3, size = SIZE, center, animate = false, period = 60, label, className }: OrbitalDiagramProps) {
  const timing = useEffectTiming();
  const ref = React.useRef<HTMLDivElement>(null);
  const lifecycle = useMotionLifecycle({ active: animate, viewportRef: ref, reduced: timing.reduced });
  const spinning = lifecycle.running;
  const rotate = useMotionValue(0);
  const revolution = period / timing.speed;

  // Running: continue from the current angle. Paused (hidden, off-screen, reduced): hold the angle.
  // Stopped or never started: back to the rest position.
  React.useEffect(() => {
    if (!spinning) {
      if (lifecycle.state !== 'paused' || timing.reduced) rotate.jump(0);
      return;
    }
    const from = rotate.get() % 360;
    const controls = animateValue(rotate, [from, from + 360], { duration: revolution, ease: 'linear', repeat: Infinity });
    return () => controls.stop();
  }, [spinning, revolution, lifecycle.state, timing.reduced, rotate]);
  const centerPoint = size / 2;
  const radius = (ring: number) => 36 * (size / SIZE) + (ring * (centerPoint - 48 * (size / SIZE))) / Math.max(1, rings - 1);

  return (
    <div className="rl-orbit-wrap">
    <div ref={ref} className={['rl-orbit', className].filter(Boolean).join(' ')} data-slot="orbital-diagram" data-size={size} data-spinning={spinning || undefined} data-lifecycle={lifecycle.state} data-paused={lifecycle.pauseReason ?? undefined}>
      <svg className="rl-orbit__svg" viewBox={`0 0 ${size} ${size}`} aria-hidden="true" focusable="false">
        <g className="rl-orbit__ticks">
          {Array.from({ length: 24 }, (_, i) => {
            const a = (i * 15 * Math.PI) / 180;
            const r1 = C - 6;
            const r2 = i % 6 === 0 ? C - 14 : C - 10;
            return <line key={i} x1={C + r1 * Math.sin(a)} y1={C - r1 * Math.cos(a)} x2={C + r2 * Math.sin(a)} y2={C - r2 * Math.cos(a)} />;
          })}
        </g>
        <motion.g className="rl-orbit__rotor" style={{ transformOrigin: `${C}px ${C}px`, rotate }}>
          {Array.from({ length: rings }, (_, ring) => (
            <circle key={ring} className="rl-orbit__ring" cx={C} cy={C} r={radius(ring)} data-ring={ring} />
          ))}
          {nodes.map((node) => {
            const a = (node.angle * Math.PI) / 180;
            const r = radius(Math.min(node.ring, rings - 1));
            return (
              <circle
                key={node.id}
                className="rl-orbit__node"
                data-active={node.active || node.selected || undefined}
                data-tone={node.tone ?? undefined}
                cx={C + r * Math.sin(a)}
                cy={C - r * Math.cos(a)}
                r={node.active ? 5 : 3.5}
              />
            );
          })}
        </motion.g>
        <circle className="rl-orbit__core" cx={C} cy={C} r={14} />
        <path className="rl-orbit__crosshair" d={`M${C - 22} ${C}h8M${C + 14} ${C}h8M${C} ${C - 22}v8M${C} ${C + 14}v8`} />
      </svg>
      {center && <span className="rl-orbit__center">{center}</span>}
      <ul className="rl-orbit__legend" aria-label={label}>
        {nodes.map((node) => (
          <li key={node.id} data-active={node.active || undefined}>
            <span className="rl-orbit__ring-index" aria-hidden="true">
              R{node.ring + 1}
            </span>
            {node.label}
            {node.active && <span className="rl-effect-sr">（当前）</span>}
          </li>
        ))}
      </ul>
    </div>
    </div>
  );
}
