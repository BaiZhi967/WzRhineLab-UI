'use client';

import * as React from 'react';
import { Field as BaseField } from '@base-ui/react/field';
import { Fieldset as BaseFieldset } from '@base-ui/react/fieldset';
import { Radio as BaseRadio } from '@base-ui/react/radio';
import { RadioGroup as BaseRadioGroup } from '@base-ui/react/radio-group';
import { cx } from '../utils/cx.js';
import { ChoiceGroupContext, FieldErrorMessage, LabelText } from './fieldParts.js';
import type { ChoiceOrientation } from './Checkbox.js';
import type { FieldValidationMode } from './Field.js';

/**
 * Single choice from a short, fully visible list (≤ 6 options; use Select beyond that).
 * Arrow keys move and select within the group; Tab enters at the checked option.
 *
 *   <RadioGroup label="保密级别" name="level" defaultValue="internal">
 *     <Radio value="public" label="公开" />
 *     <Radio value="internal" label="内部" description="仅本机构成员可见。" />
 *   </RadioGroup>
 */

type BaseGroupProps = React.ComponentProps<typeof BaseRadioGroup>;

export type RadioGroupProps = Pick<BaseGroupProps, 'value' | 'defaultValue' | 'onValueChange' | 'readOnly'> & {
  label: React.ReactNode;
  description?: React.ReactNode;
  /** Shown when nothing is chosen on submit (`required`) or when `invalid` is set. */
  error?: React.ReactNode;
  invalid?: boolean;
  name?: string;
  required?: boolean;
  optional?: boolean;
  disabled?: boolean;
  validationMode?: FieldValidationMode;
  orientation?: ChoiceOrientation;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
};

export const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(function RadioGroup(
  {
    label,
    description,
    error,
    invalid,
    name,
    required = false,
    optional = false,
    disabled,
    validationMode,
    orientation = 'vertical',
    className,
    style,
    children,
    ...groupProps
  },
  ref,
) {
  const match = invalid ? true : undefined;
  return (
    <BaseField.Root
      ref={ref}
      name={name}
      disabled={disabled}
      invalid={invalid}
      validationMode={validationMode}
      className={cx('rl-choice-group', className)}
      style={style}
      data-slot="radio-group"
    >
      <BaseFieldset.Root
        className="rl-choice-group__fieldset"
        render={<BaseRadioGroup {...groupProps} required={required} disabled={disabled} />}
      >
        <BaseFieldset.Legend className="rl-choice-group__legend">
          <LabelText label={label} required={required} optional={optional} />
        </BaseFieldset.Legend>
        <div className="rl-choice-group__items" data-orientation={orientation}>
          <ChoiceGroupContext.Provider value="radio">{children}</ChoiceGroupContext.Provider>
        </div>
      </BaseFieldset.Root>
      {description != null && <BaseField.Description className="rl-field__description">{description}</BaseField.Description>}
      {(error != null || name != null) && <FieldErrorMessage error={error} match={match} name={name} />}
    </BaseField.Root>
  );
});

type BaseRadioProps = React.ComponentProps<typeof BaseRadio.Root>;

export type RadioProps = Omit<
  BaseRadioProps,
  'className' | 'style' | 'render' | 'children' | 'nativeButton' | 'value' | 'aria-label' | 'aria-labelledby'
> & {
  value: string;
  label: React.ReactNode;
  /** The name comes from `label`; a second naming channel would drift from the visible text. */
  'aria-label'?: never;
  'aria-labelledby'?: never;
  description?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

export const Radio = React.forwardRef<HTMLElement, RadioProps>(function Radio(
  { value, label, description, disabled, className, style, ...rest },
  ref,
) {
  // Outside <RadioGroup> Base UI throws (Field.Item needs a Field.Root), which is the intended failure.
  return (
    <BaseField.Item className={cx('rl-choice', className)} style={style} disabled={disabled} data-kind="radio">
      <BaseField.Label className="rl-choice__label">
        <BaseRadio.Root {...rest} ref={ref} value={value} disabled={disabled} className="rl-radio" data-slot="radio">
          <BaseRadio.Indicator className="rl-radio__indicator" keepMounted />
        </BaseRadio.Root>
        <span className="rl-choice__text">{label}</span>
      </BaseField.Label>
      {description != null && (
        <BaseField.Description className="rl-choice__description">{description}</BaseField.Description>
      )}
    </BaseField.Item>
  );
});
