import * as React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MotionConfig } from 'motion/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Alert, Button, Callout, DataTable, EmptyState, RhineProvider, Skeleton, Spinner, Stat } from '../src';
import type { AlertTone } from '../src';

let errors: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  errors = vi.spyOn(console, 'error');
});
afterEach(() => {
  expect(errors).not.toHaveBeenCalled();
  errors.mockRestore();
});

const tones: AlertTone[] = ['neutral', 'info', 'success', 'warning', 'danger'];

describe('Alert', () => {
  it('defaults to info, live off: no status / alert role', () => {
    const { container } = render(<Alert title="已保存草稿">内容</Alert>);
    const alert = container.querySelector('.rl-alert')!;
    expect(alert).toHaveAttribute('data-tone', 'info');
    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(alert.querySelector('[role]')).toBeNull();
  });

  it('live polite → role=status; assertive → role=alert; the role holds only the message', () => {
    const { rerender } = render(
      <Alert live="polite" title="已同步" action={<Button size="sm">查看</Button>} onDismiss={() => {}}>
        3 条记录已更新（示例）
      </Alert>,
    );
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('已同步3 条记录已更新（示例）');
    // Buttons are outside the live region so they are not read as part of the announcement.
    expect(within(status).queryByRole('button')).toBeNull();
    rerender(
      <Alert live="assertive" tone="danger" title="导出失败">
        请重试
      </Alert>,
    );
    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.getByRole('alert')).toHaveTextContent('导出失败请重试');
  });

  it('every tone has its own decorative icon and the tone attribute', () => {
    const { container } = render(
      <>
        {tones.map((tone) => (
          <Alert key={tone} tone={tone} title={tone} />
        ))}
      </>,
    );
    const alerts = container.querySelectorAll('.rl-alert');
    expect(alerts).toHaveLength(5);
    const shapes = new Set<string>();
    alerts.forEach((alert, i) => {
      expect(alert).toHaveAttribute('data-tone', tones[i]);
      const icon = alert.querySelector('svg.rl-alert__glyph')!;
      expect(icon).toHaveAttribute('aria-hidden', 'true');
      shapes.add(icon.innerHTML);
    });
    expect(shapes.size).toBe(5);
  });

  it('icon can be replaced or removed', () => {
    const { container, rerender } = render(<Alert icon={<svg data-testid="own" />} title="t" />);
    expect(screen.getByTestId('own').parentElement).toHaveAttribute('aria-hidden', 'true');
    rerender(<Alert icon={null} title="t" />);
    expect(container.querySelector('.rl-alert__icon')).toBeNull();
  });

  it('dismiss renders a named close button that calls onDismiss; no hidden state', async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    const { rerender } = render(<Alert title="提示" onDismiss={onDismiss} />);
    await user.click(screen.getByRole('button', { name: '关闭提示' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
    // The component does not hide itself: the caller decides.
    expect(screen.getByText('提示')).toBeInTheDocument();
    rerender(<Alert title="提示" onDismiss={onDismiss} dismissLabel="关闭校验提示" />);
    expect(screen.getByRole('button', { name: '关闭校验提示' })).toBeInTheDocument();
    rerender(<Alert title="提示" />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('renders title and body without a title too, and forwards native props', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Alert ref={ref} id="a1" className="own" data-testid="alert">
        只有正文
      </Alert>,
    );
    const alert = screen.getByTestId('alert');
    expect(ref.current).toBe(alert);
    expect(alert).toHaveClass('rl-alert', 'own');
    expect(alert).toHaveAttribute('id', 'a1');
    expect(alert.querySelector('.rl-alert__title')).toBeNull();
    expect(alert).toHaveTextContent('只有正文');
  });
});

describe('Callout', () => {
  it('is a note, never live, with no dismiss button', () => {
    render(
      <Callout tone="warning" title="关于样例数据">
        本页数值为示例。
      </Callout>,
    );
    const note = screen.getByRole('note');
    expect(note).toHaveAttribute('data-tone', 'warning');
    expect(note).toHaveTextContent('关于样例数据本页数值为示例。');
    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });
});

describe('EmptyState', () => {
  it('title is a paragraph by default and a heading at headingLevel', () => {
    const { rerender } = render(<EmptyState title="暂无记录" />);
    expect(screen.queryByRole('heading')).toBeNull();
    expect(screen.getByText('暂无记录').tagName).toBe('P');
    for (const level of [2, 3, 4, 5, 6] as const) {
      rerender(<EmptyState title="暂无记录" headingLevel={level} />);
      expect(screen.getByRole('heading', { level, name: '暂无记录' })).toBeInTheDocument();
    }
  });

  it('kind picks a decorative icon; icon overrides or removes it; size and kind are exposed', () => {
    const { container, rerender } = render(<EmptyState title="t" />);
    const shapes = new Set<string>();
    for (const kind of ['empty', 'no-results', 'no-permission', 'first-use'] as const) {
      rerender(<EmptyState title="t" kind={kind} size="sm" />);
      const root = container.querySelector('.rl-empty')!;
      expect(root).toHaveAttribute('data-kind', kind);
      expect(root).toHaveAttribute('data-size', 'sm');
      const icon = root.querySelector('svg.rl-empty__glyph')!;
      expect(icon).toHaveAttribute('aria-hidden', 'true');
      shapes.add(icon.innerHTML);
    }
    expect(shapes.size).toBe(4);
    rerender(<EmptyState title="t" icon={null} />);
    expect(container.querySelector('.rl-empty__icon')).toBeNull();
    rerender(<EmptyState title="t" icon={<svg data-testid="own" />} />);
    expect(screen.getByTestId('own').parentElement).toHaveAttribute('aria-hidden', 'true');
  });

  it('has no live role and renders description and action', () => {
    render(<EmptyState kind="no-results" title="没有符合条件的记录" description="调整筛选条件后重试。" action={<Button size="sm">清除筛选</Button>} />);
    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.getByText('调整筛选条件后重试。')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '清除筛选' })).toBeInTheDocument();
  });

  it('DataTable empty state renders EmptyState size=sm with emptyDescription; text unchanged', () => {
    render(
      <DataTable
        caption="结果"
        columns={[{ key: 'id', header: '编号' }]}
        rows={[] as { id: string }[]}
        getRowId={(r) => r.id}
        emptyDescription="换个关键词试试。"
        emptyAction={<button type="button">清除筛选</button>}
      />,
    );
    const cell = screen.getByRole('cell');
    expect(cell).toHaveClass('rl-table__empty');
    const empty = cell.querySelector('.rl-empty')!;
    expect(empty).toHaveAttribute('data-size', 'sm');
    expect(within(cell).getByText('没有符合条件的记录').tagName).toBe('P');
    expect(within(cell).getByText('换个关键词试试。')).toBeInTheDocument();
    expect(within(cell).getByRole('button', { name: '清除筛选' })).toBeInTheDocument();
    expect(screen.queryByRole('heading')).toBeNull();
    expect(cell).toHaveTextContent('没有符合条件的记录换个关键词试试。清除筛选');
  });
});

