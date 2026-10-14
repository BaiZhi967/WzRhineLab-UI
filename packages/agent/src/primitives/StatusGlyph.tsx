'use client';

import * as React from 'react';
import type { AgentTone, StatusGlyphName } from '@wzrhine/agent-core';
import { cx } from '../utils/cx.js';

/**
 * One glyph per status meaning (ADR-0011 §3, ICONS.md). Always decorative: the label next to it
 * carries the meaning, so colour + shape + text say the same thing three times.
 */
const glyphs: Record<StatusGlyphName, React.ReactNode> = {
  idle: <circle cx="8" cy="8" r="2" />,
  pending: <circle cx="8" cy="8" r="4.5" strokeDasharray="2.2 2.2" />,
  thinking: (
    <>
      <circle cx="8" cy="8" r="4.5" />
      <circle cx="8" cy="8" r="1.5" className="rl-agent-glyph__fill" />
    </>
  ),
  tool: <path d="M9.5 2.8a3 3 0 0 0 3.7 3.7L8 11.7 6.5 13.2a1.5 1.5 0 0 1-2.1-2.1L5.9 9.6l5.2-5.2a3 3 0 0 1-1.6-1.6Z" />,
  'waiting-user': (
    <>
      <circle cx="8" cy="8" r="5.5" />
      <path d="M6.3 6.4a1.8 1.8 0 1 1 2.4 1.7c-.5.2-.7.6-.7 1.1v.3M8 11.3v.01" />
    </>
  ),
  approval: <path d="M8 2 3 4v4c0 3 2.2 5 5 6 2.8-1 5-3 5-6V4L8 2ZM8 5.5v3M8 10.5v.01" />,
  saving: <path d="M3.5 3.5h7l2 2v7h-9zM5.5 3.5v3h4v-3M5.5 12.5v-3h5v3" />,
  done: (
    <>
      <circle cx="8" cy="8" r="5.5" />
      <path d="m5.5 8.2 1.7 1.7 3.3-3.6" />
    </>
  ),
  failed: (
    <>
      <circle cx="8" cy="8" r="5.5" />
      <path d="M8 5v3.5M8 10.8v.01" />
    </>
  ),
  stopping: (
    <>
      <circle cx="8" cy="8" r="5.5" strokeDasharray="2.2 2.2" />
      <rect x="6" y="6" width="4" height="4" rx="0.5" />
    </>
  ),
  stopped: <rect x="4" y="4" width="8" height="8" rx="1" />,
  active: <circle cx="8" cy="8" r="3" className="rl-agent-glyph__fill" />,
  unknown: (
    <>
      <path d="M8 2.5 13.5 8 8 13.5 2.5 8Z" />
      <path d="M6.8 6.8a1.3 1.3 0 1 1 1.7 1.2c-.3.1-.5.4-.5.7M8 10.2v.01" />
    </>
  ),
  terminal: <path d="m3.5 5 3 3-3 3M8 11.5h4.5" />,
  children: (
    <>
      <circle cx="4" cy="4" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="12" cy="6" r="1.5" />
      <path d="M4 5.5V10a2 2 0 0 0 2 2h4.5M4 6h6.5" />
    </>
  ),
  compacting: <path d="M3 3.5h10M3 12.5h10M8 5v6m-2-2 2 2 2-2" />,
  reconnecting: <path d="M12.5 8a4.5 4.5 0 1 1-1.3-3.2M12.5 3v2.5H10" />,
  offline: <path d="M2.5 6.5a8 8 0 0 1 11 0M4.5 8.8a5 5 0 0 1 7 0M6.6 11a2 2 0 0 1 2.8 0M3 3l10 10" />,
};

export type StatusGlyphProps = Omit<React.SVGProps<SVGSVGElement>, 'children'> & {
  /**
   * Built-in glyph name. Any other string is accepted together with `children` (ADR-0013 §3):
   * the children become the glyph content and `data-glyph` carries the custom name.
   */
  name: StatusGlyphName | (string & {});
  tone?: AgentTone;
  /** Ongoing activity: CSS adds a slow breathing halo (`data-loop` from the caller). */
  active?: boolean;
  /** Custom SVG inner nodes; win over the built-in glyph for `name`. */
  children?: React.ReactNode;
};

export function StatusGlyph({ name, tone = 'neutral', active, className, children, ...rest }: StatusGlyphProps) {
  return (
    <svg
      {...rest}
      className={cx('rl-agent-glyph', className)}
      viewBox="0 0 16 16"
      aria-hidden="true"
      focusable="false"
      data-glyph={name}
      data-tone={tone}
      data-active={active || undefined}
    >
      {children ?? glyphs[name as StatusGlyphName] ?? null}
    </svg>
  );
}
