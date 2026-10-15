import * as React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SelectionToolbar } from '../src';
import { patternsZhCN } from '../src';

describe('SelectionToolbar structure', () => {
  it('renders a named toolbar with the selection count, clear entry and actions', () => {
    render(
      <SelectionToolbar
        selectedCount={3}
        onClear={() => {}}
        actions={[
          { id: 'delete', label: '删除', onRun: () => {} },
          { id: 'export', label: '导出', onRun: () => {}, icon: <span data-testid="icon" /> },
        ]}
      />,
    );
    const bar = screen.getByRole('toolbar', { name: patternsZhCN.selectionToolbar.region });
    expect(bar).toHaveTextContent('已选 3 条');
    expect(within(bar).getByRole('button', { name: '删除' })).toBeInTheDocument();
    expect(within(bar).getByRole('button', { name: '导出' })).toBeInTheDocument();
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('zero selection renders nothing', () => {
    const { container } = render(<SelectionToolbar selectedCount={0} />);
    expect(container.firstElementChild).toBeNull();
  });

  it('scope and total label render as provided (page / loaded / query remain explainable)', () => {
    render(
      <SelectionToolbar selectedCount={2} scope="page" totalLabel="当前页 25 条 / 已加载 100 条" onClear={() => {}} />,
    );
    expect(screen.getByText('当前页 25 条 / 已加载 100 条')).toBeInTheDocument();
  });

  it('label and clearLabel props override the built-in copy', () => {
    render(<SelectionToolbar selectedCount={1} label="批量操作区" clearLabel="取消选择" onClear={() => {}} />);
    expect(screen.getByRole('toolbar', { name: '批量操作区' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '取消选择' })).toBeInTheDocument();
  });

  it('no clear entry without onClear', () => {
    render(<SelectionToolbar selectedCount={1} />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});

describe('SelectionToolbar actions', () => {
  it('running an action reports the intent through onRun', async () => {
    const user = userEvent.setup();
    const onRun = vi.fn();
    render(<SelectionToolbar selectedCount={1} actions={[{ id: 'delete', label: '删除', onRun }]} />);
    await user.click(screen.getByRole('button', { name: '删除' }));
    expect(onRun).toHaveBeenCalledTimes(1);
  });

  it('a busy action disables its button (no double submission); other actions stay usable', () => {
    render(
      <SelectionToolbar
        selectedCount={2}
        actions={[
          { id: 'delete', label: '删除', onRun: () => {}, busy: true },
          { id: 'export', label: '导出', onRun: () => {} },
        ]}
      />,
    );
    expect(screen.getByRole('button', { name: '删除' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '导出' })).toBeEnabled();
  });

  it('a disabled action renders disabled without onRun wiring', () => {
    render(<SelectionToolbar selectedCount={2} actions={[{ id: 'x', label: '禁用项', disabled: true }]} />);
    expect(screen.getByRole('button', { name: '禁用项' })).toBeDisabled();
  });

  it('clear reports the intent (selection and recovery stay with the caller)', async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    render(<SelectionToolbar selectedCount={4} onClear={onClear} />);
    await user.click(screen.getByRole('button', { name: patternsZhCN.selectionToolbar.clear }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
