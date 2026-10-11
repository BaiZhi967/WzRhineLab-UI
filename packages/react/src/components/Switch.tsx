'use client';

import * as React from 'react';
import { Field as BaseField } from '@base-ui/react/field';
import { Switch as BaseSwitch } from '@base-ui/react/switch';
import { cx } from '../utils/cx.js';
import { LabelText } from './fieldParts.js';

/**
 * On/off setting that takes effect immediately (role="switch"). For a choice that is only
 * applied on submit, or that needs a "required" check, use Checkbox instead.
 *
 *   <Switch label="自动归档" description="复核通过 30 天后移入归档。" checked={auto} onCheckedChange={setAuto} />
 */

type BaseRootProps = React.ComponentProps<typeof BaseSwitch.Root>;

export type SwitchProps = Omit<
  BaseRootProps,
  'className' | 'style' | 'render' | 'children' | 'nativeButton' | 'required' | 'aria-label' | 'aria-labelledby'
> & {
  label: React.ReactNode;
  hideLabel?: boolean;
  /** The name comes from `label`; a second naming channel would drift from the visible text. */
  'aria-label'?: never;
  'aria-labelledby'?: never;
  description?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

export const Switch = React.forwardRef<HTMLElement, SwitchProps>(function Switch(
  { label, hideLabel = false, description, disabled, name, className, style, ...rest },
  ref,
) {
  return (
    <BaseField.Root
      className={cx('rl-choice', className)}
      style={style}
      name={name}
      disabled={disabled}
      data-kind="switch"
      data-hide-label={hideLabel || undefined}
    >
      <BaseField.Label className="rl-choice__label">
        <BaseSwitch.Root {...rest} ref={ref} className="rl-switch" data-slot="switch">
          <BaseSwitch.Thumb className="rl-switch__thumb" />
        </BaseSwitch.Root>
        <span className={hideLabel ? 'rl-visually-hidden' : 'rl-choice__text'}>
          <LabelText label={label} />
        </span>
      </BaseField.Label>
      {description != null && (
        <BaseField.Description className="rl-choice__description">{description}</BaseField.Description>
      )}
    </BaseField.Root>
  );
});
