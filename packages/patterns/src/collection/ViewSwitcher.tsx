'use client';

import * as React from 'react';
import { cx } from '../utils/cx.js';

/**
 * Toolbar-segmented view switcher (0.3.0-contracts §6.5): a radiogroup over the allowed view
 * options. Switching reports the intent only — keeping query, selection and page intact is the
 * caller's state, never a remount. Icons are never the only label. A `value` outside `options`
 * renders nothing checked; providing a valid fallback is the caller's documented duty.
 */
export interface ViewSwitcherOption<V extends string = string> {
  value: V;
  /** Text label, always rendered; icons are additional. */
  label: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface ViewSwitcherProps<V extends string = string> {
  options: readonly ViewSwitcherOption<V>[];
  value?: V;
  defaultValue?: V;
  onValueChange?: (value: V) => void;
  /** Accessible name of the radiogroup, e.g. "视图". */
  label: string;
  disabled?: boolean;
  className?: string;
}

export function ViewSwitcher<V extends string>({
  options,
  value,
  defaultValue,
  onValueChange,
  label,
  disabled = false,
  className,
}: ViewSwitcherProps<V>) {
  const [internal, setInternal] = React.useState<V | undefined>(defaultValue);
  const current = value ?? internal;
  const enabled = React.useMemo(() => options.filter((option) => !option.disabled), [options]);
  // Roving tabindex anchor: the checked option when it exists, else the first enabled one.
  const anchor = enabled.find((option) => option.value === current)?.value ?? enabled[0]?.value;

  const refs = React.useRef(new Map<V, HTMLButtonElement | null>());
  const select = (next: V) => {
    setInternal(next);
    onValueChange?.(next);
  };
  const move = (delta: 1 | -1) => {
    if (enabled.length === 0) return;
    const at = enabled.findIndex((option) => option.value === current);
    const base = at === -1 ? 0 : at;
    const next = enabled[(base + delta + enabled.length) % enabled.length]!;
    select(next.value);
    refs.current.get(next.value)?.focus();
  };
  const jump = (edge: 'first' | 'last') => {
    const target = edge === 'first' ? enabled[0] : enabled[enabled.length - 1];
    if (!target) return;
    select(target.value);
    refs.current.get(target.value)?.focus();
  };
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      move(1);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      move(-1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      jump('first');
    } else if (event.key === 'End') {
      event.preventDefault();
      jump('last');
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cx('rl-view-switcher', className)}
      data-slot="view-switcher"
      data-disabled={disabled || undefined}
      onKeyDown={handleKeyDown}
    >
      {options.map((option) => {
        const checked = option.value === current;
        return (
          <button
            key={option.value}
            ref={(node) => {
              refs.current.set(option.value, node);
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            disabled={disabled || option.disabled}
            tabIndex={option.value === anchor ? 0 : -1}
            data-checked={checked || undefined}
            className="rl-view-switcher__option"
            onClick={() => select(option.value)}
          >
            {option.icon != null && (
              <span className="rl-view-switcher__icon" aria-hidden="true">
                {option.icon}
              </span>
            )}
            <span className="rl-view-switcher__label">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
