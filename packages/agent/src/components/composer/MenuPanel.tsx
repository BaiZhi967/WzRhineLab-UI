'use client';

import * as React from 'react';
import { MotionPresence } from '@wzrhine/react';
import { matchRanges } from '@wzrhine/agent-core';
import { cx } from '../../utils/cx.js';
import { menuOptionId } from './composer-utils.js';

/*
 * Shared listbox panel of MentionMenu and SlashCommandMenu. Focus never enters the panel: the
 * textarea owns it and points `aria-activedescendant` at the active option, so typing, IME and
 * the caret keep working while the list is open. Options are `role="option"` items (not buttons,
 * not tabbable); pointer selection keeps focus in the textarea via `mousedown.preventDefault()`.
 */

export interface MenuPanelProps {
  open: boolean;
  /** Id of the panel element. */
  panelId: string;
  /** Id of the listbox (target of the textarea's aria-controls). */
  listboxId: string;
  label: string;
  title: React.ReactNode;
  keys?: React.ReactNode;
  icon?: React.ReactNode;
  /** Side of the composer the panel opens on. */
  /** `top` / `bottom` = absolutely positioned against the composer; `inline` = in normal flow (standalone use). */
  side?: 'top' | 'bottom' | 'inline';
  /** Status above the list (loading / empty / error). */
  status?: React.ReactNode;
  /** Number of options; the listbox is only rendered when there is at least one. */
  count: number;
  activeIndex: number;
  className?: string;
  children?: React.ReactNode;
}

export function MenuPanel({ open, panelId, listboxId, label, title, keys, icon, side = 'top', status, count, activeIndex, className, children }: MenuPanelProps) {
  // Keep the active option in view without scrolling the page (guarded for jsdom).
  React.useEffect(() => {
    if (!open || activeIndex < 0 || typeof document === 'undefined') return;
    const node = document.getElementById(menuOptionId(listboxId, activeIndex));
    if (node && typeof node.scrollIntoView === 'function') node.scrollIntoView({ block: 'nearest' });
  }, [open, activeIndex, listboxId]);

  return (
    <MotionPresence show={open} preset="fade" className={cx('rl-agent-menu', className)} data-side={side} id={panelId}>
      <div className="rl-agent-menu__header">
        {icon}
        <span className="rl-agent-menu__title">{title}</span>
        {keys != null && (
          <span className="rl-agent-menu__keys" aria-hidden="true">
            {keys}
          </span>
        )}
      </div>
      {status}
      {count > 0 && (
        <div role="listbox" id={listboxId} aria-label={label} className="rl-agent-menu__list">
          {children}
        </div>
      )}
    </MotionPresence>
  );
}

export interface MenuGroupProps {
  label: string | undefined;
  children: React.ReactNode;
}

/** `role="group"` named by its visible heading. Ungrouped runs render their options directly. */
export function MenuGroup({ label, children }: MenuGroupProps) {
  const headingId = React.useId();
  if (!label) return <>{children}</>;
  return (
    <div role="group" aria-labelledby={headingId} className="rl-agent-menu__group">
      <div id={headingId} className="rl-agent-menu__group-label" role="presentation">
        {label}
      </div>
      {children}
    </div>
  );
}

export interface MenuOptionProps {
  listboxId: string;
  index: number;
  active: boolean;
  disabled?: boolean;
  onActivate: (index: number) => void;
  onChoose: (index: number) => void;
  children: React.ReactNode;
  'aria-describedby'?: string;
  className?: string;
  'data-kind'?: string;
}

/** One listbox option. Keyboard selection is handled by the textarea (aria-activedescendant). */
export function MenuOption({ listboxId, index, active, disabled, onActivate, onChoose, children, className, ...rest }: MenuOptionProps) {
  return (
    <div
      {...rest}
      role="option"
      id={menuOptionId(listboxId, index)}
      aria-selected={active}
      aria-disabled={disabled || undefined}
      data-active={active || undefined}
      className={cx('rl-agent-menu__option', className)}
      onMouseDown={(event) => event.preventDefault()}
      onMouseMove={() => {
        if (!active) onActivate(index);
      }}
      onClick={() => onChoose(index)}
    >
      {children}
    </div>
  );
}

/** Wraps every case-insensitive occurrence of `query` in `<mark>`. */
export function Highlight({ text, query }: { text: string; query: string }) {
  const ranges = matchRanges(text, query);
  if (ranges.length === 0) return <>{text}</>;
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  ranges.forEach(([start, end], i) => {
    if (start > cursor) parts.push(text.slice(cursor, start));
    parts.push(
      <mark key={i} className="rl-agent-menu__mark">
        {text.slice(start, end)}
      </mark>,
    );
    cursor = end;
  });
  if (cursor < text.length) parts.push(text.slice(cursor));
  return <>{parts}</>;
}
