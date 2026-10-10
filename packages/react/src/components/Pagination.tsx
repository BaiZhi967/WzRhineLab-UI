import * as React from 'react';
import { cx } from '../utils/cx.js';

/**
 * Page navigation (ADR-0005 §3): a `<nav>` of plain buttons in normal Tab order. The current page
 * keeps `aria-current="page"` and stays focusable so it can be announced. Narrow containers
 * switch to "上一页 · 第 n / m 页 · 下一页" through a container query.
 *
 *   <Pagination page={page} totalItems={1000} pageSize={25} onPageChange={setPage} />
 */

export type PaginationItem = number | 'ellipsis-start' | 'ellipsis-end';

/**
 * Page list with first, last and `siblingCount` pages on each side of `page`. A gap of one page
 * is shown as that page, not an ellipsis, so the list length stays stable while paging.
 */
export function getPaginationItems(page: number, pageCount: number, siblingCount = 1): PaginationItem[] {
  const total = Math.max(1, Math.floor(pageCount));
  const current = clamp(page, 1, total);
  // first + last + current + 2 siblings + 2 ellipsis slots
  const slots = siblingCount * 2 + 5;
  if (total <= slots) return range(1, total);

  const left = Math.max(current - siblingCount, 1);
  const right = Math.min(current + siblingCount, total);
  const showStart = left > 3;
  const showEnd = right < total - 2;

  if (!showStart) return [...range(1, slots - 2), 'ellipsis-end', total];
  if (!showEnd) return [1, 'ellipsis-start', ...range(total - (slots - 3), total)];
  return [1, 'ellipsis-start', ...range(left, right), 'ellipsis-end', total];
}

function range(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, i) => from + i);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(Math.round(value), min), max);
}

/** Rows of one page for client-side pagination. `page` starts at 1. */
export function paginate<Row>(rows: readonly Row[], page: number, pageSize: number): Row[] {
  const size = Math.max(1, Math.floor(pageSize));
  const pageCount = Math.max(1, Math.ceil(rows.length / size));
  const current = clamp(page, 1, pageCount);
  return rows.slice((current - 1) * size, current * size);
}

export interface PaginationLabels {
  nav?: string;
  previous?: string;
  next?: string;
  page?: (page: number) => string;
  /** Compact summary shown in narrow containers, e.g. "第 3 / 40 页". */
  compact?: (page: number, pageCount: number) => string;
  /** Range summary when `totalItems` is known, e.g. "第 51–75 条，共 1000 条". */
  status?: (from: number, to: number, total: number) => string;
}

const defaultLabels: Required<PaginationLabels> = {
  nav: '分页',
  previous: '上一页',
  next: '下一页',
  page: (p) => `第 ${p} 页`,
  compact: (p, n) => `第 ${p} / ${n} 页`,
  status: (from, to, total) => (total === 0 ? '共 0 条' : `第 ${from}–${to} 条，共 ${total} 条`),
};

type PageCountSource =
  | { pageCount: number; totalItems?: number; pageSize?: number }
  | { pageCount?: never; totalItems: number; pageSize: number };

export type PaginationProps = Omit<React.HTMLAttributes<HTMLElement>, 'onChange' | 'children'> &
  PageCountSource & {
    page?: number;
    defaultPage?: number;
    onPageChange?: (page: number) => void;
    /** Pages shown on each side of the current page. */
    siblingCount?: number;
    /** Disable every control. */
    disabled?: boolean;
    /**
     * A page request is in flight: controls ignore presses and announce `aria-disabled`, but stay
     * focusable so keyboard focus is not dropped to <body> while the table reloads.
     */
    busy?: boolean;
    /** Show the "第 a–b 条，共 n 条" summary (needs `totalItems` and `pageSize`). */
    showStatus?: boolean;
    labels?: PaginationLabels;
  };

function ChevronIcon({ direction }: { direction: 'previous' | 'next' }) {
  return (
    <svg className="rl-pagination__icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d={direction === 'previous' ? 'M10 3.5 5.5 8l4.5 4.5' : 'M6 3.5 10.5 8 6 12.5'} />
    </svg>
  );
}

