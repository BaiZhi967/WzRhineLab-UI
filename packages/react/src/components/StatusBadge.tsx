import * as React from 'react';
import { cx } from '../utils/cx';

export type StatusKind = 'neutral' | 'info' | 'success' | 'warning' | 'danger';
export type StatusBadgeSize = 'sm' | 'md';
export type StatusBadgeAppearance = 'subtle' | 'outline';

export type StatusBadgeProps = React.ComponentPropsWithoutRef<'span'> & {
  /** Business status. Always paired with visible text; colour is never the only signal. */
  status?: StatusKind;
  size?: StatusBadgeSize;
  /** `subtle` tints the background; `outline` keeps a neutral fill for dense tables. */
  appearance?: StatusBadgeAppearance;
};

export const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(function StatusBadge(
  { status = 'neutral', size = 'md', appearance = 'subtle', className, children, ...rest },
  ref,
) {
  return (
    <span
      {...rest}
      ref={ref}
      className={cx('rl-badge', className)}
      data-slot="status-badge"
      data-status={status}
      data-size={size}
      data-appearance={appearance}
    >
      <span className="rl-badge__indicator" aria-hidden="true" />
      <span className="rl-badge__label">{children}</span>
    </span>
  );
});
