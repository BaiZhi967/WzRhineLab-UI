'use client';

import * as React from 'react';
import { useRhineLocale } from '../provider/messages.js';
import { cx } from '../utils/cx.js';
import { Skeleton } from './Skeleton.js';

/**
 * Labelled figure with an optional change (ADR-0005 §5). A rise is not assumed to be good:
 * the caller sets `delta.tone`. Missing values show "—" and are read as "无数据"; the component
 * never substitutes 0.
 *
 *   <Stat label="待复核记录" value={128} unit="条" delta={{ value: -12, label: '较上周' }} />
 */

export type StatTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

export interface StatDelta {
  /** Signed change. The sign drives the arrow; it says nothing about good or bad. */
  value: number;
  /** Displayed change; defaults to the signed number (e.g. "+12", "−3"). */
  text?: React.ReactNode;
  /** Context, e.g. "较上周". */
  label?: React.ReactNode;
  tone?: StatTone;
}

export type StatProps = Omit<React.HTMLAttributes<HTMLElement>, 'children'> & {
  label: React.ReactNode;
  /** Number or preformatted text. `null` / `undefined` = no data. */
  value: number | string | null | undefined;
  /** Formatting for numeric `value` (Intl.NumberFormat). */
  format?: Intl.NumberFormatOptions;
  locale?: Intl.LocalesArgument;
  unit?: React.ReactNode;
  delta?: StatDelta;
  /** Business status of the figure; shown as a side rule, never as the only signal. */
  status?: StatTone;
  description?: React.ReactNode;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  /** Spoken text for missing values. */
  emptyLabel?: string;
};

function DeltaIcon({ direction }: { direction: 'up' | 'down' | 'flat' }) {
  const d = direction === 'up' ? 'M8 12.5V3.5M4 7.5l4-4 4 4' : direction === 'down' ? 'M8 3.5v9M4 8.5l4 4 4-4' : 'M3.5 8h9';
  return (
    <svg className="rl-stat__delta-icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d={d} />
    </svg>
  );
}

export const Stat = React.forwardRef<HTMLElement, StatProps>(function Stat(
  {
    label,
    value,
    format,
    locale,
    unit,
    delta,
    status,
    description,
    loading = false,
    size = 'md',
    emptyLabel: emptyLabelProp,
    className,
    ...rest
  },
  ref,
) {
  const { messages, locale: contextLocale } = useRhineLocale();
  // ADR-0009 §3: the component's own `locale` wins over the provider's.
  const numberLocale = locale ?? contextLocale;
  const emptyLabel = emptyLabelProp ?? messages.stat.empty;
  const empty = value === null || value === undefined || value === '';
  const display = empty ? null : typeof value === 'number' ? new Intl.NumberFormat(numberLocale, format).format(value) : value;
  const direction = delta ? (delta.value > 0 ? 'up' : delta.value < 0 ? 'down' : 'flat') : null;
  const deltaText =
    delta?.text ??
    (delta ? `${delta.value > 0 ? '+' : delta.value < 0 ? '−' : '±'}${new Intl.NumberFormat(numberLocale).format(Math.abs(delta.value))}` : null);

  return (
    <dl
      {...rest}
      ref={ref as React.Ref<HTMLDListElement>}
      className={cx('rl-stat', className)}
      data-slot="stat"
      data-size={size}
      data-status={status}
      aria-busy={loading || undefined}
    >
      <dt className="rl-stat__label">{label}</dt>
      <dd className="rl-stat__value" data-empty={(!loading && empty) || undefined}>
        {loading ? (
          <Skeleton className="rl-stat__skeleton" width="calc(var(--rl-space-16) * 1.25)" />
        ) : empty ? (
          <>
            <span aria-hidden="true">—</span>
            <span className="rl-visually-hidden">{emptyLabel}</span>
          </>
        ) : (
          <>
            <span className="rl-stat__number">{display}</span>
            {unit != null && <span className="rl-stat__unit">{unit}</span>}
          </>
        )}
        {loading && <span className="rl-visually-hidden">{messages.stat.loading}</span>}
      </dd>
      {delta && direction && !loading && (
        <dd className="rl-stat__delta" data-tone={delta.tone ?? 'neutral'} data-direction={direction}>
          <DeltaIcon direction={direction} />
          <span className="rl-visually-hidden">{messages.stat[direction]}</span>
          <span className="rl-stat__delta-value">{deltaText}</span>
          {delta.label != null && <span className="rl-stat__delta-label">{delta.label}</span>}
        </dd>
      )}
      {description != null && <dd className="rl-stat__description">{description}</dd>}
    </dl>
  );
});
