import * as React from 'react';
import { Field as BaseField } from '@base-ui/react/field';
import { cx } from '../utils/cx.js';
import { FieldErrorMessage, LabelText } from './fieldParts.js';

/**
 * Form field built on Base UI Field (ADR-0001): label, description and error are
 * wired to the control via aria-labelledby / aria-describedby / aria-invalid automatically.
 *
 * Simple form:
 *   <Field label="记录编号" description="由归档系统分配" error="请填写记录编号" required>
 *     <Input name="id" />
 *   </Field>
 */

type BaseRootProps = React.ComponentProps<typeof BaseField.Root>;

export type FieldValidationMode = 'onSubmit' | 'onBlur' | 'onChange';

export type FieldProps = Omit<BaseRootProps, 'className' | 'style' | 'render' | 'children'> & {
  label: React.ReactNode;
  /** Persistent hint, read after the label. Keep it about the expected format, not marketing copy. */
  description?: React.ReactNode;
  /**
   * Error text. A string shows on any native validity failure; pass `invalid` together
   * with `error` to drive it from an external validator.
   */
  error?: React.ReactNode;
  /** Restrict when `error` is shown to one ValidityState key (e.g. `valueMissing`). */
  errorMatch?: React.ComponentProps<typeof BaseField.Error>['match'];
  /** Visual + semantic required marker. Also set `required` on the control for native validation. */
  required?: boolean;
  /** Visually de-emphasised "(可选)" suffix for optional fields in mostly-required forms. */
  optional?: boolean;
  /** Stack (default) or place the label in a fixed-width column on wide containers. */
  layout?: 'stacked' | 'inline';
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
};

export const Field = React.forwardRef<HTMLDivElement, FieldProps>(function Field(
  {
    label,
    description,
    error,
    errorMatch,
    required = false,
    optional = false,
    invalid,
    layout = 'stacked',
    className,
    style,
    children,
    ...rest
  },
  ref,
) {
  // An externally driven error (`invalid` + `error`) must always render; otherwise follow native validity.
  const match = errorMatch ?? (invalid ? true : undefined);
  return (
    <BaseField.Root
      {...rest}
      ref={ref}
      invalid={invalid}
      className={cx('rl-field', className)}
      style={style}
      data-slot="field"
      data-layout={layout}
      data-required={required || undefined}
    >
      <BaseField.Label className="rl-field__label">
        <LabelText label={label} required={required} optional={optional} />
      </BaseField.Label>
      <div className="rl-field__body">
        {children}
        {description != null && <BaseField.Description className="rl-field__description">{description}</BaseField.Description>}
        {error != null && <FieldErrorMessage error={error} match={match} />}
      </div>
    </BaseField.Root>
  );
});
