'use client';

import * as React from 'react';
import { Separator as BaseSeparator } from '@base-ui/react/separator';
import { cx } from '../utils/cx.js';

export type SeparatorOrientation = 'horizontal' | 'vertical';
export type SeparatorTone = 'subtle' | 'default' | 'strong';

export type SeparatorProps = Omit<React.ComponentPropsWithoutRef<'div'>, 'role' | 'children'> & {
  orientation?: SeparatorOrientation;
  tone?: SeparatorTone;
  /**
   * Purely visual rule: removed from the accessibility tree. Use for decoration inside a
   * group whose structure is already conveyed by headings or lists.
   */
  decorative?: boolean;
};

/**
 * Thin rule between groups of content (`role="separator"`). It is never the only boundary of
 * an interactive region (DESIGN.md §3); focus, error and selection have their own styles.
 */
export const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(function Separator(
  { orientation = 'horizontal', tone = 'default', decorative = false, className, ...rest },
  ref,
) {
  const shared = {
    ...rest,
    className: cx('rl-separator', className),
    'data-slot': 'separator',
    'data-tone': tone,
  };
  if (decorative) {
    return <div {...shared} ref={ref} aria-hidden="true" data-orientation={orientation} />;
  }
  return <BaseSeparator {...shared} ref={ref} orientation={orientation} />;
});
