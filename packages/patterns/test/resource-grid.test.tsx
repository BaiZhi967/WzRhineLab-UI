import * as React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ResourceGrid } from '../src';
import { patternsZhCN } from '../src';

interface Item {
  id: string;
  title: string;
  src?: string;
  badge?: string;
}

const items: Item[] = [
  { id: 'RES-1', title: '浅层水体照片', src: 'res-1.jpg', badge: '已归档' },
  { id: 'RES-2', title: '沉积物显微图像', src: 'res-2.jpg' },
  { id: 'RES-3', title: '同类资源（重名）' },
  { id: 'RES-4', title: '同类资源（重名）' },
];

function spec(item: Item) {
  return {
    thumbnail: item.src ? { src: item.src, alt: item.title, width: 640, height: 480 } : undefined,
    badge: item.badge,
    description: item.src ? '采样期间采集' : undefined,
  };
}

function Harness(props: Partial<React.ComponentProps<typeof ResourceGrid<Item>>>) {
  const [selected, setSelected] = React.useState<Set<string>>(new Set(['RES-2']));
  return (
    <ResourceGrid
      items={items}
      getItemId={(item) => item.id}
      getItemTitle={(item) => item.title}
      getItemSpec={spec}
      getItemLabel={(item) => `选择 ${item.title}`}
      selectedIds={selected}
      onSelectionChange={setSelected}
      onOpen={() => {}}
      label="资源集合"
      {...props}
    />
  );
}

describe('ResourceGrid structure', () => {
  it('renders a named list; the title is the open entry, the checkbox is separately reachable', () => {
    render(<Harness />);
    const list = screen.getByRole('list', { name: '资源集合' });
    expect(list).toBeInTheDocument();
    expect(within(list).getByRole('button', { name: '浅层水体照片' })).toBeInTheDocument();
    expect(within(list).getByRole('checkbox', { name: '选择 浅层水体照片' })).toBeInTheDocument();
    // Duplicate names stay distinct through stable ids.
    expect(within(list).getAllByRole('button', { name: '同类资源（重名）' })).toHaveLength(2);
  });

  it('thumbnails keep their intrinsic size and alternate text', () => {
    render(<Harness />);
    const img = screen.getByAltText('浅层水体照片');
    expect(img).toHaveAttribute('width', '640');
    expect(img).toHaveAttribute('height', '480');
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('items without a thumbnail stay fully operable', () => {
    render(<Harness />);
    expect(screen.queryByAltText('同类资源（重名）')).toBeNull();
    expect(screen.getAllByRole('checkbox', { name: /同类资源/ })).toHaveLength(2);
  });

  it('badge and description slots render per item', () => {
    render(<Harness />);
    expect(screen.getByText('已归档')).toBeInTheDocument();
    expect(screen.getAllByText('采样期间采集').length).toBe(2);
  });

  it('more actions render outside the open entry (no nested interactive controls)', () => {
    render(
      <Harness
        getItemSpec={(item) => ({ ...spec(item), moreActions: <button type="button">更多</button> })}
      />,
    );
    const open = screen.getByRole('button', { name: '浅层水体照片' });
    expect(within(open).queryByRole('button', { name: '更多' })).toBeNull();
    expect(screen.getAllByRole('button', { name: '更多' }).length).toBe(items.length);
  });
});

describe('ResourceGrid selection and opening', () => {
  it('preselected ids render checked', () => {
    render(<Harness />);
    expect(screen.getByRole('checkbox', { name: '选择 沉积物显微图像' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: '选择 浅层水体照片' })).not.toBeChecked();
  });

  it('toggling a checkbox reports the next id set', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(
      <Harness
        selectedIds={new Set(['RES-2'])}
        onSelectionChange={onSelectionChange}
      />,
    );
    await user.click(screen.getByRole('checkbox', { name: '选择 浅层水体照片' }));
    expect(onSelectionChange).toHaveBeenCalledWith(new Set(['RES-2', 'RES-1']));
  });

  it('opening reports the record id, distinct from selection', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    render(<Harness onOpen={onOpen} />);
    await user.click(screen.getByRole('button', { name: '沉积物显微图像' }));
    expect(onOpen).toHaveBeenCalledWith('RES-2');
    expect(screen.getByRole('checkbox', { name: '选择 沉积物显微图像' })).toBeChecked();
  });
});

describe('ResourceGrid item states', () => {
  it('a failed image degrades to a placeholder for that item only', () => {
    render(<Harness />);
    fireEvent.error(screen.getByAltText('浅层水体照片'));
    expect(screen.getByRole('img', { name: patternsZhCN.resourceGrid.imageFailed })).toBeInTheDocument();
    // Other items are unaffected.
    expect(screen.getByAltText('沉积物显微图像')).toBeInTheDocument();
  });

  it('a recovered src clears the failure state', () => {
    const { rerender } = render(<Harness />);
    fireEvent.error(screen.getByAltText('浅层水体照片'));
    rerender(
      <Harness
        items={items.map((item) => (item.id === 'RES-1' ? { ...item, src: 'res-1-retry.jpg' } : item))}
      />,
    );
    expect(screen.queryByRole('img', { name: patternsZhCN.resourceGrid.imageFailed })).toBeNull();
    expect(screen.getByAltText('浅层水体照片')).toHaveAttribute('src', 'res-1-retry.jpg');
  });

  it('loading status renders skeleton cards and announces busy once', () => {
    render(<Harness items={[]} status="loading" loadingRows={3} />);
    const list = screen.getByRole('list', { name: '资源集合' });
    expect(list).toHaveAttribute('aria-busy', 'true');
    expect(list.querySelectorAll('[data-loading]')).toHaveLength(3);
    // Skeleton cards are decorative: the loading fact is announced by one status region rather
    // than repeated once per placeholder card.
    expect(screen.getByRole('status')).toHaveTextContent(patternsZhCN.resourceGrid.loading);
    expect(within(list).queryByText(patternsZhCN.resourceGrid.loading)).toBeNull();
  });

  it('error status renders a retry entry', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<Harness items={[]} status="error" onRetry={onRetry} />);
    await user.click(screen.getByRole('button', { name: patternsZhCN.resourceGrid.retry }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('an empty ready grid renders the provided empty content', () => {
    render(<Harness items={[]} emptyText={<span>还没有任何资源</span>} />);
    expect(screen.getByText('还没有任何资源')).toBeInTheDocument();
  });
});
