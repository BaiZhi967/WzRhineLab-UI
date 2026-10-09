import * as React from 'react';
export type StatusKind = 'neutral' | 'info' | 'success' | 'warning' | 'danger';
export type StatusBadgeProps = React.ComponentPropsWithoutRef<'span'> & { status?: StatusKind };
export const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(function StatusBadge(
  { status = 'neutral', className = '', children, ...rest }, ref,
) {
  return <span {...rest} ref={ref} className={['rl-badge', className].filter(Boolean).join(' ')} data-slot="status-badge" data-status={status}><span className="rl-badge__dot" aria-hidden="true" />{children}</span>;
});
