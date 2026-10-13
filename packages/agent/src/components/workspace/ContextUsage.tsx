'use client';

import * as React from 'react';
import { Meter, Popover } from '@wzrhine/react';
import type { PopoverAlign, PopoverSide } from '@wzrhine/react';
import { usageLevel, usagePercent } from '@wzrhine/agent-core';
import type { ContextUsageView, UsageStatRow, UsageStatSection } from '@wzrhine/agent-core';
import { useAgentFormat, useAgentMessages } from '../../provider/AgentMessages.js';
import { AgentIcon } from '../../primitives/icons.js';
import { cx } from '../../utils/cx.js';
import { completenessTag, useWorkspaceMessages } from './shared.js';
import type { WorkspaceMessagesProp } from './shared.js';

export type ContextUsageVariant = 'ring' | 'bar' | 'full';

export type ContextUsageProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> & {
  usage: ContextUsageView;
  /**
   * `ring`: compact trigger (ring + 「12.4K / 32K」) that opens the full view in a Popover.
   * `bar`: one line with a meter. `full`: meter, breakdown legend, warnings and note.
   */
  variant?: ContextUsageVariant;
  /** Popover placement for `ring`. */
  side?: PopoverSide;
  align?: PopoverAlign;
  /** `ring`: also open the Popover on hover (focus and click still open it). */
  openOnHover?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  segmentScale?: 'full' | 'fit-used';
  messages?: WorkspaceMessagesProp;
};

interface Derived {
  percent: number | null;
  level: 'normal' | 'near' | 'over' | 'unknown';
  summary: string;
  tag?: string;
  label: string;
}

function useDerived(usage: ContextUsageView, override?: WorkspaceMessagesProp): Derived & { m: ReturnType<typeof useWorkspaceMessages> } {
  const m = useWorkspaceMessages(override);
  const status = useAgentMessages().status;
  const format = useAgentFormat();
  const percent = usagePercent(usage.used, usage.max, usage.completeness);
  const level = usage.completeness === 'unknown' ? 'unknown' : usageLevel(usage.used, usage.max);
  const value = (n: number) => (usage.unit === 'bytes' ? format.bytes(n) : format.compact(n));
  let summary = m.contextUnknown;
  if (usage.used !== undefined && usage.completeness !== 'unknown') {
    summary = usage.max !== undefined && usage.max > 0 ? `${value(usage.used)} / ${value(usage.max)}` : value(usage.used);
  }
  return { m, percent, level, summary, tag: completenessTag(usage.completeness, status.completeness), label: usage.label ?? m.contextTitle };
}

/** The ring: an arc for a reliable percentage, a dashed circle when there is none. */
function Ring({ percent, level }: Pick<Derived, 'percent' | 'level'>) {
  const arc = percent === null ? null : Math.max(0, Math.min(100, percent));
  return (
    <svg className="rl-agent-context__ring" viewBox="0 0 16 16" aria-hidden="true" focusable="false" data-level={level} data-unknown={arc === null || undefined}>
      <circle className="rl-agent-context__ring-track" cx="8" cy="8" r="6" pathLength="100" />
      {arc !== null && <circle className="rl-agent-context__ring-arc" cx="8" cy="8" r="6" pathLength="100" strokeDasharray={`${arc} 100`} />}
    </svg>
  );
}

function Warning({ level, m }: { level: Derived['level']; m: ReturnType<typeof useWorkspaceMessages> }) {
  if (level !== 'near' && level !== 'over') return null;
  return (
    <p className="rl-agent-context__warning" data-level={level}>
      <AgentIcon name="warning" />
      {level === 'over' ? m.contextOver : m.contextNear}
    </p>
  );
}

