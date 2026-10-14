import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AppliedFilters } from '../src';
import { patternsZhCN } from '../src';

const base = [
  { id: 'category', label: '类别：样本' },
  { id: 'year', label: '年份：2026' },
  { id: 'station', label: '站点：ST-07' },
];

function Harness(props: Partial<React.ComponentProps<typeof AppliedFilters>>) {
  const [filters, setFilters] = React.useState(base);
  return (
    <AppliedFilters
      filters={filters}
      onRemove={(id) => setFilters((prev) => prev.filter((f) => f.id !== id))}
      onClearAll={() => setFilters([])}
      {...props}
    />
  );
}

describe('AppliedFilters structure', () => {
  it('renders a region with named remove buttons and a clear-all entry', () => {
    render(<Harness />);
    expect(screen.getByRole('region', { name: patternsZhCN.appliedFilters.region })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '移除 类别：样本' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: patternsZhCN.appliedFilters.clearAll })).toBeInTheDocument();
  });

  it('renders nothing without filters', () => {
    const { container } = render(<AppliedFilters filters={[]} />);
    expect(container.firstElementChild).toBeNull();
  });

  it('remove buttons announce the item through the removeLabel prop', () => {
    render(
      <AppliedFilters
        filters={[{ id: 'a', label: '类别：样本' }]}
        onRemove={() => {}}
        removeLabel={(f) => `去掉 ${String(f.label)}`}
      />,
    );
    expect(screen.getByRole('button', { name: '去掉 类别：样本' })).toBeInTheDocument();
  });

  it('duplicated labels stay distinct through their stable ids', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(
      <AppliedFilters
        filters={[
          { id: 'f1', label: '类别：样本' },
          { id: 'f2', label: '类别：样本' },
        ]}
        onRemove={onRemove}
      />,
    );
    const buttons = screen.getAllByRole('button', { name: '移除 类别：样本' });
    await user.click(buttons[1]!);
    expect(onRemove).toHaveBeenCalledWith('f2');
  });

  it('items without onRemove render as read-only (no button, no clear-all)', () => {
    render(<AppliedFilters filters={base.slice(0, 1)} />);
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByText('类别：样本')).toBeInTheDocument();
  });

  it('disabled items keep a visible but inert remove entry', () => {
    render(<Harness filters={[{ id: 'a', label: '类别：样本', disabled: true }]} />);
    expect(screen.getByRole('button', { name: '移除 类别：样本' })).toBeDisabled();
  });
});

describe('AppliedFilters focus contract (§4.2)', () => {
  it('removing an item moves focus to the next item’s remove button', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: '移除 类别：样本' }));
    expect(screen.getByRole('button', { name: '移除 年份：2026' })).toHaveFocus();
  });

  it('removing the last item moves focus to the previous one', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: '移除 站点：ST-07' }));
    expect(screen.getByRole('button', { name: '移除 年份：2026' })).toHaveFocus();
  });

  it('removing the final remaining item unmounts the region; the caller owns the focus fallback', async () => {
    const user = userEvent.setup();
    function SingleHarness() {
      const [filters, setFilters] = React.useState([{ id: 'only', label: '类别：样本' }]);
      const stableEntry = React.useRef<HTMLButtonElement | null>(null);
      return (
        <div>
          <button type="button" ref={stableEntry}>
            工具区稳定入口
          </button>
          <AppliedFilters
            filters={filters}
            onRemove={(id) => {
              setFilters((prev) => prev.filter((f) => f.id !== id));
              // Emptying the region unmounts it: the stable-entry fallback is the caller's
              // documented duty (0.3.0-contracts §4.2「清空入口或工具区稳定入口」).
              if (filters.length === 1) stableEntry.current?.focus();
            }}
            onClearAll={() => setFilters([])}
          />
        </div>
      );
    }
    render(<SingleHarness />);
    await user.click(screen.getByRole('button', { name: '移除 类别：样本' }));
    expect(screen.queryByRole('region', { name: patternsZhCN.appliedFilters.region })).toBeNull();
    expect(screen.getByRole('button', { name: '工具区稳定入口' })).toHaveFocus();
  });

  it('clear-all reports the intent', async () => {
    const user = userEvent.setup();
    const onClearAll = vi.fn();
    render(<AppliedFilters filters={base} onRemove={() => {}} onClearAll={onClearAll} />);
    await user.click(screen.getByRole('button', { name: patternsZhCN.appliedFilters.clearAll }));
    expect(onClearAll).toHaveBeenCalledTimes(1);
  });
});
