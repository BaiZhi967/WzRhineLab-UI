import * as React from 'react';
import { Field as BaseField } from '@base-ui/react/field';
import { cx } from '../utils/cx.js';

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
        <span>{label}</span>
        {required && (
          <span className="rl-field__required" aria-hidden="true">
            *
          </span>
        )}
        {optional && !required && <span className="rl-field__optional">（可选）</span>}
      </BaseField.Label>
      <div className="rl-field__body">
        {children}
        {description != null && <BaseField.Description className="rl-field__description">{description}</BaseField.Description>}
        {error != null && (
          <BaseField.Error className="rl-field__error" match={match}>
            <svg className="rl-field__error-icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
              <path d="M8 1.75 15 14.25H1L8 1.75Z" />
              <path d="M8 6.5v3.25M8 11.75v.01" />
            </svg>
            <span>{error}</span>
          </BaseField.Error>
        )}
      </div>
    </BaseField.Root>
  );
});
