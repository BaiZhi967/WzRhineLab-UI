'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import { transition } from '../motion/presets.js';
import { useRhineMotion } from '../motion/useRhineMotion.js';
import { cx } from '../utils/cx.js';

/**
 * Indeterminate activity indicator (ADR-0006 §7). With `label` it is a polite status
 * (`role="status"` + visually hidden text); without, it is decorative and the surrounding
 * control carries the busy state (e.g. Button `aria-busy`). Rotation runs on motion/react and
 * stops under reduced motion (OS or RhineProvider), leaving a longer static arc.
 *
 *   <Spinner size="sm" label="正在加载记录" />
 */

export type SpinnerSize = 'sm' | 'md' | 'lg';

export type SpinnerProps = Omit<React.HTMLAttributes<HTMLSpanElement>, 'children' | 'role'> & {
  /** Maps to the icon-size tokens. */
  size?: SpinnerSize;
  /** Spoken status text, e.g. 「正在加载」. Omit for a decorative spinner. */
  label?: string;
};

export const Spinner = React.forwardRef<HTMLSpanElement, SpinnerProps>(function Spinner(
  { size = 'md', label, className, ...rest },
  ref,
) {
  const { reduced } = useRhineMotion();
  const named = label !== undefined && label !== '';
  return (
    <span
      {...rest}
      ref={ref}
      className={cx('rl-spinner', className)}
      data-slot="spinner"
      data-size={size}
      data-reduced={reduced || undefined}
      role={named ? 'status' : undefined}
      aria-hidden={named ? undefined : true}
    >
      <motion.svg
        className="rl-spinner__svg"
        viewBox="0 0 16 16"
        aria-hidden="true"
        focusable="false"
        animate={reduced ? { rotate: 0 } : { rotate: 360 }}
        transition={reduced ? transition.instant : transition.loop}
      >
        <circle className="rl-spinner__track" cx="8" cy="8" r="6" />
        <circle className="rl-spinner__arc" cx="8" cy="8" r="6" pathLength="100" />
      </motion.svg>
      {named && <span className="rl-visually-hidden">{label}</span>}
    </span>
  );
});
