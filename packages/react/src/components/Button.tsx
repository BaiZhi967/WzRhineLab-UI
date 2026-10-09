import * as React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { fadePresence, pressScale, transition } from '../motion/presets';
import { useRhineMotion } from '../motion/useRhineMotion';
import { cx } from '../utils/cx';

// motion.button redefines these handlers with gesture/animation signatures.
type MotionConflictingProps =
  | 'onDrag'
  | 'onDragStart'
  | 'onDragEnd'
  | 'onAnimationStart'
  | 'onAnimationEnd'
  | 'onAnimationIteration';

export type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = Omit<React.ComponentPropsWithoutRef<'button'>, 'disabled' | MotionConflictingProps> & {
  /** Visual weight. `primary` = ink fill; `accent` = research-orange signal, use once per view. */
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Blocks activation and announces busy state while keeping focus and the accessible name. */
  loading?: boolean;
  disabled?: boolean;
  /** Decorative leading icon; hidden from assistive tech. */
  iconStart?: React.ReactNode;
  /** Decorative trailing icon; hidden from assistive tech. */
  iconEnd?: React.ReactNode;
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    type = 'button',
    iconStart,
    iconEnd,
    children,
    className,
    onClick,
    ...rest
  },
  ref,
) {
  const motionPrefs = useRhineMotion();
  const interactive = !disabled && !loading;

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (loading) {
      // Also stops implicit form submission for type="submit".
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };

  return (
    <motion.button
      {...rest}
      ref={ref}
      type={type}
      // Native disabled removes focus; loading keeps the button focusable via aria-disabled.
      disabled={disabled}
      aria-disabled={loading || undefined}
      aria-busy={loading || undefined}
      data-slot="button"
      data-variant={variant}
      data-size={size}
      data-loading={loading || undefined}
      className={cx('rl-button', className)}
      onClick={handleClick}
      whileTap={interactive && !motionPrefs.reduced ? { scale: pressScale } : undefined}
      transition={motionPrefs.get('press')}
    >
      <motion.span
        className="rl-button__content"
        initial={false}
        animate={{ opacity: loading ? 0 : 1 }}
        transition={motionPrefs.get('fast')}
      >
        {iconStart != null && (
          <span className="rl-button__icon" aria-hidden="true">
            {iconStart}
          </span>
        )}
        <span className="rl-button__label">{children}</span>
        {iconEnd != null && (
          <span className="rl-button__icon" aria-hidden="true">
            {iconEnd}
          </span>
        )}
      </motion.span>
      <AnimatePresence initial={false}>
        {loading && (
          <motion.span
            key="spinner"
            className="rl-button__spinner"
            aria-hidden="true"
            {...fadePresence}
            transition={motionPrefs.get('fast')}
          >
            <Spinner reduced={motionPrefs.reduced} />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
});

function Spinner({ reduced }: { reduced: boolean }) {
  return (
    <motion.svg
      className="rl-spinner"
      viewBox="0 0 16 16"
      data-reduced={reduced || undefined}
      animate={reduced ? { rotate: 0 } : { rotate: 360 }}
      transition={reduced ? transition.instant : transition.loop}
    >
      <circle className="rl-spinner__track" cx="8" cy="8" r="6" />
      <circle className="rl-spinner__arc" cx="8" cy="8" r="6" pathLength="100" />
    </motion.svg>
  );
}
