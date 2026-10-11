'use client';

import * as React from 'react';
import { cx } from '../utils/cx.js';
import { Button } from './Button.js';
import type { ButtonSize, ButtonVariant } from './Button.js';
import { IconButton } from './IconButton.js';
import type { IconButtonVariant } from './IconButton.js';
import { Menu } from './Menu.js';
import type { MenuAlign, MenuSide } from './Menu.js';

/**
 * A primary action with an attached menu of related actions ("导出 CSV ▾ → 导出 JSON / 导出 PDF").
 * Both halves are real `<button>`s inside a `role="group"` named by `label`, drawn in one frame.
 * The main part is the public Button (loading keeps focus and announces busy); the toggle is an
 * IconButton (name from `menuLabel`) that opens the public Menu (Base UI: menu / menuitem
 * semantics, arrow keys, typeahead, Escape returns focus to the toggle). Enter / Space / ↓ on the
 * toggle open the menu. While `loading` the toggle is `aria-disabled` and refuses to open (it keeps
 * focus, so choosing a menu item that starts the busy state never drops focus to the page), and an
 * open menu closes. `disabled` disables both halves natively. Motion: Button press + Menu CSS
 * transition only.
 *
 *   <SplitButton label="导出 CSV" menuLabel="更多导出格式" onClick={exportCsv}>
 *     <MenuItem onSelect={exportJson}>导出 JSON</MenuItem>
 *   </SplitButton>
 */

export type SplitButtonProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'onClick' | 'children' | 'role' | 'aria-label'> & {
  /** Text of the main action; also names the group. */
  label: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /** Accessible name of the menu toggle, e.g. 「更多导出方式」. */
  menuLabel: string;
  /** Menu content: MenuItem, MenuGroup, MenuSeparator… */
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  /** Busy main action; the toggle stays focusable but will not open until it settles. */
  loading?: boolean;
  /** Decorative leading icon of the main action. */
  iconStart?: React.ReactNode;
  menuSide?: MenuSide;
  menuAlign?: MenuAlign;
  menuOpen?: boolean;
  onMenuOpenChange?: (open: boolean) => void;
};

const toggleVariant: Record<ButtonVariant, IconButtonVariant> = {
  primary: 'primary',
  // Accent has no IconButton twin; split.css paints the toggle with the accent tokens.
  accent: 'primary',
  secondary: 'secondary',
  ghost: 'ghost',
};

function Chevron() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" focusable="false">
      <path d="m4 6 4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export const SplitButton = React.forwardRef<HTMLDivElement, SplitButtonProps>(function SplitButton(
  {
    label,
    onClick,
    menuLabel,
    children,
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    iconStart,
    menuSide = 'bottom',
    menuAlign = 'end',
    menuOpen,
    onMenuOpenChange,
    className,
    ...rest
  },
  ref,
) {
  const [innerOpen, setInnerOpen] = React.useState(false);
  const open = (menuOpen ?? innerOpen) && !loading && !disabled;
  const handleOpenChange = (next: boolean) => {
    if (next && loading) return;
    if (menuOpen === undefined) setInnerOpen(next);
    onMenuOpenChange?.(next);
  };
  return (
    <div
      {...rest}
      ref={ref}
      role="group"
      aria-label={label}
      className={cx('rl-split-button', className)}
      data-slot="split-button"
      data-variant={variant}
      data-size={size}
      data-disabled={disabled || undefined}
    >
      <Button className="rl-split-button__main" variant={variant} size={size} disabled={disabled} loading={loading} iconStart={iconStart} onClick={onClick}>
        {label}
      </Button>
      <Menu
        side={menuSide}
        align={menuAlign}
        open={open}
        onOpenChange={handleOpenChange}
        disabled={disabled}
        trigger={
          <IconButton
            className="rl-split-button__toggle"
            label={menuLabel}
            icon={<Chevron />}
            variant={toggleVariant[variant]}
            size={size}
            disabled={disabled}
            aria-disabled={loading || undefined}
          />
        }
      >
        {children}
      </Menu>
    </div>
  );
});
