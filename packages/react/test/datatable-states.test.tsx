import * as React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DataTable, Progress, RhineProvider, Stat, paginate } from '../src';
import type { DataTableColumn, DataTableStatus, SortState } from '../src';

let errors: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  errors = vi.spyOn(console, 'error');
});
afterEach(() => {
  expect(errors).not.toHaveBeenCalled();
  errors.mockRestore();
});

interface Rec {
  id: string;
  title: string;
}

const all: Rec[] = Array.from({ length: 1000 }, (_, i) => ({ id: `ARC-${String(i + 1).padStart(4, '0')}`, title: `记录 ${i + 1}` }));
const columns: DataTableColumn<Rec>[] = [
  { key: 'id', header: '编号', rowHeader: true, mono: true, sortable: true },
  { key: 'title', header: '标题' },
];

function PagedTable({ status = 'ready', onRetry }: { status?: DataTableStatus; onRetry?: () => void }) {
  const [page, setPage] = React.useState(1);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [sort, setSort] = React.useState<SortState | null>(null);
  const sorted = sort?.direction === 'descending' ? [...all].reverse() : all;
  return (
    <DataTable
      caption="检索结果"
      columns={columns}
      rows={paginate(sorted, page, 25)}
      getRowId={(r) => r.id}
      sort={sort}
      onSortChange={(next) => {
        setSort(next);
        setPage(1);
      }}
      selectedIds={selected}
      onSelectionChange={setSelected}
      status={status}
      onRetry={onRetry}
      pagination={{ page, onPageChange: setPage, pageSize: 25, totalItems: all.length }}
    />
  );
}

describe('DataTable pagination', () => {
  it('renders one page of 1000 rows with a pager and range summary', () => {
    render(<PagedTable />);
    const table = screen.getByRole('table', { name: '检索结果' });
    expect(within(table).getAllByRole('row')).toHaveLength(26);
    expect(screen.getByRole('navigation', { name: '分页' })).toBeInTheDocument();
    expect(screen.getByText('第 1–25 条，共 1000 条')).toBeInTheDocument();
  });

  it('selection survives paging; select-all applies to the current page and reports off-page rows', async () => {
    const user = userEvent.setup();
    render(<PagedTable />);
    await user.click(screen.getByRole('checkbox', { name: '选择 ARC-0001' }));
    await user.click(screen.getByRole('button', { name: '第 2 页' }));
    expect(screen.getByRole('rowheader', { name: 'ARC-0026' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '第 2 页' })).toHaveFocus();
    expect(screen.getByText('已选 1 条（其中 1 条在其他页）')).toBeInTheDocument();
    await user.click(screen.getByRole('checkbox', { name: '全选' }));
    expect(screen.getByText('已选 26 条（其中 1 条在其他页）')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '第 1 页' }));
    expect(screen.getByRole('checkbox', { name: '选择 ARC-0001' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: '选择 ARC-0002' })).not.toBeChecked();
  });

  it('sorting resets to page 1 (caller contract) and keeps aria-sort', async () => {
    const user = userEvent.setup();
    render(<PagedTable />);
    await user.click(screen.getByRole('button', { name: '第 3 页' }));
    await user.click(screen.getByRole('button', { name: /编号/ }));
    await user.click(screen.getByRole('button', { name: /编号/ }));
    expect(screen.getByRole('columnheader', { name: /编号/ })).toHaveAttribute('aria-sort', 'descending');
    expect(screen.getByRole('button', { name: '第 1 页' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getAllByRole('rowheader')[0]).toHaveTextContent('ARC-1000');
  });
});

describe('DataTable states', () => {
  it('first load: skeleton rows hidden from AT, visible status text, busy table, sorting disabled', () => {
    render(<DataTable caption="结果" columns={columns} rows={[]} getRowId={(r: Rec) => r.id} status="loading" loadingRows={3} onSortChange={() => {}} />);
    const table = screen.getByRole('table', { name: '结果' });
    expect(table).toHaveAttribute('aria-busy', 'true');
    const skeletons = table.querySelectorAll('.rl-table__skeleton-row');
    expect(skeletons).toHaveLength(3);
    skeletons.forEach((row) => expect(row).toHaveAttribute('aria-hidden', 'true'));
    expect(screen.getByRole('status')).toHaveTextContent('正在加载…');
    expect(screen.getByRole('button', { name: /编号/ })).toBeDisabled();
    expect(screen.queryByText('没有符合条件的记录')).toBeNull();
  });

  it('reload keeps the old rows (stale); paging is inert but stays focusable; selection is disabled', async () => {
    const user = userEvent.setup();
    render(<PagedTable status="loading" />);
    expect(screen.getAllByRole('rowheader')).toHaveLength(25);
    expect(screen.getByRole('table').querySelector('tbody')).toHaveAttribute('data-stale');
    const page2 = screen.getByRole('button', { name: '第 2 页' });
    expect(page2).toHaveAttribute('aria-disabled', 'true');
    expect(page2).not.toBeDisabled();
    await user.click(page2);
    expect(screen.getByRole('button', { name: '第 1 页' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('navigation', { name: '分页' })).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('checkbox', { name: '选择 ARC-0001' })).toBeDisabled();
    expect(screen.getAllByRole('status').some((s) => s.textContent === '正在加载…')).toBe(true);
  });

  it('error replaces the rows with an alert and a retry button', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(
      <DataTable caption="结果" columns={columns} rows={all.slice(0, 3)} getRowId={(r) => r.id} status="error" errorText="服务暂时不可用。" onRetry={onRetry} />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('服务暂时不可用。');
    expect(screen.queryByRole('rowheader')).toBeNull();
    await user.click(screen.getByRole('button', { name: '重试' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('empty state is distinct from loading and can carry an action', () => {
    render(
      <DataTable
        caption="结果"
        columns={columns}
        rows={[]}
        getRowId={(r: Rec) => r.id}
        emptyText="没有匹配的记录。"
        emptyAction={<button type="button">清除筛选</button>}
      />,
    );
    expect(screen.getByText('没有匹配的记录。')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '清除筛选' })).toBeInTheDocument();
    expect(screen.getByRole('table')).not.toHaveAttribute('aria-busy');
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('without the new props the table renders exactly as before (no frame, no footer)', () => {
    const { container } = render(<DataTable caption="结果" columns={columns} rows={all.slice(0, 2)} getRowId={(r) => r.id} />);
    expect(container.querySelector('.rl-table-frame')).toBeNull();
    expect(container.firstElementChild).toHaveClass('rl-table-scroll');
  });

  it('reduced motion: loading states render without errors', () => {
    render(
      <RhineProvider motion="reduce">
        <Progress label="导入" value={null} />
        <DataTable caption="结果" columns={columns} rows={[]} getRowId={(r: Rec) => r.id} status="loading" />
        <Stat label="总数" value={1} loading />
      </RhineProvider>,
    );
    expect(document.querySelector('.rl-theme')).toHaveAttribute('data-rl-motion', 'reduce');
  });
});
