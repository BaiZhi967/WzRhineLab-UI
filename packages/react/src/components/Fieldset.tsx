import * as React from 'react';
import { Fieldset as BaseFieldset } from '@base-ui/react/fieldset';
import { cx } from '../utils/cx.js';

type BaseRootProps = React.ComponentProps<typeof BaseFieldset.Root>;

export type FieldsetProps = Omit<BaseRootProps, 'className' | 'style' | 'render' | 'children'> & {
  /** Section title; names the group for assistive tech. */
  legend: React.ReactNode;
  /** Read after the legend as the group's description. */
  description?: React.ReactNode;
  /** `disabled` disables every Field and control inside, including Base UI ones. */
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
};

/**
 * Groups related fields under a visible legend (a native `<fieldset>`):
 *
 *   <Fieldset legend="联系方式" description="用于复核提醒。">
 *     <Field label="邮箱"><Input type="email" /></Field>
 *   </Fieldset>
 */
export const Fieldset = React.forwardRef<HTMLElement, FieldsetProps>(function Fieldset(
  { legend, description, className, style, children, ...rest },
  ref,
) {
  const descriptionId = React.useId();
  return (
    <BaseFieldset.Root
      {...rest}
      ref={ref}
      className={cx('rl-fieldset', className)}
      style={style}
      data-slot="fieldset"
      aria-describedby={description != null ? descriptionId : undefined}
    >
      <BaseFieldset.Legend className="rl-fieldset__legend">{legend}</BaseFieldset.Legend>
      {description != null && (
        <p id={descriptionId} className="rl-fieldset__description">
          {description}
        </p>
      )}
      <div className="rl-fieldset__body">{children}</div>
    </BaseFieldset.Root>
  );
});
