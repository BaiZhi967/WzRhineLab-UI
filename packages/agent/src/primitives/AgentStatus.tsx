'use client';

import * as React from 'react';
import type { AgentTone, StatusGlyphName, StatusMeta } from '@wzrhine/agent-core';
import { cx } from '../utils/cx.js';
import { StatusGlyph } from './StatusGlyph.js';

/**
 * The status pill shared by every agent component: glyph + label (+ optional meta such as an
 * elapsed time). Tone is never the only signal. Not a live region by itself: components that
 * announce changes wrap it in their own `role="status"` with a throttled text.
 */
export type AgentStatusProps = Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> & {
  glyph: StatusGlyphName;
  tone: AgentTone;
  label: React.ReactNode;
  /** Secondary text after the label (elapsed time, count). */
  meta?: React.ReactNode;
  active?: boolean;
  /** `pill` = tinted chip; `inline` = glyph + text without a frame. */
  appearance?: 'pill' | 'inline';
  size?: 'sm' | 'md';
};

export const AgentStatus = React.forwardRef<HTMLSpanElement, AgentStatusProps>(function AgentStatus(
  { glyph, tone, label, meta, active, appearance = 'pill', size = 'sm', className, ...rest },
  ref,
) {
  return (
    <span
      {...rest}
      ref={ref}
      className={cx('rl-agent-status', className)}
      data-tone={tone}
      data-appearance={appearance}
      data-size={size}
      data-active={active || undefined}
    >
      <StatusGlyph name={glyph} tone={tone} active={active} className="rl-agent-status__glyph" />
      <span className="rl-agent-status__label">{label}</span>
      {meta != null && meta !== false && <span className="rl-agent-status__meta">{meta}</span>}
    </span>
  );
});

/** Convenience: render a status from a `StatusMeta` record plus its label. */
export function statusProps(meta: StatusMeta, label: React.ReactNode): Pick<AgentStatusProps, 'glyph' | 'tone' | 'label' | 'active'> {
  return { glyph: meta.glyph, tone: meta.tone, label, active: meta.active };
}
