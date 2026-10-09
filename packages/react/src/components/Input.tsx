import * as React from 'react';
import { Input as BaseInput } from '@base-ui/react/input';
import { cx } from '../utils/cx';

export type InputSize = 'sm' | 'md' | 'lg';

type BaseInputProps = React.ComponentProps<typeof BaseInput>;

// `prefix` is an RDFa string attribute on HTMLAttributes; replaced by the adornment slot.
export type InputProps = Omit<BaseInputProps, 'className' | 'style' | 'render' | 'size' | 'prefix'> & {
  size?: InputSize;
  /** Decorative leading adornment (icon). Hidden from assistive tech. */
  prefix?: React.ReactNode;
  /** Trailing adornment: unit text such as "mm" is read by screen readers via aria-describedby. */
  suffix?: React.ReactNode;
  /** Monospace value for IDs, codes and measurements. */
  mono?: boolean;
  /** Mark invalid outside a Field (inside a Field, validity comes from Field). */
  invalid?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * Text input on Base UI Input: inside `<Field>` it picks up label, description, error and
 * validity automatically; standalone it still needs an accessible name (`aria-label`).
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { size = 'md', prefix, suffix, mono = false, invalid, className, style, disabled, readOnly, ...rest },
  ref,
) {
  const suffixId = React.useId();
  const describedBy = [rest['aria-describedby'], suffix != null ? suffixId : undefined].filter(Boolean).join(' ') || undefined;
  return (
    <span
      className={cx('rl-input', className)}
      style={style}
      data-slot="input"
      data-size={size}
      data-mono={mono || undefined}
      data-disabled={disabled || undefined}
      data-readonly={readOnly || undefined}
      data-invalid={invalid || undefined}
    >
      {prefix != null && (
        <span className="rl-input__adornment" data-position="start" aria-hidden="true">
          {prefix}
        </span>
      )}
      <BaseInput
        {...rest}
        ref={ref}
        disabled={disabled}
        readOnly={readOnly}
        {...(invalid ? { 'aria-invalid': true } : null)}
        aria-describedby={describedBy}
        className="rl-input__control"
      />
      {suffix != null && (
        <span id={suffixId} className="rl-input__adornment" data-position="end">
          {suffix}
        </span>
      )}
    </span>
  );
});