/** Meter when the percentage is reliable; otherwise plain text (never a role=meter without a max). */
function Measure({ usage, d, size }: { usage: ContextUsageView; d: Derived & { m: ReturnType<typeof useWorkspaceMessages> }; size: 'sm' | 'md' }) {
  const { m, percent, level, summary, tag, label } = d;
  const unit = m.contextUnit[usage.unit];
  if (percent !== null && usage.used !== undefined && usage.max !== undefined) {
    const text = `${summary} · ${m.contextPercent(percent)}`;
    return (
      <Meter
        className="rl-agent-context__meter"
        data-level={level}
        size={size}
        label={
          <>
            {label}
            {tag && <span className="rl-agent-context__tag">{tag}</span>}
          </>
        }
        value={Math.min(usage.used, usage.max)}
        high={usage.max * 0.8}
        optimum={0}
        max={usage.max}
        valueText={text}
        getValueText={() => [summary, unit, m.contextPercent(percent), tag].filter(Boolean).join(' ')}
      />
    );
  }
  return (
    <p className="rl-agent-context__line" data-level={level}>
      <span className="rl-agent-context__label">{label}</span>
      <span className="rl-agent-context__value">
        {summary}
        {usage.used !== undefined && usage.completeness !== 'unknown' && unit ? ` ${unit}` : ''}
      </span>
      {tag && <span className="rl-agent-context__tag">{tag}</span>}
      {(usage.max === undefined || usage.max <= 0) && usage.completeness !== 'unknown' && <span className="rl-agent-context__hint">{m.contextNoMax}</span>}
    </p>
  );
}

