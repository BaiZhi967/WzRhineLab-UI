'use client';

import * as React from 'react';
import { useRhineMessages } from '../provider/messages.js';
import { cx } from '../utils/cx.js';

/**
 * Archive metadata as a semantic description list (<dl>). Values come from the caller's
 * real record; missing values are hidden by default so the component never displays
 * invented placeholders as if they were data.
 */

export type MetadataValue = React.ReactNode;

export interface MetadataItem {
  /** Stable key; defaults to the label when it is a string. */
  key?: string;
  label: React.ReactNode;
  value: MetadataValue;
  /** Monospace value for IDs, codes, measurements and timestamps. */
  mono?: boolean;
  /** Machine-readable date/time; wraps the value in <time dateTime>. */
  dateTime?: string;
  /** Short note under the value, e.g. a unit basis or provenance. */
  hint?: React.ReactNode;
  /** Let a long value span the full row in multi-column layouts. */
  wide?: boolean;
}

export type MetadataListLayout = 'inline' | 'stacked';
export type MetadataEmpty = 'hide' | 'placeholder';

export type MetadataListProps = Omit<React.HTMLAttributes<HTMLDListElement>, 'children'> & {
  items: readonly MetadataItem[];
  /** `inline`: label column + value; `stacked`: label above value (narrow panels). */
  layout?: MetadataListLayout;
  /** Number of item columns on wide containers; collapses to one on narrow ones. */
  columns?: 1 | 2 | 3;
  /**
   * How to treat items whose value is null / undefined / ''. `hide` (default) omits the row;
   * `placeholder` keeps the row with a dash announced as「未记录」.
   */
  empty?: MetadataEmpty;
  size?: 'sm' | 'md';
};

export function isEmptyValue(value: MetadataValue): boolean {
  return value === null || value === undefined || value === false || (typeof value === 'string' && value.trim() === '');
}

function itemKey(item: MetadataItem, index: number): string {
  if (item.key) return item.key;
  return typeof item.label === 'string' ? item.label : String(index);
}

export const MetadataList = React.forwardRef<HTMLDListElement, MetadataListProps>(function MetadataList(
  { items, layout = 'inline', columns = 1, empty = 'hide', size = 'md', className, ...rest },
  ref,
) {
  const messages = useRhineMessages();
  const visible = empty === 'hide' ? items.filter((item) => !isEmptyValue(item.value)) : items;
  if (visible.length === 0) return null;
  return (
    <dl
      {...rest}
      ref={ref}
      className={cx('rl-meta', className)}
      data-slot="metadata-list"
      data-layout={layout}
      data-columns={columns}
      data-size={size}
    >
      {visible.map((item, index) => {
        const missing = isEmptyValue(item.value);
        const content = missing ? (
          <span className="rl-meta__empty">
            <span aria-hidden="true">—</span>
            <span className="rl-visually-hidden">{messages.metadataList.missing}</span>
          </span>
        ) : item.dateTime ? (
          <time dateTime={item.dateTime}>{item.value}</time>
        ) : (
          item.value
        );
        return (
          <div key={itemKey(item, index)} className="rl-meta__item" data-wide={item.wide || undefined}>
            <dt className="rl-meta__label">{item.label}</dt>
            <dd className="rl-meta__value" data-mono={item.mono || undefined} data-empty={missing || undefined}>
              {content}
              {item.hint != null && !missing && <span className="rl-meta__hint">{item.hint}</span>}
            </dd>
          </div>
        );
      })}
    </dl>
  );
});
