'use client';

import * as React from 'react';
import type { AgentTone, StatusGlyphName, ToolCategory, ToolStatus } from '@wzrhine/agent-core';
import { toolStatusMeta } from '@wzrhine/agent-core';
import { useAgentMessages } from '../../provider/AgentMessages.js';
import { AgentIcon } from '../../primitives/icons.js';
import type { AgentIconName } from '../../primitives/icons.js';
import { AgentStatus } from '../../primitives/AgentStatus.js';
import { cx } from '../../utils/cx.js';

/*
 * Small building blocks shared by the tools family: category chip, copy button, bounded code
 * view, key/value list, inline notice and the "fresh rows" tracker that decides which rows get a
 * first entrance. Internal to the family (only the types that leak into public props are exported
 * from the package entry).
 */

/** Icon + tone per tool category. Tone is never the only signal: the chip always has text. */
export const categoryMeta: Record<ToolCategory, { icon: AgentIconName; tone: AgentTone | 'ink' }> = {
  read: { icon: 'file', tone: 'info' },
  write: { icon: 'edit', tone: 'accent' },
  execute: { icon: 'terminal', tone: 'ink' },
  network: { icon: 'globe', tone: 'info' },
  model: { icon: 'model', tone: 'neutral' },
  agent: { icon: 'agent', tone: 'neutral' },
  question: { icon: 'question', tone: 'neutral' },
  other: { icon: 'tool', tone: 'neutral' },
};

export function ToolCategoryChip({ category = 'other', className }: { category?: ToolCategory; className?: string }) {
  const m = useAgentMessages();
  const meta = categoryMeta[category] ?? categoryMeta.other;
  return (
    <span className={cx('rl-agent-tool-chip', className)} data-category={category} data-tone={meta.tone}>
      <AgentIcon name={meta.icon} />
      <span className="rl-agent-tool-chip__label">{m.status.category[category] ?? m.status.category.other}</span>
    </span>
  );
}

/** Status pill for a tool status: glyph + shared label (+ meta). */
export function ToolStatusPill({
  status,
  meta,
  appearance,
}: {
  status: ToolStatus;
  meta?: React.ReactNode;
  appearance?: 'pill' | 'inline';
}) {
  const m = useAgentMessages();
  const s = toolStatusMeta[status] ?? toolStatusMeta.unknown;
  return (
    <AgentStatus
      glyph={s.glyph}
      tone={s.tone}
      active={s.active}
      label={m.status.tool[status] ?? status}
      meta={meta}
      appearance={appearance}
    />
  );
}

/** Plain glyph + tone + label pill for local enums (diff status, execution state…). */
export function Pill({
  glyph,
  tone,
  label,
  active,
}: {
  glyph: StatusGlyphName;
  tone: AgentTone;
  label: React.ReactNode;
  active?: boolean;
}) {
  return <AgentStatus glyph={glyph} tone={tone} label={label} active={active} />;
}

/** Copy text to the clipboard. `onCopyText` replaces the default `navigator.clipboard` write. */
export function CopyButton({
  text,
  label,
  onCopyText,
  className,
}: {
  text: string;
  /** Accessible name; defaults to 「复制」. */
  label?: string;
  onCopyText?: (text: string) => void | Promise<void>;
  className?: string;
}) {
  const m = useAgentMessages().tools;
  const [state, setState] = React.useState<'idle' | 'copied' | 'failed'>('idle');
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  React.useEffect(() => () => clearTimeout(timer.current), []);
  const copy = async () => {
    try {
      if (onCopyText) await onCopyText(text);
      else if (typeof navigator !== 'undefined' && navigator.clipboard) await navigator.clipboard.writeText(text);
      else throw new Error('clipboard unavailable');
      setState('copied');
    } catch {
      setState('failed');
    }
    clearTimeout(timer.current);
    // Reset the visible confirmation; the status text stays announced once.
    timer.current = setTimeout(() => setState('idle'), 2000);
  };
  const name = label ?? m.copy;
  return (
    <span className={cx('rl-agent-copy', className)}>
      <button type="button" className="rl-agent-tool-button" data-size="sm" aria-label={name} title={name} onClick={() => void copy()}>
        <AgentIcon name={state === 'copied' ? 'check' : 'copy'} />
        <span className="rl-agent-tool-button__text" aria-hidden="true">
          {state === 'copied' ? m.copied : state === 'failed' ? m.copyFailed : m.copy}
        </span>
      </button>
      <span className="rl-agent-sr" role="status">
        {state === 'copied' ? m.copied : state === 'failed' ? m.copyFailed : ''}
      </span>
    </span>
  );
}

/** Small text button used for in-detail actions (load more, reload, open terminal). */
export function ActionButton({
  children,
  icon,
  onClick,
  tone,
  disabled,
  busy,
  describedBy,
}: {
  children: React.ReactNode;
  icon?: AgentIconName;
  onClick: () => void;
  tone?: 'accent' | 'neutral';
  disabled?: boolean;
  busy?: boolean;
  describedBy?: string;
}) {
  return (
    <button
      type="button"
      className="rl-agent-tool-button"
      data-tone={tone}
      disabled={disabled}
      aria-busy={busy || undefined}
      aria-disabled={busy || undefined}
      aria-describedby={describedBy}
      onClick={busy ? undefined : onClick}
    >
      {icon && <AgentIcon name={icon} />}
      <span className="rl-agent-tool-button__text">{children}</span>
    </button>
  );
}

