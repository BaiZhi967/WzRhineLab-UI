import * as React from 'react';
import { motion, useReducedMotion } from 'motion/react';

// motion.button redefines these handlers with gesture/animation signatures.
type MotionConflictingProps =
  | 'onDrag'
  | 'onDragStart'
  | 'onDragEnd'
  | 'onAnimationStart'
  | 'onAnimationEnd'
  | 'onAnimationIteration';

export type ButtonProps = Omit<React.ComponentPropsWithoutRef<'button'>, 'disabled' | MotionConflictingProps> & {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md';
  loading?: boolean;
  disabled?: boolean;
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading = false, disabled = false, type = 'button', children, className = '', ...rest },
  ref,
) {
  const reduceMotion = useReducedMotion();
  const inactive = disabled || loading;
  return (
    <motion.button
      {...rest}
      ref={ref}
      type={type}
      disabled={inactive}
      aria-busy={loading || undefined}
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={['rl-button', className].filter(Boolean).join(' ')}
      whileTap={inactive || reduceMotion ? undefined : { scale: 0.985 }}
      transition={{ duration: 0.08 }}
    >
      {loading && <span className="rl-button__spinner" aria-hidden="true" />}
      {children}
    </motion.button>
  );
});
