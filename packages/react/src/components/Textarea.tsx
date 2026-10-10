import * as React from 'react';
import { Field as BaseField } from '@base-ui/react/field';
import { cx } from '../utils/cx.js';

type BaseControlProps = React.ComponentProps<typeof BaseField.Control>;

export type TextareaResize = 'vertical' | 'none';

export type TextareaProps = Omit<
  React.ComponentPropsWithoutRef<'textarea'>,
  'className' | 'style' | 'defaultValue' | 'value'
> & {
  value?: string;
  defaultValue?: string;
  onValueChange?: BaseControlProps['onValueChange'];
  /** Grow with the content (where `field-sizing` is supported) between `rows` and `maxRows`. */
  autoResize?: boolean;
  /** Upper bound for `autoResize`, in lines. Beyond it the textarea scrolls. */
  maxRows?: number;
  resize?: TextareaResize;
  /**
   * Shows "已输入 n / maxLength" under the control and links it as a description.
   * Requires `maxLength`.
   */
  showCount?: boolean;
  mono?: boolean;
  /** Mark invalid outside a Field (inside a Field, validity comes from Field). */
  invalid?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * Multi-line text on Base UI Field.Control: inside `<Field>` it picks up label, description,
 * error and validity like `Input`; standalone it needs `aria-label`.
 *
 *   <Field label="复核意见" description="不超过 500 字。">
 *     <Textarea name="note" rows={4} maxLength={500} showCount autoResize />
 *   </Field>
 */
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    rows = 3,
    maxRows,
    autoResize = false,
    resize = 'vertical',
    showCount = false,
    mono = false,
    invalid,
    disabled,
    readOnly,
    maxLength,
    value,
    defaultValue,
    onValueChange,
    className,
    style,
    ...rest
  },
  ref,
) {
  const countId = React.useId();
  const [length, setLength] = React.useState(() => (value ?? defaultValue ?? '').length);
  const current = value !== undefined ? value.length : length;
  const counting = showCount && maxLength != null;
  const describedBy = [rest['aria-describedby'], counting ? countId : undefined].filter(Boolean).join(' ') || undefined;

  const vars = {
    '--rl-textarea-rows': rows,
    ...(maxRows != null ? { '--rl-textarea-max-rows': maxRows } : null),
  } as React.CSSProperties;

  return (
    <span
      className={cx('rl-textarea', className)}
      style={{ ...vars, ...style }}
      data-slot="textarea"
      data-auto-resize={autoResize || undefined}
      data-resize={resize}
      data-mono={mono || undefined}
      data-disabled={disabled || undefined}
      data-readonly={readOnly || undefined}
      data-invalid={invalid || undefined}
    >
      <BaseField.Control
        {...(rest as Omit<BaseControlProps, 'render'>)}
        render={<textarea rows={rows} />}
        ref={ref as React.Ref<HTMLInputElement>}
        disabled={disabled}
        readOnly={readOnly}
        maxLength={maxLength}
        {...(value !== undefined ? { value } : { defaultValue })}
        onValueChange={(next, details) => {
          setLength(next.length);
          onValueChange?.(next, details);
        }}
        {...(invalid ? { 'aria-invalid': true } : null)}
        aria-describedby={describedBy}
        className="rl-textarea__control"
      />
      {counting && (
        <span id={countId} className="rl-textarea__count" data-over={current >= maxLength! || undefined}>
          已输入 {current} / {maxLength}
        </span>
      )}
    </span>
  );
});
