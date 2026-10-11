'use client';

import * as React from 'react';
import { cx } from '../utils/cx.js';

/**
 * Placeholder block for content that is still loading (ADR-0006 §7). Always `aria-hidden`:
 * the container owns `aria-busy` and a visible or visually hidden 「正在加载」 text.
 * Pulses on `--rl-motion-loop`; static under reduced motion.
 *
 *   <div aria-busy="true">
 *     <Skeleton shape="text" lines={3} />
 *     <span className="rl-visually-hidden">正在加载</span>
 *   </div>
 */

export type SkeletonShape = 'text' | 'block' | 'circle';

export type SkeletonProps = Omit<React.HTMLAttributes<HTMLSpanElement>, 'children' | 'role'> & {
  shape?: SkeletonShape;
  /** CSS length, e.g. `'12rem'`, `'60%'` or `'var(--rl-space-16)'`. */
  width?: string;
  /** CSS length. Text defaults to one line height; block and circle to `--rl-space-16`. */
  height?: string;
  /** Text only: number of lines; the last one is 60% wide. */
  lines?: number;
};

type SkeletonStyle = React.CSSProperties & { '--rl-skeleton-width'?: string; '--rl-skeleton-height'?: string };

export const Skeleton = React.forwardRef<HTMLSpanElement, SkeletonProps>(function Skeleton(
  { shape = 'text', width, height, lines = 1, className, style, ...rest },
  ref,
) {
  const vars: SkeletonStyle = {
    ...style,
    ...(width !== undefined && { '--rl-skeleton-width': width }),
    ...(height !== undefined && { '--rl-skeleton-height': height }),
  };
  const count = shape === 'text' ? Math.max(1, Math.floor(lines)) : 1;

  if (count > 1) {
    return (
      <span
        {...rest}
        ref={ref}
        className={cx('rl-skeleton-lines', className)}
        data-slot="skeleton"
        style={vars}
        aria-hidden="true"
      >
        {Array.from({ length: count }, (_, i) => (
          <span key={i} className="rl-skeleton" data-shape="text" data-last={i === count - 1 || undefined} />
        ))}
      </span>
    );
  }

  return (
    <span
      {...rest}
      ref={ref}
      className={cx('rl-skeleton', className)}
      data-slot="skeleton"
      data-shape={shape}
      style={vars}
      aria-hidden="true"
    />
  );
});
