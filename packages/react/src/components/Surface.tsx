import * as React from 'react';
import { cx } from '../utils/cx.js';

export type SurfaceTone = 'default' | 'subtle' | 'raised';
export type SurfacePadding = 'none' | 'sm' | 'md' | 'lg';
export type SurfaceElement = 'section' | 'div' | 'article' | 'aside';

export type SurfaceProps = React.ComponentPropsWithoutRef<'section'> & {
  /** Layer tone. Hierarchy is expressed through tone first, shadow only for `raised`. */
  tone?: SurfaceTone;
  padding?: SurfacePadding;
  /** Show a 1px outline. Decorative only; never the sole interactive boundary. */
  bordered?: boolean;
  /**
   * Rendered element. Defaults to `section`, which needs an accessible name
   * (`aria-labelledby`) to be exposed as a landmark; use `div` for purely visual grouping.
   */
  as?: SurfaceElement;
};

export const Surface = React.forwardRef<HTMLElement, SurfaceProps>(function Surface(
  { tone = 'default', padding = 'md', bordered = true, as: Element = 'section', className, ...rest },
  ref,
) {
  return (
    <Element
      {...rest}
      ref={ref as React.Ref<HTMLDivElement>}
      data-slot="surface"
      data-tone={tone}
      data-padding={padding}
      data-bordered={bordered || undefined}
      className={cx('rl-surface', className)}
    />
  );
});
