import * as React from 'react';
import { motion } from 'motion/react';
import { pressScale } from '../motion/presets.js';
import { useRhineMotion } from '../motion/useRhineMotion.js';
import { cx } from '../utils/cx.js';
import type { ButtonSize } from './Button.js';

type MotionConflictingProps =
  | 'onDrag'
  | 'onDragStart'
  | 'onDragEnd'
  | 'onAnimationStart'
  | 'onAnimationEnd'
  | 'onAnimationIteration';

export type IconButtonVariant = 'secondary' | 'ghost' | 'primary';

type NativeProps = Omit<
  React.ComponentPropsWithoutRef<'button'>,
  'disabled' | 'children' | 'aria-label' | 'aria-labelledby' | MotionConflictingProps
>;

/** An accessible name is mandatory: either `label` (preferred) or `aria-labelledby`. */
type Naming =
  | { label: string; 'aria-labelledby'?: never }
  | { label?: never; 'aria-labelledby': string };

export type IconButtonProps = NativeProps &
  Naming & {
    /** The icon. Rendered aria-hidden; the button's name comes from `label`. */
    icon: React.ReactNode;
    variant?: IconButtonVariant;
    size?: ButtonSize;
    disabled?: boolean;
    /** Toggle state for on/off tools (e.g. pin, grid view). Renders `aria-pressed`. */
    pressed?: boolean;
  };

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon, label, variant = 'ghost', size = 'md', disabled = false, pressed, type = 'button', className, title, ...rest },
  ref,
) {
  const motionPrefs = useRhineMotion();
  return (
    <motion.button
      {...rest}
      ref={ref}
      type={type}
      disabled={disabled}
      aria-label={label}
      aria-pressed={pressed}
      // Mirror the name as a tooltip for sighted mouse users unless the caller overrides it.
      title={title ?? label}
      data-slot="icon-button"
      data-variant={variant}
      data-size={size}
      className={cx('rl-icon-button', className)}
      whileTap={!disabled && !motionPrefs.reduced ? { scale: pressScale } : undefined}
      transition={motionPrefs.get('press')}
    >
      <span className="rl-icon-button__icon" aria-hidden="true">
        {icon}
      </span>
    </motion.button>
  );
});
