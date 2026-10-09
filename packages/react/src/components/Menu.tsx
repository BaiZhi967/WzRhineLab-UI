import * as React from 'react';
import { Menu as BaseMenu } from '@base-ui/react/menu';
import { usePortalContainer } from '../provider/portal';
import { cx } from '../utils/cx';

/**
 * Action menu on Base UI Menu (ADR-0001): menu / menuitem semantics, arrow-key roving focus,
 * typeahead, Home/End, Escape and outside-click dismissal, focus return to the trigger.
 * Use for commands on an object ("导出 / 复制编号 / 归档"); use Select to choose a value
 * and Tabs to switch views. Popup motion is a CSS transition (--rl-motion-fast).
 */

export type MenuSide = 'top' | 'bottom' | 'left' | 'right';
export type MenuAlign = 'start' | 'center' | 'end';

export type MenuProps = {
  /** Element that opens the menu (Button / IconButton with its own accessible name). */
  trigger: React.ReactElement<Record<string, unknown>>;
  children: React.ReactNode;
  side?: MenuSide;
  align?: MenuAlign;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  className?: string;
};

function Check() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true" focusable="false">
      <path d="m3 8.5 3.5 3.5L13 4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Dot() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <circle cx="8" cy="8" r="3" fill="currentColor" />
    </svg>
  );
}

export function Menu({ trigger, children, side = 'bottom', align = 'start', open, defaultOpen, onOpenChange, disabled, className }: MenuProps) {
  const container = usePortalContainer();
  return (
    <BaseMenu.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange ? (next) => onOpenChange(next) : undefined}
      disabled={disabled}
    >
      <BaseMenu.Trigger render={trigger} />
      <BaseMenu.Portal container={container}>
        <BaseMenu.Positioner className="rl-menu__positioner" side={side} align={align} sideOffset={4} collisionPadding={8} positionMethod="fixed">
          <BaseMenu.Popup className={cx('rl-menu', className)} data-slot="menu">
            {children}
          </BaseMenu.Popup>
        </BaseMenu.Positioner>
      </BaseMenu.Portal>
    </BaseMenu.Root>
  );
}

export type MenuItemProps = {
  children: React.ReactNode;
  onSelect?: () => void;
  /** Decorative leading icon. */
  icon?: React.ReactNode;
  /** Keyboard hint shown on the right, e.g. "Ctrl E". Visual only; wire the shortcut yourself. */
  shortcut?: string;
  /** `danger` for destructive commands; pair with a confirmation Dialog. */
  tone?: 'default' | 'danger';
  disabled?: boolean;
  /** Keep the menu open after selection (default closes). */
  keepOpen?: boolean;
};

export function MenuItem({ children, onSelect, icon, shortcut, tone = 'default', disabled, keepOpen = false }: MenuItemProps) {
  return (
    <BaseMenu.Item
      className="rl-menu__item"
      data-tone={tone}
      disabled={disabled}
      closeOnClick={!keepOpen}
      onClick={onSelect ? () => onSelect() : undefined}
    >
      <span className="rl-menu__icon" aria-hidden="true">
        {icon}
      </span>
      <span className="rl-menu__label">{children}</span>
      {shortcut != null && (
        <kbd className="rl-menu__shortcut" aria-hidden="true">
          {shortcut}
        </kbd>
      )}
    </BaseMenu.Item>
  );
}

export type MenuCheckboxItemProps = {
  children: React.ReactNode;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
};

export function MenuCheckboxItem({ children, checked, defaultChecked, onCheckedChange, disabled }: MenuCheckboxItemProps) {
  return (
    <BaseMenu.CheckboxItem
      className="rl-menu__item"
      checked={checked}
      defaultChecked={defaultChecked}
      onCheckedChange={onCheckedChange ? (next) => onCheckedChange(next) : undefined}
      disabled={disabled}
    >
      <BaseMenu.CheckboxItemIndicator className="rl-menu__icon" keepMounted>
        <span className="rl-menu__indicator">
          <Check />
        </span>
      </BaseMenu.CheckboxItemIndicator>
      <span className="rl-menu__label">{children}</span>
    </BaseMenu.CheckboxItem>
  );
}

export type MenuRadioGroupProps = {
  /** Visible group heading; also names the group for assistive tech. */
  label?: React.ReactNode;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
};

export function MenuRadioGroup({ label, value, defaultValue, onValueChange, children }: MenuRadioGroupProps) {
  return (
    <BaseMenu.Group className="rl-menu__group">
      {label != null && <BaseMenu.GroupLabel className="rl-menu__group-label">{label}</BaseMenu.GroupLabel>}
      <BaseMenu.RadioGroup
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange ? (next) => onValueChange(String(next)) : undefined}
      >
        {children}
      </BaseMenu.RadioGroup>
    </BaseMenu.Group>
  );
}

export type MenuRadioItemProps = {
  value: string;
  children: React.ReactNode;
  disabled?: boolean;
};

export function MenuRadioItem({ value, children, disabled }: MenuRadioItemProps) {
  return (
    <BaseMenu.RadioItem className="rl-menu__item" value={value} disabled={disabled}>
      <BaseMenu.RadioItemIndicator className="rl-menu__icon" keepMounted>
        <span className="rl-menu__indicator">
          <Dot />
        </span>
      </BaseMenu.RadioItemIndicator>
      <span className="rl-menu__label">{children}</span>
    </BaseMenu.RadioItem>
  );
}

export type MenuGroupProps = {
  label?: React.ReactNode;
  children: React.ReactNode;
};

export function MenuGroup({ label, children }: MenuGroupProps) {
  return (
    <BaseMenu.Group className="rl-menu__group">
      {label != null && <BaseMenu.GroupLabel className="rl-menu__group-label">{label}</BaseMenu.GroupLabel>}
      {children}
    </BaseMenu.Group>
  );
}

export function MenuSeparator() {
  return <BaseMenu.Separator className="rl-menu__separator" />;
}
