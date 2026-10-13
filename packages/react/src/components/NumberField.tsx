'use client';

import * as React from 'react';
import { Field as BaseField } from '@base-ui/react/field';
import { NumberField as BaseNumberField } from '@base-ui/react/number-field';
import { useRhineLocale } from '../provider/messages.js';
import { cx } from '../utils/cx.js';
import { FieldErrorMessage, LabelText } from './fieldParts.js';
import type { InputSize } from './Input.js';

/**
 * Numeric input with stepper buttons on Base UI NumberField + Field (ADR-0010 §2). Label,
 * description and error are wired like `Field` (aria-labelledby / aria-describedby /
 * aria-invalid). The visible text input parses and formats with the provider locale; a hidden
 * native input carries the raw number for form submission under `name`.
 *
 * Keyboard (Base UI): ↑/↓ step, Shift + arrow takes `largeStep`, Alt + arrow `smallStep`,
 * Home/End jump to min/max (when set). The stepper buttons are out of the Tab order (the
 * arrows do the same) but stay reachable for pointer and touch; their names come from the
 * message table (`numberField.increment` / `decrement`).
 *
 *   <NumberField label="并发上限" min={1} max={16} defaultValue={4} name="concurrency" />
 */

export type NumberFieldProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'defaultValue' | 'onChange'> & {
  label: React.ReactNode;
  hideLabel?: boolean;
  description?: React.ReactNode;
  /** Error text: shows on native validity failure, or always together with `invalid`. */
  error?: React.ReactNode;
  invalid?: boolean;
  required?: boolean;
  optional?: boolean;
  /** `null` means empty. */
  value?: number | null;
  defaultValue?: number;
  onValueChange?: (value: number | null) => void;
  /** Fires on blur after typing and on pointer release after stepping. */
  onValueCommitted?: (value: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  largeStep?: number;
  smallStep?: number;
  /** Intl options for display and parsing (e.g. `{ style: 'percent' }`); locale comes from RhineProvider. */
  format?: Intl.NumberFormatOptions;
  /** Snap stepped values to multiples of `step`. */
  snapOnStep?: boolean;
  name?: string;
  disabled?: boolean;
  readOnly?: boolean;
  size?: InputSize;
  placeholder?: string;
  /** Trailing unit text (e.g. "个"), read as part of the description. */
  unit?: React.ReactNode;
  inherited?: string | number | boolean;
  submitOnEnter?: boolean;
  /** Ref to the visible text input. */
  inputRef?: React.Ref<HTMLInputElement>;
  ref?: React.Ref<HTMLDivElement>;
};

function Minus() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="M3.5 8h9" />
    </svg>
  );
}

function Plus() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="M3.5 8h9M8 3.5v9" />
    </svg>
  );
}

export function NumberField({
  label,
  hideLabel = false,
  description,
  error,
  invalid,
  required = false,
  optional = false,
  value,
  defaultValue,
  onValueChange,
  onValueCommitted,
  min,
  max,
  step,
  largeStep,
  smallStep,
  format,
  snapOnStep,
  name,
  disabled,
  readOnly,
  size = 'md',
  placeholder,
  unit,
  inherited,
  submitOnEnter = true,
  inputRef,
  className,
  style,
  ref,
  ...rest
}: NumberFieldProps) {
  const { messages, locale } = useRhineLocale();
  const unitId = React.useId();
  const match = invalid ? true : undefined;
  return (
    <BaseField.Root
      {...rest}
      ref={ref}
      name={name}
      invalid={invalid}
      disabled={disabled}
      className={cx('rl-field', 'rl-number-field', className)}
      style={style}
      data-slot="number-field"
      data-required={required || undefined}
    >
      <BaseField.Label className={cx('rl-field__label', hideLabel && 'rl-visually-hidden')}>
        <LabelText label={label} required={required} optional={optional} />
      </BaseField.Label>
      <div className="rl-field__body">
        <BaseNumberField.Root
          name={name}
          value={value}
          defaultValue={defaultValue}
          onValueChange={onValueChange ? (next) => onValueChange(next) : undefined}
          onValueCommitted={onValueCommitted ? (next) => onValueCommitted(next) : undefined}
          min={min}
          max={max}
          step={step}
          largeStep={largeStep}
          smallStep={smallStep}
          format={format}
          snapOnStep={snapOnStep}
          locale={locale}
          required={required}
          disabled={disabled}
          readOnly={readOnly}
          className="rl-number-field__root"
        >
          <BaseNumberField.Group
            className="rl-input rl-number-field__group"
            data-size={size}
            data-disabled={disabled || undefined}
            data-readonly={readOnly || undefined}
            data-invalid={invalid || undefined}
          >
            <BaseNumberField.Decrement className="rl-number-field__stepper" aria-label={messages.numberField.decrement} data-position="start">
              <Minus />
            </BaseNumberField.Decrement>
            <BaseNumberField.Input
              ref={inputRef}
              className="rl-input__control rl-number-field__input"
              placeholder={placeholder}
              aria-roledescription={messages.numberField.roleDescription}
              aria-describedby={unit != null ? unitId : undefined}
              data-inherited={inherited || undefined}
              onKeyDown={(event) => {
                if (submitOnEnter && event.key === 'Enter') {
                  event.preventDefault();
                  (event.currentTarget as HTMLInputElement).blur();
                  onValueCommitted?.(value ?? defaultValue ?? null);
                }
              }}
            />
            {unit != null && (
              <span id={unitId} className="rl-input__adornment rl-number-field__unit">
                {unit}
              </span>
            )}
            <BaseNumberField.Increment className="rl-number-field__stepper" aria-label={messages.numberField.increment} data-position="end">
              <Plus />
            </BaseNumberField.Increment>
          </BaseNumberField.Group>
        </BaseNumberField.Root>
        {description != null && <BaseField.Description className="rl-field__description">{description}</BaseField.Description>}
        {(error != null || name != null) && <FieldErrorMessage error={error} match={match} name={name} />}
      </div>
    </BaseField.Root>
  );
}