/**
 * Bounded, horizontally scrollable code view. Optional line numbers start at `startLine` and are
 * `aria-hidden` + unselectable, so copying the code never copies the gutter. The scroller is a
 * focusable named region, so keyboard users can scroll it.
 */
export function CodeView({
  code,
  label,
  startLine,
  tone = 'surface',
  className,
}: {
  code: string;
  label: string;
  /** Show a line-number gutter starting at this 1-based line. */
  startLine?: number;
  tone?: 'surface' | 'inverse';
  className?: string;
}) {
  const lines = React.useMemo(() => code.replace(/\r\n/g, '\n').split('\n'), [code]);
  return (
    <div className={cx('rl-agent-code', className)} data-tone={tone} role="region" tabIndex={0} aria-label={label}>
      <pre className="rl-agent-code__pre">
        <code>
          {startLine != null
            ? lines.map((line, i) => (
                <span key={i} className="rl-agent-code__line">
                  <span className="rl-agent-code__ln" aria-hidden="true">
                    {startLine + i}
                  </span>
                  <span className="rl-agent-code__text">{line}</span>
                  {i < lines.length - 1 ? '\n' : null}
                </span>
              ))
            : code}
        </code>
      </pre>
    </div>
  );
}

export interface MetaEntry {
  label: React.ReactNode;
  value: React.ReactNode;
  mono?: boolean;
}

/** Key/value facts of a detail view (`<dl>`); entries with an empty value are dropped. */
export function MetaList({
  items,
  label,
  className,
}: {
  items: Array<MetaEntry | false | null | undefined | ''>;
  label?: string;
  className?: string;
}) {
  const shown = items.filter((x): x is MetaEntry => !!x && x.value != null && x.value !== '' && x.value !== false);
  if (shown.length === 0) return null;
  return (
    <dl className={cx('rl-agent-tool-meta', className)} aria-label={label}>
      {shown.map((item, i) => (
        <div key={i} className="rl-agent-tool-meta__item">
          <dt>{item.label}</dt>
          <dd data-mono={item.mono || undefined}>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** One-line notice inside a detail: icon + text, toned. Not a live region. */
export function Notice({
  tone = 'neutral',
  children,
  action,
  id,
}: {
  tone?: 'neutral' | 'info' | 'warning' | 'danger' | 'success';
  children: React.ReactNode;
  action?: React.ReactNode;
  id?: string;
}) {
  const icon: AgentIconName = tone === 'warning' || tone === 'danger' ? 'warning' : tone === 'success' ? 'check' : 'info';
  return (
    <div className="rl-agent-notice" data-tone={tone}>
      <AgentIcon name={icon} />
      <p className="rl-agent-notice__text" id={id}>
        {children}
      </p>
      {action != null && <span className="rl-agent-notice__action">{action}</span>}
    </div>
  );
}

/** Pretty-print JSON content; anything that does not parse is returned untouched. */
export function prettyJson(content: string): string {
  try {
    return JSON.stringify(JSON.parse(content), null, 2);
  } catch {
    return content;
  }
}

/** Serialise an arbitrary value for display (strings stay as-is unless they hold JSON). */
export function toDisplayJson(value: unknown): string {
  if (value === undefined) return '';
  if (typeof value === 'string') return prettyJson(value);
  try {
    return JSON.stringify(value, null, 2) ?? String(value);
  } catch {
    return String(value);
  }
}

/** Maximum number of rows that still get an entrance when they arrive together. */
export const ENTRANCE_BATCH_LIMIT = 20;

/**
 * Tracks which ids appeared after the first render. Returns, per id, its index within the batch
 * that just arrived (for stagger) or `-1` for rows present at mount / already seen. Batches larger
 * than `ENTRANCE_BATCH_LIMIT` get no entrance at all (history restore, page loads).
 */
export function useFreshIndex(ids: readonly string[]): (id: string) => number {
  const known = React.useRef<Set<string> | null>(null);
  if (known.current === null) known.current = new Set(ids);
  const seen = known.current;
  const fresh = ids.filter((id) => !seen.has(id));
  React.useEffect(() => {
    for (const id of ids) seen.add(id);
  });
  const allow = fresh.length > 0 && fresh.length <= ENTRANCE_BATCH_LIMIT;
  return (id: string) => (allow ? fresh.indexOf(id) : -1);
}

/** Statuses that mean "still moving". */
export const ACTIVE_TOOL_STATUSES: readonly ToolStatus[] = ['queued', 'running', 'waiting-approval', 'waiting-user', 'waiting-children'];
export const FAILED_TOOL_STATUSES: readonly ToolStatus[] = ['failed', 'denied', 'timed-out'];

/** Fixed display order for aggregated status counts. */
export const TOOL_STATUS_ORDER: readonly ToolStatus[] = [
  'running',
  'queued',
  'waiting-approval',
  'waiting-user',
  'waiting-children',
  'unknown',
  'failed',
  'timed-out',
  'denied',
  'partial',
  'cancelled',
  'completed',
];

export function countStatuses(statuses: readonly ToolStatus[]): Array<[ToolStatus, number]> {
  const counts = new Map<ToolStatus, number>();
  for (const s of statuses) counts.set(s, (counts.get(s) ?? 0) + 1);
  return TOOL_STATUS_ORDER.filter((s) => counts.has(s)).map((s) => [s, counts.get(s)!]);
}