export const Pagination = React.forwardRef<HTMLElement, PaginationProps>(function Pagination(
  {
    page: pageProp,
    defaultPage = 1,
    onPageChange,
    pageCount: pageCountProp,
    totalItems,
    pageSize,
    siblingCount = 1,
    disabled = false,
    busy = false,
    showStatus = totalItems != null && pageSize != null,
    labels: labelsProp,
    className,
    ...rest
  },
  ref,
) {
  const labels = { ...defaultLabels, ...labelsProp };
  const pageCount = Math.max(
    1,
    pageCountProp ?? (totalItems != null && pageSize ? Math.ceil(totalItems / pageSize) : 1),
  );
  const [uncontrolled, setUncontrolled] = React.useState(defaultPage);
  const page = clamp(pageProp ?? uncontrolled, 1, pageCount);
  const listRef = React.useRef<HTMLUListElement>(null);
  const pendingFocus = React.useRef<string | null>(null);

  const go = (next: number, focusKey: string) => {
    const target = clamp(next, 1, pageCount);
    if (target === page || disabled || busy) return;
    pendingFocus.current = focusKey;
    if (pageProp === undefined) setUncontrolled(target);
    onPageChange?.(target);
  };

  // Keep focus on the control the user pressed. If the page list re-flowed and that button is
  // gone (or became disabled at an edge), fall back to the current page instead of <body>.
  React.useLayoutEffect(() => {
    const key = pendingFocus.current;
    if (!key || !listRef.current) return;
    pendingFocus.current = null;
    const active = document.activeElement;
    if (active && listRef.current.contains(active) && !(active as HTMLButtonElement).disabled) return;
    const byKey = listRef.current.querySelector<HTMLButtonElement>(`[data-key="${key}"]:not(:disabled)`);
    (byKey ?? listRef.current.querySelector<HTMLButtonElement>('[aria-current="page"]'))?.focus();
  }, [page]);

  const items = getPaginationItems(page, pageCount, siblingCount);
  const from = totalItems != null && pageSize ? Math.min(totalItems, (page - 1) * pageSize + 1) : 0;
  const to = totalItems != null && pageSize ? Math.min(totalItems, page * pageSize) : 0;

  return (
    <nav
      {...rest}
      ref={ref}
      className={cx('rl-pagination', className)}
      aria-label={rest['aria-label'] ?? labels.nav}
      aria-disabled={disabled || undefined}
      aria-busy={busy || undefined}
      data-slot="pagination"
      data-disabled={disabled || undefined}
      data-busy={busy || undefined}
    >
      <div className="rl-pagination__row">
      <ul ref={listRef} className="rl-pagination__list">
        <li>
          <button
            type="button"
            className="rl-pagination__step"
            data-key="previous"
            disabled={disabled || page <= 1}
            aria-disabled={busy || undefined}
            onClick={() => go(page - 1, 'previous')}
          >
            <ChevronIcon direction="previous" />
            <span className="rl-pagination__step-label">{labels.previous}</span>
          </button>
        </li>
        {items.map((item) =>
          typeof item === 'number' ? (
            <li key={item} className="rl-pagination__page-item">
              <button
                type="button"
                className="rl-pagination__page"
                data-key={`page-${item}`}
                aria-label={labels.page(item)}
                aria-current={item === page ? 'page' : undefined}
                disabled={disabled}
                aria-disabled={busy || undefined}
                onClick={() => go(item, `page-${item}`)}
              >
                {item}
              </button>
            </li>
          ) : (
            <li key={item} className="rl-pagination__page-item" aria-hidden="true">
              <span className="rl-pagination__ellipsis">…</span>
            </li>
          ),
        )}
        {/* Shown instead of the page list in narrow containers; display:none keeps only one in the a11y tree. */}
        <li className="rl-pagination__compact">
          {labels.compact(page, pageCount)}
        </li>
        <li>
          <button
            type="button"
            className="rl-pagination__step"
            data-key="next"
            disabled={disabled || page >= pageCount}
            aria-disabled={busy || undefined}
            onClick={() => go(page + 1, 'next')}
          >
            <span className="rl-pagination__step-label">{labels.next}</span>
            <ChevronIcon direction="next" />
          </button>
        </li>
      </ul>
      {showStatus && totalItems != null && (
        <p className="rl-pagination__status" role="status">
          {labels.status(from, to, totalItems)}
        </p>
      )}
      </div>
    </nav>
  );
});
