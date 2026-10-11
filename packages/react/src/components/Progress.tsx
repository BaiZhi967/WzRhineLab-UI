'use client';

import * as React from 'react';
import { Meter as BaseMeter } from '@base-ui/react/meter';
import { Progress as BaseProgress } from '@base-ui/react/progress';
import { useRhineLocale } from '../provider/messages.js';
import { cx } from '../utils/cx.js';
import { getMeterState } from './meter-utils.js';
import type { MeterState } from './meter-utils.js';

/**
 * Progress vs Meter (ADR-0005 §2):
 * - Progress: a task advancing over time to completion. `value={null}` = indeterminate.
 * - Meter: a static measurement inside a known range; never "complete", never indeterminate.
 * Both need a visible label; the value is announced as formatted text, not colour.
 */

export type ProgressSize = 'sm' | 'md';
export type ProgressTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

type BaseProgressProps = React.ComponentProps<typeof BaseProgress.Root>;

export type ProgressProps = Omit<
  BaseProgressProps,
  'className' | 'style' | 'render' | 'children' | 'value' | 'getAriaValueText' | 'aria-label' | 'aria-labelledby'
> & {
  label: React.ReactNode;
  /** The accessible name comes from `label`. */
  'aria-label'?: never;
  'aria-labelledby'?: never;
  /** Current value between `min` and `max`; `null` while the total is unknown. */
  value: number | null;
  /** Visible text after the label; defaults to the formatted value (e.g. "42%"). `false` hides it. */
  valueText?: React.ReactNode | false;
  /** Spoken value; defaults to the formatted value, or "进行中" when indeterminate. */
  getValueText?: (formatted: string, value: number | null) => string;
  description?: React.ReactNode;
  size?: ProgressSize;
  tone?: ProgressTone;
  hideLabel?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(function Progress(
  {
    label,
    value,
    valueText,
    getValueText,
    description,
    size = 'md',
    tone = 'neutral',
    hideLabel = false,
    format,
    locale,
    className,
    style,
    ...rest
  },
  ref,
) {
  const descriptionId = React.useId();
  const { messages, locale: contextLocale } = useRhineLocale();
  const fallbackText = (formatted: string, v: number | null) => (v === null ? messages.progress.indeterminate : formatted);
  return (
    <BaseProgress.Root
      {...rest}
      ref={ref}
      locale={locale ?? contextLocale}
      value={value}
      // Without `format`, Base UI shows the share of the range as a percentage; with it, the raw value.
      format={format}
      getAriaValueText={getValueText ?? fallbackText}
      aria-describedby={description != null ? descriptionId : undefined}
      className={cx('rl-progress', className)}
      style={style}
      data-slot="progress"
      data-size={size}
      data-tone={tone}
    >
      <div className={hideLabel ? 'rl-visually-hidden' : 'rl-progress__header'}>
        <BaseProgress.Label className="rl-progress__label">{label}</BaseProgress.Label>
        {valueText !== false &&
          (valueText != null ? (
            <span className="rl-progress__value" aria-hidden="true">
              {valueText}
            </span>
          ) : (
            value !== null && <BaseProgress.Value className="rl-progress__value" aria-hidden="true" />
          ))}
      </div>
      <BaseProgress.Track className="rl-progress__track">
        <BaseProgress.Indicator className="rl-progress__indicator" />
      </BaseProgress.Track>
      {description != null && (
        <p id={descriptionId} className="rl-progress__description">
          {description}
        </p>
      )}
    </BaseProgress.Root>
  );
});

type BaseMeterProps = React.ComponentProps<typeof BaseMeter.Root>;

export type MeterProps = Omit<
  BaseMeterProps,
  'className' | 'style' | 'render' | 'children' | 'getAriaValueText' | 'aria-label' | 'aria-labelledby'
> & {
  label: React.ReactNode;
  /** The accessible name comes from `label`. */
  'aria-label'?: never;
  'aria-labelledby'?: never;
  /** Values below `low` / above `high` are out of the preferred range (like native <meter>). */
  low?: number;
  high?: number;
  /** Where the good region is; decides whether low or high values are the warning side. */
  optimum?: number;
  /** Visible value text; defaults to the formatted value. */
  valueText?: React.ReactNode | false;
  getValueText?: (formatted: string, value: number) => string;
  /** Text for the derived state, appended to the spoken value: e.g. { warning: '偏高' }. */
  stateLabels?: Partial<Record<MeterState, string>>;
  description?: React.ReactNode;
  size?: ProgressSize;
  hideLabel?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

const meterTone: Record<MeterState, ProgressTone> = { optimum: 'success', suboptimum: 'warning', critical: 'danger' };

export const Meter = React.forwardRef<HTMLDivElement, MeterProps>(function Meter(
  {
    label,
    value,
    min = 0,
    max = 100,
    low,
    high,
    optimum,
    valueText,
    getValueText,
    stateLabels,
    description,
    size = 'md',
    hideLabel = false,
    locale,
    className,
    style,
    ...rest
  },
  ref,
) {
  const descriptionId = React.useId();
  const { messages, locale: contextLocale } = useRhineLocale();
  const hasThresholds = low != null || high != null;
  const state = getMeterState(value, { min, max, low, high, optimum });
  const stateText = hasThresholds ? stateLabels?.[state] : undefined;
  const spoken = (formatted: string, v: number) => {
    const base = getValueText ? getValueText(formatted, v) : formatted;
    return stateText ? messages.progress.meterValue(base, stateText) : base;
  };
  return (
    <BaseMeter.Root
      {...rest}
      ref={ref}
      locale={locale ?? contextLocale}
      value={value}
      min={min}
      max={max}
      getAriaValueText={spoken}
      aria-describedby={description != null ? descriptionId : undefined}
      className={cx('rl-progress', 'rl-meter', className)}
      style={style}
      data-slot="meter"
      data-size={size}
      data-tone={hasThresholds ? meterTone[state] : 'neutral'}
      data-state={hasThresholds ? state : undefined}
    >
      <div className={hideLabel ? 'rl-visually-hidden' : 'rl-progress__header'}>
        <BaseMeter.Label className="rl-progress__label">{label}</BaseMeter.Label>
        {valueText !== false && (
          <span className="rl-progress__value" aria-hidden="true">
            {valueText ?? <BaseMeter.Value />}
            {stateText && <span className="rl-meter__state">{stateText}</span>}
          </span>
        )}
      </div>
      <BaseMeter.Track className="rl-progress__track">
        <BaseMeter.Indicator className="rl-progress__indicator" />
      </BaseMeter.Track>
      {description != null && (
        <p id={descriptionId} className="rl-progress__description">
          {description}
        </p>
      )}
    </BaseMeter.Root>
  );
});
