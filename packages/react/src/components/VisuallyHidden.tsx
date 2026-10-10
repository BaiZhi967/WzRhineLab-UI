import * as React from 'react';
import { cx } from '../utils/cx.js';

export type VisuallyHiddenElement = 'span' | 'div' | 'p' | 'h2' | 'h3' | 'label' | 'legend';

export type VisuallyHiddenProps = React.HTMLAttributes<HTMLElement> & {
  as?: VisuallyHiddenElement;
  /** Become visible while it or a descendant has focus (skip links). */
  focusable?: boolean;
};

/**
 * Content for assistive tech only: still in the accessibility tree, removed from layout.
 * Not a way to hide focusable controls unless `focusable` makes them reappear on focus.
 */
export const VisuallyHidden = React.forwardRef<HTMLElement, VisuallyHiddenProps>(function VisuallyHidden(
  { as: Element = 'span', focusable = false, className, ...rest },
  ref,
) {
  return (
    <Element
      {...rest}
      ref={ref as React.Ref<never>}
      className={cx('rl-visually-hidden', className)}
      data-focusable={focusable || undefined}
    />
  );
});
