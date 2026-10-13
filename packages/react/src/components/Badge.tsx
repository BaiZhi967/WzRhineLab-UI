'use client';

import * as React from 'react';
import { cx } from '../utils/cx.js';
import { Icon } from './Icon.js';

export type CountBadgeProps = Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> & {
  value: number;
  max?: number;
  live?: boolean;
};

export function CountBadge({ value, max = 99, live = false, className, ...rest }: CountBadgeProps) {
  if (value <= 0) return null;
  const text = value > max ? `${max}+` : String(value);
  return <span {...rest} className={cx('rl-count-badge', className)} data-live={live || undefined} role={live ? 'status' : undefined}>{text}</span>;
}

export type TagProps = Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> & {
  children: React.ReactNode;
  tone?: 'neutral' | 'invalid';
  onRemove?: () => void;
  disabled?: boolean;
};

export function Tag({ children, tone = 'neutral', onRemove, disabled = false, className, ...rest }: TagProps) {
  const label = typeof children === 'string' ? children : 'tag';
  return <span {...rest} className={cx('rl-tag', className)} data-tone={tone} data-disabled={disabled || undefined}>
    <span className="rl-tag__label">{children}</span>
    {onRemove && <button type="button" className="rl-tag__remove" aria-label={`Remove ${label}`} disabled={disabled} onClick={onRemove}><Icon name="X" size={14} /></button>}
  </span>;
}
