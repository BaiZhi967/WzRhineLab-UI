import * as React from 'react';
export type SurfaceProps = React.ComponentPropsWithoutRef<'section'> & { tone?: 'default' | 'subtle' };
export const Surface = React.forwardRef<HTMLElement, SurfaceProps>(function Surface(
  { tone = 'default', className = '', ...rest }, ref,
) {
  return <section {...rest} ref={ref} data-slot="surface" data-tone={tone} className={['rl-surface', className].filter(Boolean).join(' ')} />;
});
