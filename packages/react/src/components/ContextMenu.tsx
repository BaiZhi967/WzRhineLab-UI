'use client';

import * as React from 'react';
import { ContextMenu as BaseContextMenu } from '@base-ui/react/context-menu';
import { usePortalContainer } from '../provider/portal.js';
import { cx } from '../utils/cx.js';

/**
 * Context menu on Base UI ContextMenu (ADR-0010 §2). Opens at the pointer on right click, on
 * long press (touch, 500 ms) and, from the keyboard, on Shift+F10 / the ContextMenu key while the
 * target has focus (the browser fires `contextmenu` on the focused element). It reuses the Menu
 * parts and styling: put `MenuItem`, `MenuCheckboxItem`, `MenuRadioGroup`, `MenuGroup` and
 * `MenuSeparator` inside. Escape and outside click close it; focus returns to the target.
 *
 * The target must be reachable by keyboard: it gets `tabIndex={0}` unless it sets its own.
 * Every command must also be available elsewhere (a Menu button, a toolbar); a context menu is
 * a shortcut, not the only path (ACCESSIBILITY.md).
 *
 *   <ContextMenu trigger={<div className="row">REC-0142</div>}>
 *     <MenuItem onSelect={copy}>复制编号</MenuItem>
 *   </ContextMenu>
 */

export type ContextMenuProps = {
  /** The area that opens the menu: one element (usually a row or card) that can hold focus. */
  trigger: React.ReactElement<Record<string, unknown>>;
  /** Menu items (`MenuItem` and friends from Menu). */
  children: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Leave the browser's native context menu in place. */
  disabled?: boolean;
  /** Class name for the popup. */
  className?: string;
};

export function ContextMenu({ trigger, children, open, defaultOpen, onOpenChange, disabled, className }: ContextMenuProps) {
  const container = usePortalContainer();
  const ownTabIndex = trigger.props.tabIndex as number | undefined;
  return (
    <BaseContextMenu.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange ? (next) => onOpenChange(next) : undefined}
      disabled={disabled}
    >
      <BaseContextMenu.Trigger
        render={trigger}
        tabIndex={ownTabIndex ?? 0}
        className="rl-context-menu__trigger"
        data-slot="context-menu-trigger"
      />
      <BaseContextMenu.Portal container={container}>
        <BaseContextMenu.Positioner className="rl-menu__positioner" collisionPadding={8}>
          <BaseContextMenu.Popup className={cx('rl-menu', 'rl-context-menu', className)} data-slot="context-menu">
            {children}
          </BaseContextMenu.Popup>
        </BaseContextMenu.Positioner>
      </BaseContextMenu.Portal>
    </BaseContextMenu.Root>
  );
}
