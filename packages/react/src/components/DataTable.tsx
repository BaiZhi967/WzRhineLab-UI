import * as React from 'react';
import { cx } from '../utils/cx.js';
import { Button } from './Button.js';
import { Pagination } from './Pagination.js';
import type { PaginationLabels } from './Pagination.js';

/**
 * Data table on a native <table>: real header cells, a caption, sortable columns that
 * report `aria-sort`, optional row selection with named checkboxes, and an empty state.
 * Wide tables scroll horizontally inside a focusable, labelled region instead of
 * shrinking text. Sorting is controlled: the component reports the requested order and
 * the caller supplies sorted rows, so it never reorders data it does not understand.
 * Pagination works the same way (ADR-0005 §6): the table renders the pager and the caller
 * supplies the current page's rows (`paginate()` helps for client-side data).
 */

export type DataTableStatus = 'ready' | 'loading' | 'error';

export interface DataTablePagination {
  page: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  /** Total rows across all pages; drives the page count and the range summary. */
  totalItems: number;
  siblingCount?: number;
  labels?: PaginationLabels;
}

export type SortDirection = 'ascending' | 'descending';

export interface SortState {
  column: string;
  direction: SortDirection;
}

export interface DataTableColumn<Row> {
  key: string;
  header: React.ReactNode;
  /** Cell content. Defaults to `String(row[key])` when the row has that property. */
  cell?: (row: Row) => React.ReactNode;
  /** Allow sorting by this column. */
  sortable?: boolean;
  align?: 'start' | 'end' | 'center';
  /** Monospace, tabular figures for IDs, numbers and timestamps. */
  mono?: boolean;
  /** Fixed column width as a CSS length or token, e.g. `var(--rl-space-16)`. */
  width?: string;
  /** Header text visually hidden but kept for screen readers (e.g. an actions column). */
  hideHeader?: boolean;
  /** Use this column's cell as the row header (<th scope="row">). One per table. */
  rowHeader?: boolean;
}

export type DataTableProps<Row> = {
  /** Visible caption; also names the scroll region. Required for an accessible table. */
  caption: React.ReactNode;
  /** Hide the caption visually (keep it for assistive tech) when a heading already labels the table. */
  hideCaption?: boolean;
  columns: readonly DataTableColumn<Row>[];
  rows: readonly Row[];
  getRowId: (row: Row) => string;
  sort?: SortState | null;
  onSortChange?: (sort: SortState) => void;
  /** Enables a checkbox column. */
  selectedIds?: ReadonlySet<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  /** Accessible name for a row's checkbox; defaults to the row id. */
  getRowLabel?: (row: Row) => string;
  emptyText?: React.ReactNode;
  /** Optional action under the empty text, e.g. a "clear filters" button. */
  emptyAction?: React.ReactNode;
  /**
   * `loading`: skeleton rows on first load; with existing rows they stay visible but dimmed.
   * `error`: message + optional retry. Sorting, selection and paging are disabled in both.
   */
  status?: DataTableStatus;
  /** Skeleton rows on first load. */
  loadingRows?: number;
  loadingText?: React.ReactNode;
  errorText?: React.ReactNode;
  onRetry?: () => void;
  retryLabel?: React.ReactNode;
  pagination?: DataTablePagination;
  density?: 'comfortable' | 'compact';
  /** Accessible label for the horizontal scroll region; defaults to the caption text. */
  scrollLabel?: string;
  className?: string;
};

function SortIcon({ direction }: { direction: SortDirection | null }) {
  return (
    <svg className="rl-table__sort-icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false" data-direction={direction ?? 'none'}>
      <path className="rl-table__sort-up" d="M5 6.5 8 3.5l3 3" />
      <path className="rl-table__sort-down" d="M5 9.5 8 12.5l3-3" />
    </svg>
  );
}

function defaultCell<Row>(row: Row, key: string): React.ReactNode {
  const value = (row as Record<string, unknown>)[key];
  return value === null || value === undefined ? '' : String(value);
}

