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

  // 0.3.0-contracts §4.2: a busy control keeps focus (aria-disabled) instead of being natively
  // disabled, which would drop focus to <body> exactly while the batch action runs.
  it('a busy action stays focusable and announced, and drops repeat submissions', async () => {
    const user = userEvent.setup();
    const onRun = vi.fn();
    render(
      <SelectionToolbar
        selectedCount={2}
        actions={[
          { id: 'delete', label: '删除', onRun, busy: true },
          { id: 'export', label: '导出', onRun: () => {} },
        ]}
      />,
    );
    const busyButton = screen.getByRole('button', { name: '删除' });
    expect(busyButton).toHaveAttribute('aria-disabled', 'true');
    expect(busyButton).toHaveAttribute('aria-busy', 'true');
    // Not natively disabled: that is what would drop focus to <body>.
    expect(busyButton).not.toHaveAttribute('disabled');

    busyButton.focus();
    expect(busyButton).toHaveFocus();
    await user.click(busyButton);
    expect(onRun).not.toHaveBeenCalled();
    expect(busyButton).toHaveFocus();
    expect(document.body).not.toHaveFocus();

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