describe('Skeleton', () => {
  it('is always aria-hidden and passes sizes as custom properties', () => {
    const { container } = render(
      <div aria-busy="true">
        <Skeleton shape="block" width="12rem" height="var(--rl-space-16)" data-testid="block" />
        <Skeleton shape="circle" width="var(--rl-space-8)" />
        <Skeleton />
      </div>,
    );
    const all = container.querySelectorAll('.rl-skeleton');
    expect(all).toHaveLength(3);
    all.forEach((el) => expect(el).toHaveAttribute('aria-hidden', 'true'));
    const block = screen.getByTestId('block');
    expect(block).toHaveAttribute('data-shape', 'block');
    expect(block.style.getPropertyValue('--rl-skeleton-width')).toBe('12rem');
    expect(block.style.getPropertyValue('--rl-skeleton-height')).toBe('var(--rl-space-16)');
    expect(all[2]).toHaveAttribute('data-shape', 'text');
    expect((all[2] as HTMLElement).getAttribute('style')).toBeNull();
  });

  it('lines renders N text lines, the last marked for 60% width, in one hidden group', () => {
    const { container } = render(<Skeleton lines={3} width="20rem" />);
    const group = container.querySelector<HTMLElement>('.rl-skeleton-lines')!;
    expect(group).toHaveAttribute('aria-hidden', 'true');
    expect(group.style.getPropertyValue('--rl-skeleton-width')).toBe('20rem');
    const lines = group.querySelectorAll('.rl-skeleton');
    expect(lines).toHaveLength(3);
    expect([...lines].map((l) => l.hasAttribute('data-last'))).toEqual([false, false, true]);
  });

  it('DataTable and Stat loading use Skeleton and keep their old class names', () => {
    const { container } = render(
      <>
        <DataTable caption="结果" columns={[{ key: 'id', header: '编号' }]} rows={[] as { id: string }[]} getRowId={(r) => r.id} status="loading" loadingRows={2} />
        <Stat label="待复核" value={1} loading />
      </>,
    );
    const cells = container.querySelectorAll('.rl-table__skeleton');
    expect(cells).toHaveLength(2);
    cells.forEach((c) => expect(c).toHaveClass('rl-skeleton'));
    expect(container.querySelector('.rl-stat__skeleton')).toHaveClass('rl-skeleton');
    expect(container.querySelector('.rl-stat__skeleton')).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('Spinner', () => {
  it('without label: decorative', () => {
    const { container } = render(<Spinner />);
    const spinner = container.querySelector('.rl-spinner')!;
    expect(spinner).toHaveAttribute('aria-hidden', 'true');
    expect(spinner).not.toHaveAttribute('role');
    expect(spinner).toHaveAttribute('data-size', 'md');
  });

  it('with label: role=status with visually hidden text', () => {
    render(<Spinner size="lg" label="正在加载记录" />);
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('正在加载记录');
    expect(status).not.toHaveAttribute('aria-hidden');
    expect(status).toHaveAttribute('data-size', 'lg');
    expect(status.querySelector('.rl-visually-hidden')).toHaveTextContent('正在加载记录');
    expect(status.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('is static under reduced motion from MotionConfig or RhineProvider', () => {
    const { container, rerender } = render(<Spinner />);
    expect(container.querySelector('.rl-spinner')).not.toHaveAttribute('data-reduced');
    rerender(
      <MotionConfig reducedMotion="always">
        <Spinner />
      </MotionConfig>,
    );
    expect(container.querySelector('.rl-spinner')).toHaveAttribute('data-reduced', 'true');
    rerender(
      <RhineProvider motion="reduce" toasts={false}>
        <Spinner />
      </RhineProvider>,
    );
    expect(container.querySelector('.rl-spinner')).toHaveAttribute('data-reduced', 'true');
  });

  it('Button loading uses the public Spinner, decorative', () => {
    const { container } = render(<Button loading>保存</Button>);
    const spinner = container.querySelector('.rl-button__spinner .rl-spinner')!;
    expect(spinner).toHaveAttribute('aria-hidden', 'true');
    expect(spinner).not.toHaveAttribute('role');
    expect(screen.queryByRole('status')).toBeNull();
  });
});
