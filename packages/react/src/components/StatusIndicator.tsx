import * as React from 'react';
import { cx } from '../utils/cx';
import type { StatusKind } from './StatusBadge';

/**
 * Inline live/system status: a shaped marker plus visible text, e.g. "同步中 · 2 分钟前".
 * For changing values set `live` so updates are announced politely. The optional pulse is a
 * Showcase-grade signal only for genuinely live connections; it stops under reduced motion
 * and is never used to imply activity that is not happening.
 */

export type StatusIndicatorProps = Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> & {
  tone?: StatusKind;
  label: React.ReactNode;
  /** Secondary detail after the label, e.g. last-updated text. */
  detail?: React.ReactNode;
  /** Announce changes to `label` / `detail` via a polite live region. */
  live?: boolean;
  /** Soft pulse on the marker for a real, active connection. Disabled by reduced motion. */
  pulse?: boolean;
};

export const StatusIndicator = React.forwardRef<HTMLSpanElement, StatusIndicatorProps>(function StatusIndicator(
  { tone = 'neutral', label, detail, live = false, pulse = false, className, ...rest },
  ref,
) {
  return (
    <span
      {...rest}
      ref={ref}
      className={cx('rl-status', className)}
      data-slot="status-indicator"
      data-tone={tone}
      data-pulse={pulse || undefined}
      role={live ? 'status' : undefined}
      aria-live={live ? 'polite' : undefined}
    >
      <span className="rl-status__marker" aria-hidden="true" />
      <span className="rl-status__label">{label}</span>
      {detail != null && <span className="rl-status__detail">{detail}</span>}
    </span>
  );
});
