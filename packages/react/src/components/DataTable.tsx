import * as React from 'react';
import { cx } from '../utils/cx.js';

/**
 * Data table on a native <table>: real header cells, a caption, sortable columns that
 * report `aria-sort`, optional row selection with named checkboxes, and an empty state.
 * Wide tables scroll horizontally inside a focusable, labelled region instead of
 * shrinking text. Sorting is controlled: the component reports the requested order and
 * the caller supplies sorted rows, so it never reorders data it does not understand.
 */

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
  density = 'comfortable',
  scrollLabel,
  className,
}: DataTableProps<Row>) {
  const captionId = React.useId();
  const selectable = selectedIds !== undefined && onSelectionChange !== undefined;
  const rowIds = React.useMemo(() => rows.map(getRowId), [rows, getRowId]);
  const selectedCount = selectable ? rowIds.filter((id) => selectedIds!.has(id)).length : 0;
  const allSelected = selectable && rows.length > 0 && selectedCount === rows.length;
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

  return (
    <div
      className={cx('rl-table-scroll', className)}
      data-slot="data-table"
      data-density={density}
      role="region"
      aria-labelledby={scrollLabel ? undefined : captionId}
      aria-label={scrollLabel}
      tabIndex={0}
    >
      <table className="rl-table">
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
                  disabled={rows.length === 0}
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
                    <button type="button" className="rl-table__sort" onClick={() => requestSort(column.key)} data-active={active ? true : undefined}>
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
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columnCount} className="rl-table__empty">
                {emptyText}
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
    </div>
  );
}