export function DataTable<Row>({
  caption,
  hideCaption = false,
  columns,
  rows,
  getRowId,
  sort,
  onSortChange,
  selectedIds,
  onSelectionChange,
  getRowLabel,
  emptyText = '没有符合条件的记录',
  emptyAction,
  status = 'ready',
  loadingRows = 5,
  loadingText = '正在加载…',
  errorText = '加载失败。',
  onRetry,
  retryLabel = '重试',
  pagination,
  density = 'comfortable',
  scrollLabel,
  className,
}: DataTableProps<Row>) {
  const captionId = React.useId();
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const busy = status !== 'ready';
  const loading = status === 'loading';
  const firstLoad = loading && rows.length === 0;
  const selectable = selectedIds !== undefined && onSelectionChange !== undefined;
  const rowIds = React.useMemo(() => rows.map(getRowId), [rows, getRowId]);
  const selectedCount = selectable ? rowIds.filter((id) => selectedIds!.has(id)).length : 0;
  const allSelected = selectable && rows.length > 0 && selectedCount === rows.length;
  /** Selected rows that are not on this page (pagination keeps the caller's selection). */
  const offPageSelected = selectable ? selectedIds!.size - selectedCount : 0;
  const someSelected = selectable && selectedCount > 0 && !allSelected;
  const headerCheckbox = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (headerCheckbox.current) headerCheckbox.current.indeterminate = someSelected;
  }, [someSelected]);

  const toggleAll = () => {
    if (!selectable) return;
    const next = new Set(selectedIds);
    if (allSelected) rowIds.forEach((id) => next.delete(id));
    else rowIds.forEach((id) => next.add(id));
    onSelectionChange!(next);
  };

  const toggleRow = (id: string) => {
    if (!selectable) return;
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange!(next);
  };

  const requestSort = (column: string) => {
    if (!onSortChange) return;
    const direction: SortDirection = sort?.column === column && sort.direction === 'ascending' ? 'descending' : 'ascending';
    onSortChange({ column, direction });
  };

  const columnCount = columns.length + (selectable ? 1 : 0);

  const changePage = (next: number) => {
    // New page starts at its first row; focus stays on the pager (Pagination keeps it).
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    pagination!.onPageChange(next);
  };

  const table = (
    <div
      ref={scrollRef}
      className={cx('rl-table-scroll', !pagination && className)}
      data-slot="data-table"
      data-density={density}
      data-status={status}
      role="region"
      aria-labelledby={scrollLabel ? undefined : captionId}
      aria-label={scrollLabel}
      tabIndex={0}
    >
      <table className="rl-table" aria-busy={loading || undefined}>
        <caption id={captionId} className={hideCaption ? 'rl-visually-hidden' : 'rl-table__caption'}>
          {caption}
        </caption>
        <colgroup>
          {selectable && <col className="rl-table__col-select" />}
          {columns.map((column) => (
            <col key={column.key} style={column.width ? { width: column.width } : undefined} />
          ))}
        </colgroup>
        <thead>
          <tr>
            {selectable && (
              <th scope="col" className="rl-table__select">
                <input
                  ref={headerCheckbox}
                  type="checkbox"
                  className="rl-table__checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  disabled={rows.length === 0 || busy}
                  aria-label={allSelected ? '取消全选' : '全选'}
                />
              </th>
            )}
            {columns.map((column) => {
              const active = sort?.column === column.key ? sort.direction : null;
              const headerContent = column.hideHeader ? <span className="rl-visually-hidden">{column.header}</span> : column.header;
              return (
                <th
                  key={column.key}
                  scope="col"
                  data-align={column.align ?? 'start'}
                  aria-sort={column.sortable ? (active ?? 'none') : undefined}
                >
                  {column.sortable && onSortChange ? (
                    <button
                      type="button"
                      className="rl-table__sort"
                      onClick={() => requestSort(column.key)}
                      data-active={active ? true : undefined}
                      disabled={busy}
                    >
                      {headerContent}
                      <SortIcon direction={active} />
                    </button>
                  ) : (
                    headerContent
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody data-stale={(loading && !firstLoad) || undefined}>
          {status === 'error' ? (
            <tr>
              <td colSpan={columnCount} className="rl-table__message" data-kind="error">
                <div className="rl-table__message-body" role="alert">
                  <svg className="rl-table__message-icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                    <path d="M8 1.75 15 14.25H1L8 1.75Z" />
                    <path d="M8 6.5v3.25M8 11.75v.01" />
                  </svg>
                  <span>{errorText}</span>
                </div>
                {onRetry && (
                  <Button size="sm" variant="secondary" onClick={onRetry}>
                    {retryLabel}
                  </Button>
                )}
              </td>
            </tr>
          ) : firstLoad ? (
            Array.from({ length: loadingRows }, (_, i) => (
              <tr key={`skeleton-${i}`} className="rl-table__skeleton-row" aria-hidden="true">
                {Array.from({ length: columnCount }, (_, c) => (
                  <td key={c}>
                    <span className="rl-table__skeleton" />
                  </td>
                ))}
              </tr>
            ))
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={columnCount} className="rl-table__empty">
                {emptyText}
                {emptyAction != null && <div className="rl-table__empty-action">{emptyAction}</div>}
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const id = getRowId(row);
              const selected = selectable && selectedIds!.has(id);
              return (
                <tr key={id} data-selected={selected || undefined}>
                  {selectable && (
                    <td className="rl-table__select">
                      <input
                        type="checkbox"
                        className="rl-table__checkbox"
                        checked={selected}
                        onChange={() => toggleRow(id)}
                        disabled={busy}
                        aria-label={`选择 ${getRowLabel ? getRowLabel(row) : id}`}
                      />
                    </td>
                  )}
                  {columns.map((column) => {
                    const content = column.cell ? column.cell(row) : defaultCell(row, column.key);
                    const props = {
                      'data-align': column.align ?? 'start',
                      'data-mono': column.mono || undefined,
                    };
                    return column.rowHeader ? (
                      <th key={column.key} {...props} scope="row">
                        {content}
                      </th>
                    ) : (
                      <td key={column.key} {...props}>
                        {content}
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
      {loading && (
        // Visible on first load (skeleton rows are aria-hidden); announced in both cases.
        <p className={firstLoad ? 'rl-table__loading' : 'rl-visually-hidden'} role="status">
          {loadingText}
        </p>
      )}
    </div>
  );

  if (!pagination && !(selectable && offPageSelected > 0)) return table;

  return (
    <div className={cx('rl-table-frame', className)} data-slot="data-table-frame">
      {table}
      <div className="rl-table__footer">
        {selectable && selectedIds!.size > 0 && (
          <p className="rl-table__selection" role="status">
            已选 {selectedIds!.size} 条{offPageSelected > 0 ? `（其中 ${offPageSelected} 条在其他页）` : ''}
          </p>
        )}
        {pagination && (
          <Pagination
            className="rl-table__pagination"
            page={pagination.page}
            onPageChange={changePage}
            pageSize={pagination.pageSize}
            totalItems={pagination.totalItems}
            siblingCount={pagination.siblingCount}
            labels={pagination.labels}
            disabled={busy}
          />
        )}
      </div>
    </div>
  );
}
