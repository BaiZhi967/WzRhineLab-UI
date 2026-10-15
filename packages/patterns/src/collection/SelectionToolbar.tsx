'use client';

import * as React from 'react';
import { Button, useRhineLocale } from '@wzrhine/react';
import { usePatternsMessages } from '../provider/PatternMessages.js';
import { cx } from '../utils/cx.js';

/**
 * Selection action bar (0.3.0-contracts §5 / §6.6): selected count, range explanation, clear
 * entry and batch actions. Batch execution belongs to the caller; a `busy` action disables its
 * button so the same operation cannot be submitted twice, and a failed operation keeps the
 * selection recoverable (the caller simply keeps reporting `selectedCount`).
 * Zero selection renders nothing. First version covers explicit finite id sets only — the
 * page / loaded / query scopes stay explainable, "all results selected" is not implied.
 */
export type SelectionScope = 'page' | 'loaded' | 'query';

export interface SelectionToolbarAction {
  id: string;
  label: React.ReactNode;
  /** Executed by the caller; component never runs business logic. */
  onRun?: () => void;
  busy?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export interface SelectionToolbarProps {
  selectedCount: number;
  /** Which range the count refers to; combined with `totalLabel` for an explainable scope. */
  scope?: SelectionScope;
  /** Range note, e.g. "当前页 25 条 / 已加载 100 条". */
  totalLabel?: React.ReactNode;
  onClear?: () => void;
  clearLabel?: string;
  actions?: readonly SelectionToolbarAction[];
  /** Accessible name of the toolbar. */
  label?: string;
  className?: string;
}

export const SelectionToolbar = React.forwardRef<HTMLDivElement, SelectionToolbarProps>(function SelectionToolbar(
  { selectedCount, scope, totalLabel, onClear, clearLabel, actions, label, className },
  ref,
) {
  const messages = usePatternsMessages();
  const { formatNumber } = useRhineLocale();
  if (selectedCount <= 0) return null;

  return (
    <div
      ref={ref}
      role="toolbar"
      aria-label={label ?? messages.selectionToolbar.region}
      className={cx('rl-selection-toolbar', className)}
      data-slot="selection-toolbar"
      data-scope={scope}
    >
      <p className="rl-selection-toolbar__count">{messages.selectionToolbar.selected(selectedCount, formatNumber)}</p>
      {totalLabel != null && <p className="rl-selection-toolbar__scope">{totalLabel}</p>}
      <div className="rl-selection-toolbar__bar">
        {actions?.map((action) => (
          <Button
            key={action.id}
            type="button"
            variant="secondary"
            size="sm"
            disabled={action.disabled || action.busy}
            onClick={() => action.onRun?.()}
          >
            {action.icon}
            {action.label}
          </Button>
        ))}
        {onClear && (
          <Button type="button" variant="ghost" size="sm" onClick={onClear}>
            {clearLabel ?? messages.selectionToolbar.clear}
          </Button>
        )}
      </div>
    </div>
  );
});
