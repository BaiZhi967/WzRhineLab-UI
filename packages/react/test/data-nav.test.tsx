import * as React from 'react';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  Breadcrumb,
  Meter,
  Pagination,
  Progress,
  RecordHeader,
  RhineProvider,
  Stat,
  getMeterState,
  getPaginationItems,
  paginate,
} from '../src';

let errors: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  errors = vi.spyOn(console, 'error');
});
afterEach(() => {
  expect(errors).not.toHaveBeenCalled();
  errors.mockRestore();
});

describe('getPaginationItems', () => {
  it('lists every page when they fit', () => {
    expect(getPaginationItems(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(getPaginationItems(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('keeps a stable length of 7 slots with ellipses in large ranges', () => {
    expect(getPaginationItems(1, 40)).toEqual([1, 2, 3, 4, 5, 'ellipsis-end', 40]);
    expect(getPaginationItems(4, 40)).toEqual([1, 2, 3, 4, 5, 'ellipsis-end', 40]);
    expect(getPaginationItems(5, 40)).toEqual([1, 'ellipsis-start', 4, 5, 6, 'ellipsis-end', 40]);
    expect(getPaginationItems(37, 40)).toEqual([1, 'ellipsis-start', 36, 37, 38, 39, 40]);
    expect(getPaginationItems(40, 40)).toEqual([1, 'ellipsis-start', 36, 37, 38, 39, 40]);
    for (let p = 1; p <= 40; p += 1) expect(getPaginationItems(p, 40)).toHaveLength(7);
  });

  it('clamps out-of-range pages and honours siblingCount', () => {
    expect(getPaginationItems(99, 10)).toEqual([1, 'ellipsis-start', 6, 7, 8, 9, 10]);
    expect(getPaginationItems(0, 0)).toEqual([1]);
    expect(getPaginationItems(10, 20, 2)).toEqual([1, 'ellipsis-start', 8, 9, 10, 11, 12, 'ellipsis-end', 20]);
  });
});

describe('paginate', () => {
  const rows = Array.from({ length: 23 }, (_, i) => i + 1);
  it('slices one page and clamps the page number', () => {
    expect(paginate(rows, 1, 10)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(paginate(rows, 3, 10)).toEqual([21, 22, 23]);
    expect(paginate(rows, 9, 10)).toEqual([21, 22, 23]);
    expect(paginate([], 1, 10)).toEqual([]);
  });
});

describe('Pagination', () => {
  it('is a named navigation; the current page is marked and stays focusable', () => {
    render(<Pagination page={3} pageCount={10} onPageChange={() => {}} />);
    const nav = screen.getByRole('navigation', { name: '分页' });
    const current = within(nav).getByRole('button', { name: '第 3 页' });
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(current).not.toBeDisabled();
    expect(within(nav).getAllByRole('button', { current: 'page' })).toHaveLength(1);
  });

  it('previous / next are disabled only at the edges', () => {
    const { rerender } = render(<Pagination page={1} pageCount={3} onPageChange={() => {}} />);
    expect(screen.getByRole('button', { name: '上一页' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '下一页' })).toBeEnabled();
    rerender(<Pagination page={3} pageCount={3} onPageChange={() => {}} />);
    expect(screen.getByRole('button', { name: '下一页' })).toBeDisabled();
  });

  it('controlled: reports the requested page and does not move by itself', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<Pagination page={2} pageCount={5} onPageChange={onPageChange} />);
    await user.click(screen.getByRole('button', { name: '第 4 页' }));
    expect(onPageChange).toHaveBeenLastCalledWith(4);
    expect(screen.getByRole('button', { name: '第 2 页' })).toHaveAttribute('aria-current', 'page');
    await user.click(screen.getByRole('button', { name: '第 2 页' }));
    expect(onPageChange).toHaveBeenCalledTimes(1);
  });

  it('uncontrolled with defaultPage; keyboard activation keeps focus on the pressed button', async () => {
    const user = userEvent.setup();
    render(<Pagination defaultPage={1} pageCount={5} />);
    const next = screen.getByRole('button', { name: '下一页' });
    next.focus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('button', { name: '第 2 页' })).toHaveAttribute('aria-current', 'page');
    expect(next).toHaveFocus();
  });

  it('focus moves to the current page when the pressed control becomes disabled at an edge', async () => {
    const user = userEvent.setup();
    render(<Pagination defaultPage={4} pageCount={5} />);
    const next = screen.getByRole('button', { name: '下一页' });
    next.focus();
    await user.keyboard('{Enter}');
    expect(next).toBeDisabled();
    expect(screen.getByRole('button', { name: '第 5 页' })).toHaveFocus();
  });

  it('jumping across an ellipsis keeps focus on the pressed page (it is always in the new list)', async () => {
    const user = userEvent.setup();
    render(<Pagination defaultPage={1} pageCount={40} />);
    // From page 1 the list is 1–5 … 40; jumping to 40 removes 2–5.
    await user.click(screen.getByRole('button', { name: '第 5 页' }));
    expect(screen.getByRole('button', { name: '第 5 页' })).toHaveFocus();
    await user.click(screen.getByRole('button', { name: '第 40 页' }));
    expect(screen.getByRole('button', { name: '第 40 页' })).toHaveFocus();
    expect(document.activeElement).not.toBe(document.body);
  });

  it('derives the page count from totalItems / pageSize and announces the range', () => {
    render(<Pagination page={3} totalItems={1000} pageSize={25} onPageChange={() => {}} />);
    expect(screen.getByRole('button', { name: '第 40 页' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('第 51–75 条，共 1000 条');
  });

  it('ellipses are hidden from assistive tech; disabled disables every control', () => {
    const { container } = render(<Pagination page={20} pageCount={40} onPageChange={() => {}} disabled />);
    const ellipses = container.querySelectorAll('.rl-pagination__ellipsis');
    expect(ellipses).toHaveLength(2);
    ellipses.forEach((e) => expect(e.closest('li')).toHaveAttribute('aria-hidden', 'true'));
    for (const button of screen.getAllByRole('button')) expect(button).toBeDisabled();
    expect(screen.getByRole('navigation')).toHaveAttribute('aria-disabled', 'true');
  });

  it('busy keeps every control focusable but ignores presses', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<Pagination page={2} pageCount={5} onPageChange={onPageChange} busy />);
    const next = screen.getByRole('button', { name: '下一页' });
    next.focus();
    await user.keyboard('{Enter}');
    expect(onPageChange).not.toHaveBeenCalled();
    expect(next).toHaveFocus();
    expect(next).toHaveAttribute('aria-disabled', 'true');
  });

  it('labels are overridable', () => {
    render(
      <Pagination
        page={1}
        pageCount={2}
        onPageChange={() => {}}
        labels={{ nav: 'Pages', previous: 'Prev', next: 'Next', page: (p) => `Page ${p}` }}
      />,
    );
    expect(screen.getByRole('navigation', { name: 'Pages' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Page 2' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
  });

  it('an explicit aria-label names the landmark (several pagers on one page)', () => {
    render(<Pagination pageCount={2} aria-label="结果分页" />);
    expect(screen.getByRole('navigation', { name: '结果分页' })).toBeInTheDocument();
  });
});

describe('Breadcrumb', () => {
  const path = [
    { label: '档案库', href: '#/' },
    { label: '样本', href: '#/samples' },
    { label: '海洋来源', href: '#/samples/ocean' },
    { label: '2026 批次', href: '#/samples/ocean/2026' },
    { label: 'ARC-1024' },
  ];

  it('is a named nav with an ordered list; the last item is the current page', () => {
    render(<Breadcrumb items={path.slice(0, 3).concat(path[4]!)} maxItems={0} />);
    const nav = screen.getByRole('navigation', { name: '路径' });
    const items = within(nav).getAllByRole('listitem');
    expect(items).toHaveLength(4);
    expect(within(nav).getByRole('link', { name: '样本' })).toHaveAttribute('href', '#/samples');
    expect(within(nav).getByText('ARC-1024')).toHaveAttribute('aria-current', 'page');
    expect(within(nav).queryByRole('link', { name: 'ARC-1024' })).toBeNull();
    // Separators are CSS-only: the list text has no "//".
    expect(nav.textContent).not.toContain('//');
  });

  it('collapses middle items and expands in place, moving focus to the first revealed link', async () => {
    const user = userEvent.setup();
    render(<Breadcrumb items={path} maxItems={4} />);
    expect(screen.getAllByRole('link').map((a) => a.textContent)).toEqual(['档案库', '2026 批次']);
    const expand = screen.getByRole('button', { name: '显示全部 5 级路径' });
    await user.click(expand);
    await act(() => new Promise((r) => requestAnimationFrame(() => r(null))));
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getAllByRole('link').map((a) => a.textContent)).toEqual(['档案库', '样本', '海洋来源', '2026 批次']);
    expect(screen.getByRole('link', { name: '样本' })).toHaveFocus();
  });

  it('long labels keep their full text in the accessibility tree and as a title', () => {
    const long = '对所有新建的实验记录默认启用双人复核流程的长期档案库分区';
    render(<Breadcrumb items={[{ label: '档案库', href: '#/' }, { label: long }]} />);
    const current = screen.getByText(long);
    expect(current).toHaveAttribute('title', long);
    expect(current).toHaveTextContent(long);
  });

  it('renderLink plugs in a router link', () => {
    render(
      <Breadcrumb
        items={[{ label: '档案库', href: '/archive' }, { label: '当前' }]}
        renderLink={({ href, className, children }) => (
          <a data-router="yes" href={href} className={className}>
            {children}
          </a>
        )}
      />,
    );
    expect(screen.getByRole('link', { name: '档案库' })).toHaveAttribute('data-router', 'yes');
  });

  it('RecordHeader trail renders through Breadcrumb with the same landmark and never collapses', () => {
    render(<RecordHeader title="分子结构观测" trail={path} />);
    const nav = screen.getByRole('navigation', { name: '档案位置' });
    expect(nav).toHaveClass('rl-breadcrumb', 'rl-record__trail');
    expect(within(nav).getAllByRole('listitem')).toHaveLength(5);
    expect(within(nav).queryByRole('button')).toBeNull();
  });
});

describe('Progress', () => {
  it('is a labelled progressbar with value text', () => {
    render(<Progress label="导出档案" value={42} description="已处理 420 / 1000 条。" />);
    const bar = screen.getByRole('progressbar', { name: '导出档案' });
    expect(bar).toHaveAttribute('aria-valuenow', '42');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
    expect(bar).toHaveAttribute('aria-valuetext', '42%');
    expect(bar).toHaveAccessibleDescription('已处理 420 / 1000 条。');
    expect(screen.getByText('42%')).toBeVisible();
  });

  it('indeterminate has no value and is announced as in progress', () => {
    render(<Progress label="索引重建" value={null} />);
    const bar = screen.getByRole('progressbar', { name: '索引重建' });
    expect(bar).not.toHaveAttribute('aria-valuenow');
    expect(bar).toHaveAttribute('aria-valuetext', '进行中');
    expect(bar).toHaveAttribute('data-indeterminate');
  });

  it('custom range, value text and spoken text', () => {
    render(<Progress label="实验步骤" value={3} max={5} valueText="3 / 5 步" getValueText={(_, v) => `第 ${v} 步，共 5 步`} />);
    const bar = screen.getByRole('progressbar', { name: '实验步骤' });
    expect(bar).toHaveAttribute('aria-valuetext', '第 3 步，共 5 步');
    expect(screen.getByText('3 / 5 步')).toBeVisible();
    expect(bar).toHaveAttribute('data-progressing');
    expect(bar).not.toHaveAttribute('data-complete');
  });

  it('marks completion', () => {
    render(<Progress label="完成" value={100} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('data-complete');
  });
});

describe('Meter', () => {
  it('getMeterState follows native <meter> regions', () => {
    const t = { min: 0, max: 100, low: 30, high: 80 };
    expect(getMeterState(50, { ...t, optimum: 50 })).toBe('optimum');
    expect(getMeterState(90, { ...t, optimum: 50 })).toBe('suboptimum');
    expect(getMeterState(90, { ...t, optimum: 10 })).toBe('critical');
    expect(getMeterState(10, { ...t, optimum: 10 })).toBe('optimum');
    expect(getMeterState(99, { min: 0, max: 100 })).toBe('optimum');
  });

  it('is a labelled meter; the threshold state is spoken and shown as text, not only colour', () => {
    render(
      <Meter
        label="存储占用"
        value={86}
        low={60}
        high={80}
        optimum={20}
        stateLabels={{ suboptimum: '偏高', critical: '接近上限' }}
      />,
    );
    const meter = screen.getByRole('meter', { name: '存储占用' });
    expect(meter).toHaveAttribute('aria-valuenow', '86');
    expect(meter).toHaveAttribute('aria-valuetext', '86%，接近上限');
    expect(meter).toHaveAttribute('data-tone', 'danger');
    expect(screen.getByText('接近上限')).toBeVisible();
  });

  it('without thresholds is neutral and has no state text', () => {
    render(<Meter label="样本温度" value={-18} min={-40} max={0} getValueText={(_, v) => `${v} °C`} />);
    const meter = screen.getByRole('meter', { name: '样本温度' });
    expect(meter).toHaveAttribute('aria-valuetext', '-18 °C');
    expect(meter).toHaveAttribute('data-tone', 'neutral');
  });
});

describe('Stat', () => {
  it('reads label then value; delta direction is spoken in words', () => {
    render(<Stat label="待复核记录" value={1280} unit="条" delta={{ value: -12, label: '较上周', tone: 'success' }} />);
    const list = screen.getByRole('term').closest('dl')!;
    expect(screen.getByRole('term')).toHaveTextContent('待复核记录');
    const [value, delta] = within(list).getAllByRole('definition');
    expect(value).toHaveTextContent('1,280条');
    expect(delta).toHaveTextContent('下降−12较上周');
    expect(delta).toHaveAttribute('data-tone', 'success');
  });

  it('a rise is neutral unless the caller says otherwise', () => {
    render(<Stat label="异常" value={3} delta={{ value: 2 }} />);
    const delta = screen.getAllByRole('definition')[1]!;
    expect(delta).toHaveAttribute('data-tone', 'neutral');
    expect(delta).toHaveTextContent('上升+2');
  });

  it('missing value shows a dash, reads as no data and never becomes 0', () => {
    render(<Stat label="今日新增" value={null} />);
    const value = screen.getByRole('definition');
    expect(value).toHaveTextContent('—无数据');
    expect(value).not.toHaveTextContent('0');
  });

  it('loading is busy and announced', () => {
    render(<Stat label="总数" value={10} loading />);
    expect(screen.getByRole('term').closest('dl')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('definition')).toHaveTextContent('正在加载');
    expect(screen.queryByText('10')).toBeNull();
  });
});
