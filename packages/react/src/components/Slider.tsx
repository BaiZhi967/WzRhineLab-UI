'use client';

import * as React from 'react';
import { Slider as BaseSlider } from '@base-ui/react/slider';
import { useRhineLocale } from '../provider/messages.js';
import { cx } from '../utils/cx.js';

/**
 * Value on a continuous or stepped scale, on Base UI Slider (ADR-0010 §2). Each thumb is a
 * native `<input type="range">` (visually hidden inside the thumb), named by the visible `label`
 * through `aria-labelledby`, so the value submits with the form under `name`.
 *
 * Keyboard (Base UI): ←/↓ and →/↑ step, Shift + arrow or PageUp/PageDown take `largeStep`,
 * Home/End jump to min/max. Dragging writes position directly; no transition runs while dragging.
 *
 * Discrete levels (e.g. an effort setting) use `marks`: ticks + labels under the track, and the
 * mark label becomes the spoken value (`aria-valuetext`) when the thumb sits on it.
 *
 *   <Slider label="执行强度" min={0} max={4} marks={levels} defaultValue={2} />
 *   <Slider label="温度范围" defaultValue={[20, 60]} thumbLabels={['下限', '上限']} />
 */

export interface SliderMark {
  value: number;
  /** Visible tick label; also the spoken value when the thumb is on this mark. */
  label?: React.ReactNode;
  /** Spoken text when `label` is not a string. */
  valueText?: string;
}

type SliderValue = number | readonly number[];
/** The value shape `onValueChange` reports: a number for single sliders, an array for ranges. */
export type SliderChangeValue<V extends SliderValue> = V extends number ? number : number[];

export type SliderProps<V extends SliderValue = number> = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'children' | 'defaultValue' | 'onChange' | 'aria-label' | 'aria-labelledby'
> & {
  /** Visible label; names every thumb (required, ADR-0001 naming rule). */
  label: React.ReactNode;
  /** The name comes from `label` (use `thumbLabels` for range thumbs). */
  'aria-label'?: never;
  'aria-labelledby'?: never;
  /** Keep the label for assistive tech only. */
  hideLabel?: boolean;
  description?: React.ReactNode;
  /** Single number, or an array for a range slider (one thumb per entry). */
  value?: V;
  defaultValue?: V;
  onValueChange?: (value: SliderChangeValue<V>) => void;
  /** Fires once per interaction (pointer release, key press). */
  onValueCommitted?: (value: SliderChangeValue<V>) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Step for PageUp / PageDown and Shift + arrow (default 10). */
  largeStep?: number;
  /** Minimum distance, in steps, between range thumbs. */
  minStepsBetweenValues?: number;
  marks?: readonly SliderMark[];
  /** Intl options for the displayed and spoken value; locale comes from RhineProvider. */
  format?: Intl.NumberFormatOptions;
  /** Custom text for one value (display and default `aria-valuetext`). Wins over `format`. */
  formatValue?: (value: number) => string;
  /** Spoken value per thumb; wins over mark labels and `formatValue`. */
  getAriaValueText?: (formattedValue: string, value: number, index: number) => string;
  /** Distinct accessible names for range thumbs (e.g. ['下限', '上限']). */
  thumbLabels?: readonly string[];
  /** Show the current value next to the label (`<output>`). */
  showValue?: boolean;
  name?: string;
  disabled?: boolean;
  ref?: React.Ref<HTMLDivElement>;
};

function markText(mark: SliderMark | undefined): string | undefined {
  if (!mark) return undefined;
  if (mark.valueText != null) return mark.valueText;
  return typeof mark.label === 'string' || typeof mark.label === 'number' ? String(mark.label) : undefined;
}

export function Slider<V extends SliderValue = number>({
  label,
  hideLabel = false,
  description,
  value,
  defaultValue,
  onValueChange,
  onValueCommitted,
  min = 0,
  max = 100,
  step = 1,
  largeStep,
  minStepsBetweenValues,
  marks,
  format,
  formatValue,
  getAriaValueText,
  thumbLabels,
  showValue = false,
  name,
  disabled,
  className,
  ref,
  ...rest
}: SliderProps<V>) {
  const { locale } = useRhineLocale();
  const descriptionId = React.useId();
  const current = value ?? defaultValue;
  const thumbCount = Array.isArray(current) ? current.length : 1;
  const range = max - min || 1;

  const markFor = (v: number) => marks?.find((m) => m.value === v);
  const textFor = (formatted: string, v: number) => markText(markFor(v)) ?? (formatValue ? formatValue(v) : formatted);
  const valueText = (formatted: string, v: number, index: number) =>
    getAriaValueText ? getAriaValueText(formatted, v, index) : textFor(formatted, v);

  // Base UI may hand out a frozen array; copy it so callers can keep and mutate their state.
  const normalize = (next: number | readonly number[]) => (Array.isArray(next) ? [...next] : next) as SliderChangeValue<V>;

  return (
    <BaseSlider.Root<V>
      {...rest}
      ref={ref}
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange ? (next) => onValueChange(normalize(next)) : undefined}
      onValueCommitted={onValueCommitted ? (next) => onValueCommitted(normalize(next)) : undefined}
      min={min}
      max={max}
      step={step}
      largeStep={largeStep}
      minStepsBetweenValues={minStepsBetweenValues}
      format={format}
      locale={locale}
      name={name}
      disabled={disabled}
      className={cx('rl-slider', className)}
      data-slot="slider"
      data-has-marks={marks?.some((m) => m.label != null) || undefined}
    >
      <div className={cx('rl-slider__header', hideLabel && !showValue && 'rl-visually-hidden')}>
        <BaseSlider.Label className={cx('rl-slider__label', hideLabel && 'rl-visually-hidden')}>{label}</BaseSlider.Label>
        {showValue && (
          <BaseSlider.Value className="rl-slider__value">
            {(formatted, values) => values.map((v, i) => textFor(formatted[i] ?? String(v), v)).join(' – ')}
          </BaseSlider.Value>
        )}
      </div>
      <BaseSlider.Control className="rl-slider__control">
        <BaseSlider.Track className="rl-slider__track">
          <BaseSlider.Indicator className="rl-slider__indicator" />
          {Array.from({ length: thumbCount }, (_, index) => (
            <BaseSlider.Thumb
              key={index}
              index={index}
              className="rl-slider__thumb"
              getAriaLabel={thumbLabels ? (i) => thumbLabels[i] ?? '' : undefined}
              getAriaValueText={valueText}
              aria-describedby={description != null ? descriptionId : undefined}
            />
          ))}
        </BaseSlider.Track>
        {marks && marks.length > 0 && (
          <div className="rl-slider__marks" aria-hidden="true">
            {marks.map((mark) => {
              const percent = ((Math.min(max, Math.max(min, mark.value)) - min) / range) * 100;
              return (
                <span
                  key={mark.value}
                  className="rl-slider__mark"
                  data-edge={percent === 0 ? 'start' : percent === 100 ? 'end' : undefined}
                  style={{ '--rl-slider-mark-position': `${percent}%` } as React.CSSProperties}
                >
                  <span className="rl-slider__tick" />
                  {mark.label != null && <span className="rl-slider__mark-label">{mark.label}</span>}
                </span>
              );
            })}
          </div>
        )}
      </BaseSlider.Control>
      {description != null && (
        <p id={descriptionId} className="rl-slider__description">
          {description}
        </p>
      )}
    </BaseSlider.Root>
  );
}
