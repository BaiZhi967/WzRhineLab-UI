'use client';

import * as React from 'react';
import { usePatternsMessages } from '../provider/PatternMessages.js';
import { cx } from '../utils/cx.js';

/**
 * Applied filter conditions (0.3.0-contracts §4.2 / §6.4): stable ids, readable labels, single
 * removal and clear-all. Focus contract: after a removal lands (the caller drops the item and
 * focus falls off the unmounted button), focus moves to the next remaining remove button —
 * or the previous one when the last item went — and to the clear-all entry when none remain.
 * "No records" vs "no results" lives in the collection's empty state, not here.
 */
export interface AppliedFilterItem {
  /** Stable condition id; the caller decides how duplicate labels merge. */
  id: string;
  /** Readable name and value, e.g. "类别：样本". */
  label: React.ReactNode;
  /** Render the remove entry disabled instead of hiding it. */
  disabled?: boolean;
}

export type AppliedFiltersProps = {
  filters: readonly AppliedFilterItem[];
  onRemove?: (id: string) => void;
  /** Provided (with items present) renders the clear-all entry. */
  onClearAll?: () => void;
  removeLabel?: (filter: AppliedFilterItem) => string;
  clearAllLabel?: string;
  /** Accessible name of the region. */
  label?: string;
  className?: string;
};

export const AppliedFilters = React.forwardRef<HTMLElement, AppliedFiltersProps>(function AppliedFilters(
  { filters, onRemove, onClearAll, removeLabel, clearAllLabel, label, className },
  ref,
) {
  const messages = usePatternsMessages();
  const listRef = React.useRef<HTMLUListElement | null>(null);
  const clearRef = React.useRef<HTMLButtonElement | null>(null);
  const lastRemovalRef = React.useRef<number | null>(null);

  React.useLayoutEffect(() => {
    if (lastRemovalRef.current == null) return;
    const index = lastRemovalRef.current;
    lastRemovalRef.current = null;
    if (document.activeElement !== document.body) return; // focus survived elsewhere: leave it
    const buttons = listRef.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)');
    const target = buttons?.[Math.min(index, buttons.length - 1)] ?? clearRef.current;
    target?.focus();
  }, [filters]);

  if (filters.length === 0) return null;

  return (
    <section
      ref={ref}
      className={cx('rl-applied-filters', className)}
      data-slot="applied-filters"
      aria-label={label ?? messages.appliedFilters.region}
    >
      <ul ref={listRef} className="rl-applied-filters__list">
        {filters.map((filter, index) => {
          const name = typeof filter.label === 'string' ? filter.label : filter.id;
          return (
            <li key={filter.id} className="rl-applied-filters__item" data-disabled={filter.disabled || undefined}>
              <span className="rl-applied-filters__label">{filter.label}</span>
              {onRemove && (
                <button
                  type="button"
                  className="rl-applied-filters__remove"
                  aria-label={removeLabel ? removeLabel(filter) : messages.appliedFilters.remove(name)}
                  disabled={filter.disabled}
                  onClick={() => {
                    lastRemovalRef.current = index;
                    onRemove(filter.id);
                  }}
                >
                  <svg className="rl-applied-filters__remove-icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                    <path d="M4 4l8 8M12 4l-8 8" />
                  </svg>
                </button>
              )}
            </li>
          );
        })}
      </ul>
      {onClearAll && (
        <button ref={clearRef} type="button" className="rl-applied-filters__clear" onClick={onClearAll}>
          {clearAllLabel ?? messages.appliedFilters.clearAll}
        </button>
      )}
    </section>
  );
});
