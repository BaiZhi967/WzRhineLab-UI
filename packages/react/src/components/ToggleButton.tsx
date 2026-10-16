'use client';

import * as React from 'react';

export type ToggleButtonProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'disabled' | 'aria-pressed'> & {
  children?: React.ReactNode;
  pressed: boolean;
  onPressedChange?: (pressed: boolean) => void;
  disabled?: boolean;
  loading?: boolean;
  iconStart?: React.ReactNode;
};

export const ToggleButton = React.forwardRef<HTMLButtonElement, ToggleButtonProps>(function ToggleButton(
  { children, pressed, onPressedChange, disabled = false, loading = false, iconStart, className, onClick, type = 'button', ...rest },
  ref,
) {
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (loading) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
    if (!event.defaultPrevented && !disabled) onPressedChange?.(!pressed);
  };

  return (
    <button
      {...rest}
      ref={ref}
      type={type}
      disabled={disabled}
      aria-pressed={pressed}
      aria-disabled={loading || undefined}
      aria-busy={loading || undefined}
      data-slot="toggle-button"
      data-pressed={pressed || undefined}
      data-loading={loading || undefined}
      className={['rl-toggle-button', className].filter(Boolean).join(' ')}
      onClick={handleClick}
    >
      {iconStart && <span className="rl-toggle-button__icon" aria-hidden="true">{iconStart}</span>}
      <span className="rl-toggle-button__label">{children}</span>
    </button>
  );
});
