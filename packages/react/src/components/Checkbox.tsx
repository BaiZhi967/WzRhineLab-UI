import * as React from 'react';
import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox';
import { CheckboxGroup as BaseCheckboxGroup } from '@base-ui/react/checkbox-group';
import { Field as BaseField } from '@base-ui/react/field';
import { Fieldset as BaseFieldset } from '@base-ui/react/fieldset';
import { cx } from '../utils/cx.js';
import { ChoiceGroupContext, FieldErrorMessage, LabelText } from './fieldParts.js';
import type { FieldValidationMode } from './Field.js';

/**
 * Checkbox on Base UI Checkbox (ADR-0001). The whole row — box and text — is one `<label>`,
 * so the text is the accessible name and the click target. Inside `<CheckboxGroup>` the
 * checkbox becomes a group item and its `value` is submitted under the group's `name`.
 *
 *   <Checkbox name="notify" label="复核完成后通知我" description="通过联系邮箱发送。" />
 */

type BaseRootProps = React.ComponentProps<typeof BaseCheckbox.Root>;

export type CheckboxProps = Omit<
  BaseRootProps,
  'className' | 'style' | 'render' | 'children' | 'nativeButton' | 'aria-label' | 'aria-labelledby'
> & {
  /** Visible label and accessible name. Use `hideLabel` where the context already shows it (table rows). */
  label: React.ReactNode;
  /** The name comes from `label`; a second naming channel would drift from the visible text. */
  'aria-label'?: never;
  'aria-labelledby'?: never;
  /** Keep the label for assistive tech only. */
  hideLabel?: boolean;
  description?: React.ReactNode;
  /** Error text for a standalone checkbox (e.g. a required confirmation). Ignored inside a group. */
  error?: React.ReactNode;
  /** Drive the error state from an external validator; pair with `error`. */
  invalid?: boolean;
  validationMode?: FieldValidationMode;
  className?: string;
  style?: React.CSSProperties;
};

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="m3.5 8.25 3 3 6-6.5" />
    </svg>
  );
}

function MixedIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="M4 8h8" />
    </svg>
  );
}

export const Checkbox = React.forwardRef<HTMLElement, CheckboxProps>(function Checkbox(
  {
    label,
    hideLabel = false,
    description,
    error,
    invalid,
    validationMode,
    required,
    disabled,
    name,
    indeterminate,
    className,
    style,
    ...rest
  },
  ref,
) {
  const inGroup = React.useContext(ChoiceGroupContext) === 'checkbox';

  const control = (
    <BaseField.Label className="rl-choice__label">
      <BaseCheckbox.Root
        {...rest}
        ref={ref}
        name={inGroup ? undefined : name}
        required={required}
        disabled={inGroup ? disabled : undefined}
        indeterminate={indeterminate}
        className="rl-checkbox"
        data-slot="checkbox"
      >
        <BaseCheckbox.Indicator className="rl-checkbox__indicator" keepMounted>
          {indeterminate ? <MixedIcon /> : <CheckIcon />}
        </BaseCheckbox.Indicator>
      </BaseCheckbox.Root>
      <span className={hideLabel ? 'rl-visually-hidden' : 'rl-choice__text'}>
        <LabelText label={label} required={!inGroup && required} />
      </span>
    </BaseField.Label>
  );
  const describe = description != null && (
    <BaseField.Description className="rl-choice__description">{description}</BaseField.Description>
  );

  if (inGroup) {
    return (
      <BaseField.Item className={cx('rl-choice', className)} style={style} disabled={disabled} data-kind="checkbox">
        {control}
        {describe}
      </BaseField.Item>
    );
  }

  return (
    <BaseField.Root
      className={cx('rl-choice', className)}
      style={style}
      name={name}
      disabled={disabled}
      invalid={invalid}
      validationMode={validationMode}
      data-kind="checkbox"
      data-hide-label={hideLabel || undefined}
    >
      {control}
      {describe}
      {error != null && <FieldErrorMessage error={error} match={invalid ? true : undefined} />}
    </BaseField.Root>
  );
});

type BaseGroupProps = React.ComponentProps<typeof BaseCheckboxGroup>;

export type ChoiceOrientation = 'vertical' | 'horizontal';

export type CheckboxGroupProps = Pick<BaseGroupProps, 'value' | 'defaultValue' | 'onValueChange' | 'allValues'> & {
  /** Rendered as the fieldset legend; names the group. */
  label: React.ReactNode;
  description?: React.ReactNode;
  error?: React.ReactNode;
  invalid?: boolean;
  /** Form field name; every checked item submits its `value` under it. */
  name?: string;
  disabled?: boolean;
  /** Custom validation over the checked values; return an error string or null. */
  validate?: React.ComponentProps<typeof BaseField.Root>['validate'];
  validationMode?: FieldValidationMode;
  /** Visual marker only; enforce "at least one" with `validate`. */
  required?: boolean;
  optional?: boolean;
  orientation?: ChoiceOrientation;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
};

/**
 *   <CheckboxGroup label="通知方式" name="channels" defaultValue={['email']}>
 *     <Checkbox value="email" label="邮件" />
 *     <Checkbox value="digest" label="每周摘要" />
 *   </CheckboxGroup>
 */
export const CheckboxGroup = React.forwardRef<HTMLDivElement, CheckboxGroupProps>(function CheckboxGroup(
  {
    label,
    description,
    error,
    invalid,
    name,
    disabled,
    validate,
    validationMode,
    required = false,
    optional = false,
    orientation = 'vertical',
    className,
    style,
    children,
    ...groupProps
  },
  ref,
) {
  return (
    <BaseField.Root
      ref={ref}
      name={name}
      disabled={disabled}
      invalid={invalid}
      validate={validate}
      validationMode={validationMode}
      className={cx('rl-choice-group', className)}
      style={style}
      data-slot="checkbox-group"
    >
      <BaseFieldset.Root
        className="rl-choice-group__fieldset"
        render={<BaseCheckboxGroup {...groupProps} disabled={disabled} />}
      >
        <BaseFieldset.Legend className="rl-choice-group__legend">
          <LabelText label={label} required={required} optional={optional} />
        </BaseFieldset.Legend>
        <div className="rl-choice-group__items" data-orientation={orientation}>
          <ChoiceGroupContext.Provider value="checkbox">{children}</ChoiceGroupContext.Provider>
        </div>
      </BaseFieldset.Root>
      {description != null && <BaseField.Description className="rl-field__description">{description}</BaseField.Description>}
      {error != null && <FieldErrorMessage error={error} match={invalid ? true : undefined} />}
    </BaseField.Root>
  );
});
