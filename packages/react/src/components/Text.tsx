import * as React from 'react';
import { cx } from '../utils/cx';

export type TextVariant =
  | 'display'
  | 'heading-1'
  | 'heading-2'
  | 'heading-3'
  | 'body'
  | 'body-sm'
  | 'label'
  | 'meta'
  | 'mono'
  | 'eyebrow';

export type TextTone = 'primary' | 'muted' | 'subtle' | 'accent' | 'danger' | 'success' | 'warning' | 'info';

export type TextElement =
  | 'p'
  | 'span'
  | 'div'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'label'
  | 'strong'
  | 'em'
  | 'small'
  | 'code'
  | 'time'
  | 'dt'
  | 'dd'
  | 'figcaption'
  | 'legend';

const defaultElement: Record<TextVariant, TextElement> = {
  display: 'h1',
  'heading-1': 'h1',
  'heading-2': 'h2',
  'heading-3': 'h3',
  body: 'p',
  'body-sm': 'p',
  label: 'span',
  meta: 'span',
  mono: 'span',
  eyebrow: 'p',
};

export type TextProps = React.HTMLAttributes<HTMLElement> & {
  /** Type role from the token scale. Visual size is independent of the semantic element. */
  variant?: TextVariant;
  /** Rendered element. Defaults to a sensible element per variant; set it to keep the heading outline correct. */
  as?: TextElement;
  tone?: TextTone;
  /** Clamp to one line with an ellipsis. Pair with `title` when the full text matters. */
  truncate?: boolean;
  /** Tabular numerals for aligned figures in tables and metadata. */
  numeric?: boolean;
  /** Passed through for `as="label"` / `as="time"`. */
  htmlFor?: string;
  dateTime?: string;
};

export const Text = React.forwardRef<HTMLElement, TextProps>(function Text(
  { variant = 'body', as, tone, truncate = false, numeric = false, className, ...rest },
  ref,
) {
  const Element = (as ?? defaultElement[variant]) as React.ElementType;
  return (
    <Element
      {...rest}
      ref={ref}
      className={cx('rl-text', className)}
      data-slot="text"
      data-variant={variant}
      data-tone={tone}
      data-truncate={truncate || undefined}
      data-numeric={numeric || undefined}
    />
  );
});