function Breakdown({ usage, m }: { usage: ContextUsageView; m: ReturnType<typeof useWorkspaceMessages> }) {
  const format = useAgentFormat();
  const segments = (usage.segments ?? []).filter((s) => s.value > 0);
  if (segments.length === 0) return null;
  const sum = segments.reduce((acc, s) => acc + s.value, 0);
  // With a reliable max the stacked bar shows the share of the window; otherwise the composition.
  const total = usage.max && usage.max > 0 && usage.completeness !== 'unknown' ? Math.max(usage.max, sum) : sum;
  const value = (n: number) => (usage.unit === 'bytes' ? format.bytes(n) : format.compact(n));
  return (
    <div className="rl-agent-context__breakdown">
      <div className="rl-agent-context__stack" aria-hidden="true">
        {segments.map((s) => (
          <span key={s.id} className="rl-agent-context__segment" data-tone={s.tone ?? 'neutral'} style={{ inlineSize: `${(s.value / total) * 100}%` }} />
        ))}
      </div>
      <ul className="rl-agent-context__legend" aria-label={m.contextBreakdown}>
        {segments.map((s) => (
          <li key={s.id} className="rl-agent-context__legend-item">
            <span className="rl-agent-context__swatch" data-tone={s.tone ?? 'neutral'} aria-hidden="true" />
            <span className="rl-agent-context__legend-label">{s.label}</span>
            <span className="rl-agent-context__legend-value">{value(s.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * ContextUsage (atlas 27): context / token budget. A percentage — the ring arc, the Meter — is
 * drawn only when `usagePercent` returns a number (exact or estimated value with a reliable max);
 * unknown or partial data shows text without a `role="meter"`. Non-exact numbers always carry
 * 「估计值」 / 「部分数据」. Near (≥ 80%) and over the limit add a warning sentence, not only colour.
 * `usage.stats` (cache hit rate, TTFT, TPS…) render in the full view and the popover as one
 * `<dl>` per section; a missing value shows 「—」 (read as 「无数据」), never 0.
 *
 * Motion: none of its own (the Popover has its CSS transition); values update directly.
 */
export const ContextUsage = React.forwardRef<HTMLDivElement, ContextUsageProps>(function ContextUsage(
  { usage, variant = 'full', side = 'top', align = 'end', openOnHover, open, onOpenChange, segmentScale = 'full', messages: override, className, ...rest },
  ref,
) {
  const d = useDerived(usage, override);
  const { m, level, summary, tag } = d;

  if (variant === 'ring') {
    return (
      <div {...rest} ref={ref} className={cx('rl-agent-context', className)} data-variant="ring" data-level={level} data-estimated={usage.estimated || usage.completeness === 'estimated' || undefined}>
        <Popover
          side={side}
          align={align}
          size="sm"
          openOnHover={openOnHover}
          open={open}
          onOpenChange={onOpenChange}
          title={m.contextTitle}
          trigger={
            <button type="button" className="rl-agent-context__trigger" data-level={level} aria-label={m.contextTrigger(tag ? `${summary} · ${tag}` : summary)}>
              <Ring percent={d.percent} level={level} />
              <span className="rl-agent-context__value">{summary}</span>
              {tag && <span className="rl-agent-context__tag">{tag}</span>}
            </button>
          }
        >
          <ContextUsageDetail usage={usage} d={d} />
        </Popover>
      </div>
    );
  }

  return (
    <div {...rest} ref={ref} className={cx('rl-agent-context', className)} data-variant={variant} data-level={level} data-estimated={usage.estimated || usage.completeness === 'estimated' || undefined} data-segment-scale={segmentScale}>
      {variant === 'bar' ? (
        <>
          <Measure usage={usage} d={d} size="sm" />
          <Warning level={level} m={m} />
        </>
      ) : (
        <ContextUsageDetail usage={usage} d={d} />
      )}
    </div>
  );
});

function ContextUsageDetail({ usage, d }: { usage: ContextUsageView; d: ReturnType<typeof useDerived> }) {
  return (
    <div className="rl-agent-context__detail">
      <Measure usage={usage} d={d} size="md" />
      <Warning level={d.level} m={d.m} />
      <Breakdown usage={usage} m={d.m} />
      <Stats sections={usage.stats} m={d.m} />
      {usage.note && (
        <p className="rl-agent-context__note">
          <AgentIcon name="info" />
          {usage.note}
        </p>
      )}
    </div>
  );
}

function Stats({ sections, m }: { sections?: UsageStatSection[]; m: ReturnType<typeof useWorkspaceMessages> }) {
  const status = useAgentMessages().status;
  const format = useAgentFormat();
  const id = React.useId();
  const shown = (sections ?? []).filter((s) => s.rows.length > 0);
  if (shown.length === 0) return null;
  const valueOf = (row: UsageStatRow): string => {
    const v = row.value!;
    switch (row.unit) {
      case 'ms':
        return m.contextStatValue(format.duration(v), 'ms');
      case 'tokens':
        return m.contextStatValue(format.compact(v), 'tokens');
      case 'percent':
        return m.contextStatValue(format.number(Math.round(v * 10) / 10), 'percent');
      case 'tokens-per-s':
        return m.contextStatValue(format.number(Math.round(v * 10) / 10), 'tokens-per-s');
      default:
        return m.contextStatValue(format.number(v), 'count');
    }
  };
  return (
    <div className="rl-agent-context__stats" role="group" aria-label={m.contextStats}>
      {shown.map((section, i) => {
        const titleId = `${id}-${i}`;
        return (
          <section key={section.id} className="rl-agent-context__stat-section" aria-labelledby={titleId}>
            <p id={titleId} className="rl-agent-context__stat-title">
              {section.title}
            </p>
            <dl className="rl-agent-context__stat-list">
              {section.rows.map((row, j) => {
                const missing = row.value === undefined || !Number.isFinite(row.value) || row.completeness === 'unknown';
                const tag = !missing && row.completeness ? completenessTag(row.completeness, status.completeness) : undefined;
                return (
                  <div key={`${row.label}-${j}`} className="rl-agent-context__stat">
                    <dt>{row.label}</dt>
                    <dd data-missing={missing || undefined}>
                      {missing ? (
                        <>
                          <span aria-hidden="true">—</span>
                          <span className="rl-agent-sr">{m.contextStatMissing}</span>
                        </>
                      ) : (
                        valueOf(row)
                      )}
                      {tag && <span className="rl-agent-context__tag">{tag}</span>}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </section>
        );
      })}
    </div>
  );
}
